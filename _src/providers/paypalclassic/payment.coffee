config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

module.exports = class PaypalClassicPayment extends require( "../_base/payment" )
	type: "paypalclassic"

	initialize: =>
		@_currencies = config.get( "defaultcurrency" )
		@ppcConfig = config.get( "paypalclassic" )
		return

	setAuthentication: ( cb )=>
		headers = 
			"X-PAYPAL-SECURITY-USERID": @ppcConfig.userid
			"X-PAYPAL-SECURITY-PASSWORD": @ppcConfig.password
			"X-PAYPAL-SECURITY-SIGNATURE": @ppcConfig.signature
			"X-PAYPAL-APPLICATION-ID": @ppcConfig.application_id
			"X-PAYPAL-REQUEST-DATA-FORMAT": "JSON"
			"X-PAYPAL-RESPONSE-DATA-FORMAT": "JSON"

		cb( null, headers )
		return

	requestProvider: ( headers, cb )=>
		# construct paypal JSON object
		_urls = @getUrls()

		opt = 
			uri: @ppcConfig.endpoint
			method: "POST"
			headers: headers
			json:
				actionType: "PAY"
				currencyCode: @currency
				receiverList:
					receiver: [
						amount: @amount
						email: @ppcConfig.receiver_email
					]
				returnUrl: _urls.success
				cancelUrl: _urls.cancel
				requestEnvelope: 
					errorLanguage: "en_US"
					detailLevel: "ReturnAll"


		#@debug "send paypal payment", JSON.stringify( opt, true, 4 )
		request opt, ( err, response, body )=>
			if err
				cb( err )
				return

			@debug "paypal payment links", response, body
			# get the regular link
			for link in response.links when link.rel is "approval_url"
				cb( null, response.id, link.href )
				return

			cb( null, response.id, response.links )
			return
		return

	executeProvider: ( token, auth, cb )=>
		@ppClient.payment.execute @pay_id, { payer_id: @payer_id }, {}, ( err, response )=>
			if err
				cb( err )
				return
			@info "EXEC RESPONSE", JSON.stringify( response, true, 4 )
			cb( null, response.state.toUpperCase(), response )
			return
		return
