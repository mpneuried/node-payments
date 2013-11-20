config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

class PayPalIpn extends require( "../_base/main" )	
	initialize: =>
		@initialized = false
		@_currencies = config.get( "defaultcurrency" )
		#@initIPN()
		return

	init: ( @main )=>
		if not @initialized
			@initialized = true
			server = @main.getExpress()
			server.post @config.receiverPath, @verify, @input
		return

	verify: ( req, res, next )=>
		_formdata = _.extend( {}, req.body, cmd: "_notify-validate" )
		_url = ( if @config.secure then "https://" else "http://" ) + @config.host + ( if not @config.port? or @config.port isnt 80 then ":" + @config.port else "" )
		
		if not @config.listenport
			# use live ipn path
			_url += @config.ppReturnPath
		else
			# use internal ipn server for testing
			_url += @config.receiverPath
		opt = 
			method: "POST"
			url: _url
			form: _formdata

		request opt, ( err, resp, body )=>
			@info "VERIFY IPN MESSAGE", opt, err, body
			if err
				@error( err )
				res.send( "FAILED", 500 )
				return
			if body is "VERIFIED"
				next()
			else
				@error( err )
				res.send( "FAILED", 500 )
			return
		return

	input: ( req, res, next )=>
		_pid = req.body.custom
		_status = req.body.payment_status.toUpperCase()
		_receiver = req.body.receiver_email
		_currency = req.body.mc_currency
		_transaction = req.body.txn_id
		_atype = @_currencies[ _currency ]
		if _atype is "int"
			_amount = parseInt( req.body.mc_gross, 10 )
		else
			_amount = parseFloat( req.body.mc_gross, 10 )

		if @config.receiver_email? and _receiver isnt @config.receiver_email
			@_handleError( null, "EPPIPNINVALIDRECEIVER", { got: _receiver, needed: @config.receiver_email } )
			res.send( "FAILED", 500 )
			return

		@main.getPayment _pid, ( err, payment )=>
			if err
				if not config.get( "productionmode" ) and err?.name is "EPAYMENTNOTFOUND"
					@warning( "Payment not found in system so return a 200 to IPN" )
					res.send( "NOTFOUND", 200 )
					return
				@error( err )
				res.send( "FAILED", 500 )
				return
			
			@debug "IPN returned", _pid, payment.valueOf()

			if _currency isnt payment.currency
				@_handleError( null, "EPPIPNINVALIDCURRENCY", { got: _currency, needed: payment.currency } )
				res.send( "FAILED", 500 )
				return

			if Math.abs( _amount ) isnt payment.amount
				@_handleError( null, "EPPIPNINVALIDAMOUNT", { got: _amount, needed: payment.amount } )
				res.send( "FAILED", 500 )
				return

			payment.set( "state", _status )
			payment.set( "transaction", _transaction )
			payment.set( "verified", true )
			payment.persist ( err )=>
				if err
					@error( err )
					res.send( "FAILED", 500 )
					return
				@main.emit( "payment", "verfied", payment )
				@main.emit( "payment:#{payment.id}", "verfied", payment )
				@main.emit( "verfied", payment )
				res.send( "OK" )
				return
			return
		return

	ERRORS: =>
		@extend super, 
			"EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`."
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			
			"EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			

module.exports = new PayPalIpn()