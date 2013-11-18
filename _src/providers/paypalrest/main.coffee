config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

module.exports = class PayPalRest extends require( "../_base/main" )	
	payment: require( "./payment" )

	initialize: =>
		@_currencies = config.get( "defaultcurrency" )
		@_ipnCnf = config.get( "paypalipn" )
		@initIPN()
		return

	initIPN: =>
		server = @main.getExpress()
		server.post @_ipnCnf.receiverPath, @answer200, @verifyPayPalIpn, @ipnInput
		return

	answer200: ( req, res, next )=>
		@debug "IPN Input", req.body
		res.send( "OK" )
		next()
		return

	verifyPayPalIpn: ( req, res, next )=>
		_formdata = _.extend( {}, req.body, cmd: "_notify-validate" )
		opt = 
			method: "POST"
			url: ( if @_ipnCnf.secure then "https://" else "http://" ) + @_ipnCnf.host + ( if not @_ipnCnf.port? or @_ipnCnf.port isnt 80 then ":" + @_ipnCnf.port else "" ) + @_ipnCnf.ppReturnPath
			form: _formdata

		request opt, ( err, resp, body )=>
			@info "VERIFY IPN MESSAGE", err, body
			if err
				@error( err )
				return
			if body is "VERIFIED"
				next()
			else
				@error( err )
			return
		return

	ipnInput: ( req, res )=>
		_pid = req.body.custom
		_status = req.body.payment_status.toUpperCase()
		_receiver = req.body.receiver_email
		_currency = req.body.mc_currency
		_atype = @_currencies[ _currency ]
		if _atype is "int"
			_amount = parseInt( req.body.mc_gross, 10 )
		else
			_amount = parseFloat( req.body.mc_gross, 10 )

		if _receiver isnt @_ipnCnf.receiver_email
			@_handleError( null, "EPPIPNINVALIDRECEIVER", { got: _receiver, needed: @_ipnCnf.receiver_email } )
			return

		@main.getPayment _pid, ( err, payment )=>
			if err
				@error( err )
				return
			
			@debug "IPN returned", _pid, payment.valueOf()

			if _currency isnt payment.currency
				@_handleError( null, "EPPIPNINVALIDCURRENCY", { got: _currency, needed: payment.currency } )
				return

			if Math.abs( _amount ) isnt payment.amount
				@_handleError( null, "EPPIPNINVALIDAMOUNT", { got: _amount, needed: payment.amount } )
				return

			payment.set( "state", _status )
			payment.set( "verified", true )
			payment.persist ( err )=>
				if _status is "COMPLETED"
					if err
						@error( err )
						return
					@main.emit( "payment", "verified", payment )
					@main.emit( "payment:#{payment.id}", "verified", payment )
				return
			return
		return

	ERRORS: =>
		@extend super, 
			"EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`."
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			