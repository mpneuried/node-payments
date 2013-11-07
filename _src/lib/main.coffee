config = require( "./config" )
_ = require( "lodash" )
_payments = require( "../." )

module.exports = class Payments extends require( "./basic" )
	constructor: ( options )->
		# initialize configuration
		config.init( options )
		super( options )

		@ready = false
		# proxy the methods until the module is ready
		@provider = @_waitUntil( @_provider )
		@createPayment = @_waitUntil( @_createPayment )
		@getStore = @_waitUntil( @_getStore )

		@providers = {}
		# init internal providers
		_providers = config.get( "providers" )
		@debug "list of standard providers", _providers
		for type in config.get( "providers" )
			try
				@addProvider( type, require( "../providers/#{type}/." ) )
			catch _err
				if _err?.customError?
					throw _err
					return
				@error( "init-provider", _err )
				@_handleError( null, "EREQUIREPROVIDER", type: type )
				return

		# init the payment store
		if not options?.paymentStore?
			@initPaymentStore( new _payments.MemoryStore() )
		else
			@initPaymentStore( options.paymentStore )

		# init the payment store
		if not options?.express? 
			@redir = new _payments.Redirects( @ )
		else
			@redir = new _payments.Redirects( @, options.express )
		return

	getUrls: ( pid = ":pid", prefix = "" )=>
		_baseroute = config.get( "baseroute" )
		if _.isFunction( _baseroute )
			success: _baseroute( @, "success", pid )
			cancel: _baseroute( @, "cancel", pid )
		else
			success: "#{ prefix }#{ _baseroute }success/#{ pid }"
			cancel: "#{ prefix }#{ _baseroute }cancel/#{ pid }"


	initPaymentStore: ( store )=>
		# check for existing methods
		for _m in [ "connect", "get", "set", "destroy" ] when not ( store[ _m ]? or _.isFunction( store[ _m ] ) )
			@_handleError( null, "ESTOREVALIDATION", method: _m )
			return

		store.on "connect", =>
			@debug "payment store connected"
			@ready = true
			@emit "ready"
			return
		store.on "disconnect", =>
			@warning "payment store disconnected"
			@ready = false
			return

		@pStore = store
		store.connect()
		return store

	_provider: ( type, cb )=>
		if @providers[ type ]?
			cb( null, @providers[ type ] )
		else
			@_handleError( cb, "EUINVALIDPROVIDER", type: type, types: Object.keys( @providers ) )
		return

	_createPayment: ( type, cb )=>
		@_provider type, ( err, _prov )=>
			if err
				cb( err )
				return
			cb( null, _prov.create() )
			return
		return

	addProvider: ( pname, Provider )=>
		_provider = new Provider( @ ) 

		@providers[ pname ] = _provider
		@debug "added provider `#{pname}`"
		return _provider

	_getStore: ( cb )=>
		cb( null, @pStore )
		return

	ERRORS: =>
		@extend super, 
			"EREQUIREPROVIDER": "The provider `<%= type %>` cannot be required."
			"EUINVALIDPROVIDER": "The provider `<%= type %>` is not valid. Please use one of `<%= types %>`."
			"ESTOREVALIDATION": "The user payment store misses a method called `.<%= method %>()`."