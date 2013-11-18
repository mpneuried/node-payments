config = require( "../../lib/config" )
_ = require( "lodash" )

module.exports = class PayPalClassic extends require( "../_base/main" )	
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
		@info "IPN Input", req

		res.send( "OK" )
		next()
		return

	verifyPayPalIpn: ( req, res, next )=>
		qs = _.extend( {}, req.query, cmd: "_notify-validate" )
		opt = 
			method: "GET"
			url: ( if @_ipnCnf.secure then "https://" else "http://" ) + @_ipnCnf.host + ( if not @_ipnCnf.port? or @_ipnCnf.port isnt 80 then ":" + @_ipnCnf.port else "" ) + @_ipnCnf.ppReturnPath
			qs: qs

		request opt, ( err, resp, body )=>
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
		_pid = req.query.custom
		_status = req.query.payment_status.toUpperCase()
		_receiver = req.query.receiver_email
		_currency = req.query.mc_currency
		_atype = @_currencies[ _currency ]
		if _atype is "int"
			_amount = parseInt( req.query.mc_gross, 10 )
		else
			_amount = parseFloat( req.query.mc_gross, 10 )


		if _receiver isnt @_ipnCnf.receiver_email
			@_handleError( null, "EPPIPNINVALIDRECEIVER", { got: _receiver, needed: @_ipnCnf.receiver_email } )
			return
		@info "IPN Input ", _pid, _status, req.body

		@main.getPayment _pid, ( err, payment )=>
			if err
				@error( err )
				return
			#console.log _pid, payment.valueOf()			


			if _currency isnt payment.currency
				@_handleError( null, "EPPIPNINVALIDCURRENCY", { got: _currency, needed: payment.currency } )
				return

			if _amount isnt payment.amount
				@_handleError( null, "EPPIPNINVALIDAMOUNT", { got: _amount, needed: payment.amount } )
				return

			payment.set( "state", _status )
			payment.set( "verified", true )
			payment.persist ( err )=>
				if _status is "COMPLETED"
					if err
						@error( err )
						return
					@main.emit( "payment:payed", payment )
					@main.emit( "payed:#{payment.id}", payment )
				return
			return
		return

	ERRORS: =>
		@extend super, 
			"EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`."
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			