config = require( "../../lib/config" )
_ = require( "lodash" )

module.exports = class CLickAndBuy extends require( "../_base/main" )	
	payment: require( "./payment" )

	initialize: =>
		@initMMS()
		return

	initMMS: =>
		require( "./mms" ).init( @main )
		return