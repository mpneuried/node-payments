should = require( "should" )
fs = require( "fs" )
path = require( "path" )
spawn = require('child_process').spawn

config = require( "../lib/config" )
_configTest = JSON.parse( fs.readFileSync( path.resolve( __dirname + "/../config_test.json" ) ) )
config.init( _configTest )

Payments = require( "../." )

_localtest = config.get( "paypalipn" ).listenport isnt false

if _localtest
	paypalIPN = require( "./fakeendpoint" )
	console.log "USE LOCAL IPN TEST"

openBrowser = ( url )->
	switch process.platform 
		when "darwin" then spawn('open', [url] )
		when "linux" then spawn('firefox', [url] )
		else 
			console.log "Open `#{url}` in your Browser"
	return

pymts = null

describe "=== MAIN TESTS === ", ->	

	describe "- Init -", ->

		pymts = new Payments( _configTest )
		pymts.on "approved", ( res, payment )=>
			res.send( "APPROVED:\n\n#{payment.toString( true )}" )
			return

		pymts.on "cancel", ( res, payment )=>
			res.send( "CANCLED:\n\n#{payment.toString( true )}" )
			return

		return


	describe "- Paypal -", ->

		_testPayment = null

		it "create payment", ( done )->
			@timeout( 1000 * 60 * 5 ) # 5 minute timeout
			pymts.provider "paypalclassic", ( err, paypal )=>
				should.not.exist( err )

				_amount = 0.01

				payment = paypal.create()

				payment.amount = _amount
				payment.desc = "Imperial Star Destroyer"

				payment.set( "my_user_id", 123 )

				_id = payment.id

				pymts.on "payment", ( type, _payment )=>
					if type is "approved"
						_payment.amount.should.equal( _amount ) 
						_payment.get( "my_user_id" ).should.equal( 123 ) 
						#console.log "PAYED: ", _payment.valueOf()
					return

				pymts.on "payment:#{_id}", ( type, _payment )=>
					switch type
						when "approved"
							_testPayment = _payment
							console.log "APPROVED STATE: ", _payment.state
							done()
							return
		
						when "cancel"
							_testPayment = _payment
							done()
							return
					return

				payment.exec ( err, link )=>				
					should.not.exist( err )
					#done()
					openBrowser( link )
					return
				return
			return

		if _localtest
			it "send ipn", ( done )->
				if _testPayment?
					paypalIPN.sendPaypalIPN( _testPayment )
					pymts.once "payment:#{_testPayment.id}", ( type, _payment )=>
						if type is "completed"
							console.log "COMPLETED STATE: ", _payment.valueOf()
							_testPayment.id.should.equal( _payment.id )
							done()
						return
				else
					console.log "PAYMENT CANCELD!"
					done()
				return
		else
			it "wait for IPN message", ( done )->
				@timeout( 1000 * 60 * 5 ) # 5 minute timeout
				if _testPayment?
					pymts.once "payment:#{_testPayment.id}", ( type, _payment )=>
						if type is "completed"
							console.log "COMPLETED STATE: ", _payment.valueOf()
							_testPayment.id.should.equal( _payment.id )
							done()
						return
				else
					console.log "PAYMENT CANCELD!"
					done()
				return

		it "keep server open", ( done )->
			@timeout( 0 )
			return
		return
	return