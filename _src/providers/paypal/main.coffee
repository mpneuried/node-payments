config = require( "../../lib/config" )
_ = require( "lodash" )

module.exports = class PayPal extends require( "../_base/main" )	
	payment: require( "./payment" )

	initialize: =>
		@initIPN()
		return

	initIPN: =>
		require( "./ipn" ).init( @main )
		return