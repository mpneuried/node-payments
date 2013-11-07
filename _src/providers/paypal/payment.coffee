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
			@pay_id = response.id

			@debug "paypal payment links", response.links
			# get the regular link
			for link in response.links when link.rel is "approval_url"
				cb( null, link.href )
				return

			cb( null, response.links )
			return
		return