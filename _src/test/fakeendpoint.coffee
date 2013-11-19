assert = require( "assert" )
_ = require( "lodash" )

express = require( "express" )
request = require( "request" )

config = require( "../lib/config" )

class PaypalIPN extends require( "../lib/basic" )
	constructor: ->
		super
		@server = express()

		@init().routes().start()
		return

	init: =>
		@server.set( "title", "fake-IPN for node-payment" )
		@server.use( express.logger( "dev" ) )
		@server.use( express.urlencoded() )
		@server.use( express.json() )
		return @

	start: =>
		@server.listen( @config.listenport )
		return @

	routes: =>
		@server.post @config.receiverPath, @ppIpnReturn
		return @

	sendPaypalIPN: ( payment, status = "Completed" )=>

		_secure = config.get( "serverSecure" )
		_port =  config.get( "serverDefaultPort" )
		_host = config.get( "serverDefaultHost" )
		
		_url = if _secure then "https://" else "http://"
		_url += _host
		if _port isnt 80
			_url += ":" + _port

		_body =
			# receiver
			receiver_email: @config.receiver_email
			receiver_id: "S8XGHLYDW9T3S"
			residence_country: "US"
			
			# transaction
			test_ipn: 1
			transaction_subject: ""
			txn_id: "61E67681CH3238416"
			txn_type: "express_checkout"
			
			# buyer
			payer_email: "mp+test@tcs.de"
			payer_id: payment.payer_id
			payer_status: "verified"
			first_name: "Test"
			last_name: "User"
			address_city: "San+Jose"
			address_country: "United+States"
			address_country_code: "US"
			address_name: "Test+User"
			address_state: "CA"
			address_status: "confirmed"
			address_street: "1+Main+St"
			address_zip: "95131"
			
			# payment
			custom: payment.id
			handling_amount: 0
			item_name: payment.desc
			item_number: ""
			mc_currency: payment.currency
			mc_fee: "0.88"
			mc_gross: payment.amount
			payment_date: "20%3A12%3A59+Jan+13%2C+2009+PST"
			payment_fee: "0.88"
			payment_gross: "19.95"
			payment_status: status
			payment_type: "instant"
			protection_eligibility: "Eligible"
			quantity: 1
			shipping: "0.00"
			tax: "0.00"
			
			# other
			charset: "windows-1252"
			notify_version: "2.6"
			verify_sign: "AtkOfCXbDm2hu0ZELryHFjY-Vb7PAUvS6nMXgysbElEn9v-1XcmSoGtf"

		@lastQuery = JSON.stringify( _body )
		opt = 
			method: "POST"
			url: _url + config.get( "paypalipn" ).receiverPath
			form: _body

		request opt, ( err, resp, body )=>
			if err
				throw err
			return
		return

	ppIpnReturn: ( req, res )=>
		try
			assert.deepEqual( _.omit( req.body, [ "cmd" ] ), JSON.parse( @lastQuery or "{}" ) )
		catch
			res.send( "INVALID" )
			return

		res.send( "VERIFIED" )
		return

module.exports = new PaypalIPN()
