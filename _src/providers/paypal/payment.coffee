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

	execProvider: ( auth, cb )=>
		# construct paypal JSON object
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
				return_url: "http://localhost:3000/success"
				cancel_url: "http://localhost:3000/cancel"

		@debug "send paypal payment", JSON.stringify( _oPP, true, 4 )
		@ppClient.payment.create _oPP, ( err, response )=>
			if err
				cb( err )
				return
			@pay_id = response.id

			@debug "paypal payment links", response.links
			# get the regular link
			for link in response.links when link.rel is "self"
				cb( null, link.href, link.method )
				return

			cb( null, response.links )
			return
		return