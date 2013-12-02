config = require( "../../lib/config" )
request = require( "request" )
crypto = require( "crypto" )
_ = require( "lodash" )
async = require( "async" )
xml2js = require( "xml2js" )

xmlParser = new xml2js.Parser()

class ClickAndBuyMMS extends require( "../_base/main" )	
	initialize: =>
		@cbConfig = config.get( "clickandbuy" )

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

	answer200: ( req, res, next )=>
		@debug "IPN Input", req.body
		res.send( "OK" )
		next()
		return

	checkSignature: ( xml, sig, secret )=>
		_cleanXML = ( xml.replace( "<signature>#{sig}</signature>", "<signature />" ) )
		
		_hs = "#{secret}#{_cleanXML}"
		_hash = crypto.createHash('sha1').update( _hs ).digest('hex')

		console.log _hash, sig, _cleanXML
		if sig is _hash
			return true
		else
			return false


	verify: ( req, res, next )=>
		if not req.body.xml?
			# if no payload exists is't just a ping to verify the availibility of this endpoint.
			res.send( "OK" )
			return

		xmlParser.parseString req.body.xml, ( err, bodyObj )=>
			if err
				@error( "parse xml", err )
				res.send( "FAILED", 500 )
				return

			signature = bodyObj?.eventlist?.signature?[ 0 ]
			req._mmsevents =  bodyObj?.eventlist?.payEvent

			if @checkSignature( req.body.xml, signature, @config.cryptokey )
				next()
			else
				@_handleError( null, "ECBMMSINVALIDSIGNATURE" )
				res.send( "FAILED", 500 )
			return

		return

	input: ( req, res )=>
		afns = []
		
		for _event in req._mmsevents
			afns.push( @processEvent( _event ) )

		async.series afns, ( err )=>
			@info "processed #{afns.length} mms events"
			if err?
				@error( err )
				res.send( "FAILED", 500 )
				return
			res.send( "OK" )
			return
		return

	processEvent: ( data )=>
		return ( cb )=>
			_pid = data.externalID[ 0 ]
			_rawstate = data.newState[ 0 ]
			_transaction = data.transactionID[ 0 ]
			_merchantID = data.merchantID[ 0 ]
			_dataAmout = data.merchantAmount[ 0 ]
			_currency = _dataAmout.currency[ 0 ]
			_payer = data.crn?[ 0 ]
			_atype = @_currencies[ _currency ]
			if _atype is "int"
				_amount = parseInt( _dataAmout.amount[ 0 ], 10 )
			else
				_amount = parseFloat( _dataAmout.amount[ 0 ], 10 )

			if @cbConfig.merchantid? and _merchantID isnt @cbConfig.merchantid
				@_handleError( cb, "ECBMMSINVALIDMERCHANT", { got: _merchantID, needed: @cbConfig.merchantid } )
				return
			
			@main.getPayment _pid, ( err, payment )=>
				if err
					cb( err )
					return
				
				@debug "MMS returned", _pid, payment.valueOf()

				if _currency isnt payment.currency
					@_handleError( cb, "ECBMMSINVALIDCURRENCY", { got: _currency, needed: payment.currency } )
					return

				if Math.abs( _amount ) isnt payment.amount
					@_handleError( cb, "ECBMMSINVALIDAMOUNT", { got: _amount, needed: payment.amount } )
					return

				_state = payment._translateState( _rawstate )
				payment.set( "rawProviderState", _rawstate )
				payment.set( "payer_id", _payer ) if _payer?.length

				payment.set( "state", _state )
				payment.set( "transaction", _transaction )
				payment.set( "verified", true )
				payment.persist ( err )=>
					if _state is "COMPLETED"
						if err
							cb( err )
							return
						@main.emit( "payment", "verfied", payment )
						@main.emit( "payment:#{payment.id}", "verfied", payment )
						@main.emit( "verfied", payment )
						cb( null )
					return
				return
			return

	ERRORS: =>
		@extend super, 
			"ECBMMSINVALIDMERCHANT": "The click and buy MMS sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`."
			"ECBMMSINVALIDCURRENCY": "The click and buy MMS sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			
			"ECBMMSINVALIDAMOUNT": "The click and buy MMS sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."			
			"ECBMMSINVALIDSIGNATURE": "The signature check failed."

module.exports = new ClickAndBuyMMS()