_ = require( "lodash" )
uuid = require( "uuid" )
config = require( "../../lib/config" )

module.exports = class BasePayment extends require( "../../lib/basic" )
	type: "_base"
	constructor: ( @ownProvider, data, options )->
		super( options )

		@_data = {}

		@_currencies = config.get( "defaultcurrency" )

		if data?.id?.length
			@getter( "id","#{ data.id }" )
		else
			@getter( "id","#{@type}:#{uuid.v1()}" )

		@getter( "provider", @type )
		@define( "amount", @_getAmount, @_setAmount )
		@define( "currency", @_getCurrency, @_setCurrency )
		@define( "desc", @_getDesc, @_setDesc )
		@define( "state", @_getState, @_setState )
		@define( "pay_id", @_getPayID, @_setPayID )
		@define( "payer_id", @_getPayerID, @_setPayerID )

		@getter( "data", @_getData, false )

		@set( data )
		return

	set: ( _k, _v, _trigger = true )=>
		_noSetKeys = [ "id" ]
		if _.isObject( _k )
			for _ok, _ov of _k
				@set( _ok, _ov, false )
			@emit "changed", @data

		else if _v? and _k not in _noSetKeys and not _.isFunction( _v )
			@_data[ _k ] = _v
			@emit "changed:#{ _k }", _v
			if _trigger
				@emit "changed", @data
		return @

	get: ( _k )=>
		return @_data[ _k ]

	valueOf: =>@data

	toString: ( format = false )=>
		if format
			return JSON.stringify( @data, true, 4 )
		else
			return JSON.stringify( @data )

	persist: ( cb )=>
		@ownProvider.main.getStore ( err, store )=>
			if err
				cb( err )
				return
			store.set @, ( err )=>
				if err
					cb( err )
					return
				cb( null )
				return
			return
		return

	exec: ( cb )=>
		if not @validate( cb )
			return

		# init the authentication
		@setAuthentication ( err, auth )=>
			if err
				cb( err )
				return

			# execute the payment
			@requestProvider auth, ( err, id, link )=>
				if err
					cb( err )
					return
				@set( "state", "CREATED" )
				@set( "pay_id", id )
				@emit( "exec", @ )
				@emit( "dispose", @ )
				cb( null, link )
				return
			return
		return

	_executePayment: ( token, cb )=>
		if not @validate( cb )
			return

		@state = "ACCEPTED"

		# init the authentication
		@setAuthentication ( err, auth )=>
			if err
				cb( err )
				return

			# execute the payment
			@executeProvider token, auth, ( err, state, result )=>
				if err
					cb( err )
					return

				@set( "state", state )
				@emit( "approved", @ )
				@emit( "dispose", @ )
				cb( null )
				return
			return
		return

	setAuthentication: ( cb )=>
		@_handleError( cb, "ENOTIMPLEMENTED", method: "setAuthentication" )
		return

	requestProvider: ( auth, cb )=>
		@_handleError( cb, "ENOTIMPLEMENTED", method: "setAuthentication" )
		return

	executeProvider: ( auth, cb )=>
		@_handleError( cb, "ENOTIMPLEMENTED", method: "setAuthentication" )
		return

	getUrls: =>
		_econfig = config.get( "serverConfig" )
		
		_pre = if _econfig.secure then "https://" else "http://"
		_pre += _econfig.host
		if _econfig.port isnt 80
			_pre += ":" + _econfig.port

		return @ownProvider.main.getUrls( @id, _pre )

	# (G/S)ETTER for `data`
	_getData: =>
		return @extend( {}, @_data,
			id: @id
			amount: @amount
			currency: @currency
			provider: @provider
			desc: @desc
			state: @state
			pay_id: @pay_id
			payer_id: @payer_id
		)

	# (G/S)ETTER for `amount`
	_getAmount: =>
		return @get( "amount" ) or 0

	_setAmount: ( val )=>
		@set( "amount", val )
		return

	# (G/S)ETTER for `currency`
	_getCurrency: =>
		return @get( "currency" ) or config.get( "defaultcurrency" )

	_setCurrency: ( val )=>
		if not @_currencies[ val ]?
			@_handleError( null, "ECURRENCYREFUSE", currency: val, avail: Object.keys( @_currencies ).join( ", " ) )
			return

		@set( "currency", val )
		return

	# (G/S)ETTER for `desc`
	_getDesc: =>
		return @get( "desc" ) or ""

	_setDesc: ( val )=>
		if not _.isString( val )
			@_handleError( null, "EDESCRIPTIONINVALID" )
			return

		@set( "desc", val )
		return

	# (G/S)ETTER for `state`
	_getState: =>
		return @get( "state" ) or "NEW"

	_setState: ( val )=>
		_states = [ "NEW", "CREATED", "ACCEPTED", "PENDING", "APPROVED", "COMPLETED" ]
		if val in _states and _states.indexOf( @state ) <= _states.indexOf( val ) 
			@set( "state", val )
			return
		else
			@warning "tried to set a invalid state: `#{val}`"
		return

	# (G/S)ETTER for `pay_id`
	_getPayID: =>
		return @get( "pay_id" ) or null

	_setPayID: ( val )=>
		if val?.length
			@set( "pay_id", val )
		return

	# (G/S)ETTER for `payer_id`
	_getPayerID: =>
		return @get( "payer_id" ) or null

	_setPayerID: ( val )=>
		if val?.length
			@set( "payer_id", val )
		return

	validate: ( cb )=>
		# check and fix the amount value
		_atype = @_currencies[ @currency ]
		_amount = @amount
		if _atype is "int"
			@amount = parseInt( @amount, 10 )
		else
			@amount = parseFloat( @amount, 10 )

		if isNaN( @amount )
			@_handleError( cb, "EAMOUNTINVALID", type: _atype )
			return false
		else if @amount <= 0
			@_handleError( cb, "EAMOUNTEMPTY" )
			return false


		if @desc.length <= 0
			@_handleError( cb, "EDESCRIPTIONEMPTY" )
			return false

		return true

	ERRORS: =>
		@extend super, 
			"ENOTIMPLEMENTED": "The method `<%= method %>` has to be defined per provider."
			"ECURRENCYREFUSE": "The currency `<%= currency %>` is not supported. Please use one of `<%= avail %>`"
			"EDESCRIPTIONEMPTY": "The description is empty."
			"EDESCRIPTIONINVALID": "The description has to be type of string."
			"EAMOUNTEMPTY": "You tried to pay nothing. Please set the ammount`."
			"EAMOUNTINVALID": "The amount has to be a of type <%= type %>"