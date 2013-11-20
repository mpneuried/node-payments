querystring = require( "querystring" )
crypto = require( "crypto" )
moment = require( "moment" )

config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

module.exports = class ClickAndBuyPayment extends require( "../_base/payment" )
	type: "clickandbuy"

	initialize: =>
		@_currencies = config.get( "defaultcurrency" )
		@cbConfig = config.get( "clickandbuy" )
		return

	createToken: ( pid, secret )=>
		ts = moment().utc().format( "YYYYMMDDHHmmSS" )
		_hs = "#{pid}::#{secret}::#{ts}"
		_hash = crypto.createHash('sha1').update( _hs ).digest('hex')

		return ts + "::" + _hash

	setAuthentication: ( cb )=>

		authHeader = """
	<authentication>
		<merchantID>#{ @cbConfig.merchantid }</merchantID>
		<projectID>#{ @cbConfig.projectid }</projectID>
		<token>#{ @createToken( @cbConfig.projectid, @cbConfig.cryptokey ) }aaa</token>
	</authentication>
		"""


		cb( null, authHeader )
		return

	requestProvider: ( authHeader, cb )=>
		# construct clickandbuy JSON object
		_urls = @getUrls()

		_xml = """<?xml version="1.0" encoding="UTF-8"?>
<payRequest_Request xmlns="http://api.clickandbuy.com/webservices/pay_1_1_0/">
	#{authHeader}
	<details>
		<consumerCountry>#{@cbConfig.localcode}</consumerCountry>
		<amount>
			<amount>#{@amount}</amount>
			<currency>#{@currency}</currency>
		</amount>
		<orderDetails>
			<text>#{@desc}</text>
		</orderDetails>
		<successURL>#{_urls.success}</successURL>
		<failureURL>#{_urls.cancel}</failureURL>
		<externalID>#{@id}</externalID>
	</details>
</payRequest_Request>
		"""	

		@debug "raw xml", _xml

		_xml = new Buffer( _xml, 'utf8' )

		opt = 
			url: @cbConfig.endpoint
			method: "POST"
			body: _xml
			headers:
				"User-Agent": "node-payments",
				"Accept" : "application/xml,text/xml",
				"Accept-Encoding": "utf-8",
				"Accept-Charset": "utf-8",
				"Connection": "Keep-Alive"
				#"Content-Length": _xml.length
				"Content-Type": "text/xml; charset=utf-8"



		@debug "send clickandbuy payment", opt
		_req = request opt, ( err, response, body )=>

			@debug "clickandbuy payment response", body

			cb( "not-implemented" ) #, body.TOKEN, link )
			return
		return

	executeProvider: ( token, auth, cb )=>

		data =
			VERSION: 98
			METHOD: "DoExpressCheckoutPayment"
			LOCALECODE: @cbConfig.localcode
			PAYMENTREQUEST_0_PAYMENTACTION: "SALE"
			PAYMENTREQUEST_0_AMT: @amount
			PAYMENTREQUEST_0_CURRENCYCODE: @currency
			L_PAYMENTREQUEST_0_NUMBER0: 1
			L_PAYMENTREQUEST_0_NAME0: @desc
			L_PAYMENTREQUEST_0_QTY0: 1
			L_PAYMENTREQUEST_0_AMT0: @amount
			token:@pay_id
			payerid:@payer_id

		opt = 
			url: @cbConfig.endpoint
			method: "POST"
			form: @extend( data, auth )
				

		@debug "send clickandbuy payment", JSON.stringify( opt, true, 4 )
		request opt, ( err, response, rbody )=>
			body = querystring.parse( rbody )
			if err or body?.error? or body?.ACK isnt "Success"
				if err
					cb( err )
				else if body?.error?
					cb( _.first( body?.error ) )
				else
					cb( body )
				return

			_state = body.PAYMENTINFO_0_PAYMENTSTATUS.toUpperCase()
			@info "EXEC RESPONSE", JSON.stringify( body, true, 4 )

			cb( null, _state )
			
			return
		return
