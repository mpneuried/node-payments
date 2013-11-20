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

		# init the payment store
		if not options?.express? 
			@redir = new _payments.Redirects( @ )
		else
			@redir = new _payments.Redirects( @, options.express )

		@providers = {}
		# init internal providers
		_providers = config.get( "providers" )
		@debug "list of standard providers", _providers
		for type in config.get( "providers" )
			try
				@addProvider( type, require( "../providers/#{type}/." ) )
			catch _err
				console.log _err.stack
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

		return

	getExpress: =>
		return @redir.server

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

	_createPayment: ()=>
		[ args..., cb ] = arguments
		[ type, data ] = args
		@_provider type, ( err, _prov )=>
			if err
				cb( err )
				return
			cb( null, _prov.create( data ) )
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

	onSuccessReturn: ( id, token, payer_id, cb )=>
		@getPayment id, ( err, payment )=>
			if err
				cb( err )
				return
			payment.payer_id = payer_id
			@debug "payment for execution", payment.valueOf()
			payment._executePayment token, ( err )=>
				if err
					cb( err )
					return
				cb( null, payment )
			return
		return

	onCancelReturn: ( id, cb )=>
		@getPayment id, ( err, payment )=>
			if err
				cb( err )
				return
			payment.cancel( cb )

			return
		return

	getPayment: ( id, cb )=>
		@getStore ( err, store )=>
			if err
				cb( err )
				return
			store.get id, ( err, data )=>
				if err
					cb( err )
					return
				if not data?
					@_handleError( cb, "EPAYMENTNOTFOUND", id: id )
				@debug "got data from store", data
				@createPayment data?.provider, data, ( err, payment )=>
					if err
						cb( err )
						return
					cb( null, payment)
					return
				return
			return
		return

	ERRORS: =>
		@extend super, 
			"EPAYMENTNOTFOUND": "the Payment with id `<%= id %>` is not availible."
			"EREQUIREPROVIDER": "The provider `<%= type %>` cannot be required."
			"EUINVALIDPROVIDER": "The provider `<%= type %>` is not valid. Please use one of `<%= types %>`."
			"ESTOREVALIDATION": "The user payment store misses a method called `.<%= method %>()`."