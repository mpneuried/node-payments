querystring = require( "querystring" )
config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

module.exports = class PaypalClassicPayment extends require( "../_base/payment" )
	type: "paypalclassic"

	initialize: =>
		@_currencies = config.get( "defaultcurrency" )
		@ppcConfig = config.get( "paypalclassic" )
		@ppIpnConfig = config.get( "paypalipn" )
		return

	setAuthentication: ( cb )=>

		data = 
			USER: @ppcConfig.userid
			PWD: @ppcConfig.password
			SIGNATURE: @ppcConfig.signature

		cb( null, data )
		return

	requestProvider: ( auth, cb )=>
		# construct paypal JSON object
		_urls = @getUrls()

		data =
			VERSION: 98
			METHOD: "SetExpressCheckout"
			LOCALECODE: @ppcConfig.localcode
			PAYMENTREQUEST_0_PAYMENTACTION: "SALE"
			REQCONFIRMSHIPPING: 0
			NOSHIPPING: 1
			ALLOWNOTE: 0
			SOLUTIONTYPE: "Sole"
			LANDINGPAGE: "Billing"
			PAYMENTREQUEST_0_AMT: @amount
			PAYMENTREQUEST_0_CURRENCYCODE: @currency
			PAYMENTREQUEST_0_CUSTOM: @id
			L_PAYMENTREQUEST_0_NUMBER0: 1
			L_PAYMENTREQUEST_0_NAME0: @desc
			L_PAYMENTREQUEST_0_QTY0: 1
			L_PAYMENTREQUEST_0_AMT0: @amount
			RETURNURL: _urls.success
			CANCELURL: _urls.cancel

		opt = 
			url: @ppcConfig.endpoint
			method: "POST"
			form: @extend( data, auth )
				

		@debug "send paypal payment", JSON.stringify( opt, true, 4 )
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

			link = _.template( @ppcConfig.linkTemplate, token: body.TOKEN )
			@debug "paypal payment response", body, link

			cb( null, body.TOKEN, link )

			return
		return

	executeProvider: ( token, auth, cb )=>

		data =
			VERSION: 98
			METHOD: "DoExpressCheckoutPayment"
			LOCALECODE: @ppcConfig.localcode
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
			url: @ppcConfig.endpoint
			method: "POST"
			form: @extend( data, auth )
				

		@debug "send paypal payment", JSON.stringify( opt, true, 4 )
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
