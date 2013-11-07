_ = require( "lodash" )
uuid = require( "uuid" )
config = require( "../../lib/config" )

module.exports = class BasePayment extends require( "../../lib/basic" )
	type: "_base"
	constructor: ( @ownProvider, data, options )->
		super( options )

		@_data = {}

		@currencies = config.get( "defaultcurrency" )

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

		@set( data )
		return

	set: ( _k, _v )=>
		_keys = [ "type", "amount", "currency", "desc", "state", "pay_id" ]
		if _.isObject( _k )
			for _ok, _ov of data when _ok in _keys
				@set( _ok, _ov )
		else if _k in _keys and _v?
			@[ _k ] = _v
		return @

	valueOf: =>
		_ret = {}
		for _k in [ "id", "type", "amount", "currency", "desc", "state", "pay_id" ]
			_ret[ _k ] = @[ _k ]
		return _ret

	exec: ( cb )=>
		if not @validate( cb )
			return

		@state = "EXEC"

		# init the authentication
		@setAuthentication ( err, auth )=>
			if err
				cb( err )
				return

			# execute the payment
			@execProvider auth, ( err, result )=>
				if err
					cb( err )
					return
				@emit( "exec", @ )
				cb( null, result )
				return
			return
		return

	setAuthentication: ( cb )=>
		@_handleError( cb, "ENOTIMPLEMENTED", method: "setAuthentication" )
		return

	getUrls: =>
		_econfig = config.get( "serverConfig" )
		
		_pre = if _econfig.secure then "https://" else "http://"
		_pre += _econfig.host
		if _econfig.port isnt 80
			_pre += ":" + _econfig.port

		return @ownProvider.main.getUrls( @id, _pre )

	# (G/S)ETTER for `amount`
	_getAmount: =>
		return @_data.amount or 0

	_setAmount: ( val )=>
		@_data.amount = val
		return

	# (G/S)ETTER for `currency`
	_getCurrency: =>
		return @_data.currency or config.get( "defaultcurrency" )

	_setCurrency: ( val )=>
		if not @currencies[ val ]?
			@_handleError( null, "ECURRENCYREFUSE", currency: val, avail: Object.keys( @currencies ).join( ", " ) )
			return

		@_data.currency = val
		return

	# (G/S)ETTER for `desc`
	_getDesc: =>
		return @_data.desc or ""

	_setDesc: ( val )=>
		if not _.isString( val )
			@_handleError( null, "EDESCRIPTIONINVALID" )
			return

		@_data.desc = val
		return

	# (G/S)ETTER for `state`
	_getState: =>
		return @_data.state or "NEW"

	_setState: ( val )=>
		_states = [ "NEW", "EXEC", "PENDING", "APPROVED" ]
		if val in _states
			@_data.state = val
			return
		else
			@warning "tried to set a invalid state: `#{val}`"
		return

	# (G/S)ETTER for `state`
	_getState: =>
		return @_data.state or "NEW"

	_setState: ( val )=>
		_states = [ "NEW", "EXEC", "PENDING", "APPROVED" ]
		if val in _states
			@_data.state = val
			@emit "state", val
			return
		else
			@warning "tried to set a invalid state: `#{val}`"
		return

	# (G/S)ETTER for `state`
	_getPayID: =>
		return @_data.pay_id or null

	_setPayID: ( val )=>
		if val?.length
			@_data.pay_id = val
			@state = "PENDING"
		return

	validate: ( cb )=>
		# check and fix the amount value
		_atype = @currencies[ @currency ]
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