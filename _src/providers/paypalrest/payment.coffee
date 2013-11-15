config = require( "../../lib/config" )

module.exports = class PaypalPayment extends require( "../_base/payment" )
	type: "paypal"

	constructor: ->
		@ppInited = false
		@ppClient = require('paypal-rest-sdk')
		super
		return

	setAuthentication: ( cb )=>
		if @ppInited
			cb( null, true )
			return
		@ppInited = true
		@ppClient.configure( config.get( "paypal" ) )
		cb( null, true )
		return

	requestProvider: ( auth, cb )=>
		# construct paypal JSON object
		_urls = @getUrls()

		_oPP =
			intent: "sale"
			payer: 
				payment_method: "paypal"
			transactions: [
				amount: 
					total: @amount
					currency: @currency
				description: @desc
			]
			redirect_urls: 
				return_url: _urls.success
				cancel_url: _urls.cancel

		@debug "send paypal payment", JSON.stringify( _oPP, true, 4 )
		@ppClient.payment.create _oPP, ( err, response )=>
			if err
				cb( err )
				return

			@info "PAYMENT RESPONSE", JSON.stringify( response, true, 4 )

			@debug "paypal payment links", response.links
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
