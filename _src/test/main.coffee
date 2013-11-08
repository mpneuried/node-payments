should = require( "should" )
fs = require( "fs" )
path = require( "path" )
spawn = require('child_process').spawn

config = require( "../lib/config" )
_configTest = JSON.parse( fs.readFileSync( path.resolve( __dirname + "/../config_test.json" ) ) )
config.init( _configTest )

Payments = require( "../." )

paypalIPN = require( "./fakeendpoint" )

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
		pymts.on "redirect:approved", ( res, payment )=>
			res.send( "APPROVED:\n\n#{payment.toString( true )}" )
			return

		return


	describe "- Paypal -", ->

		_testPayment = null

		it "create payment", ( done )->
			@timeout 0
			pymts.provider "paypal", ( err, paypal )=>
				should.not.exist( err )

				payment = paypal.create()

				payment.amount = 1
				payment.desc = "Imperial Star Destroyer"

				payment.set( "my_user_id", 123 )

				_id = payment.id

				pymts.on "payment:approved", ( _payment )=>
					_payment.amount.should.equal( 1 ) 
					_payment.get( "my_user_id" ).should.equal( 123 ) 
					#console.log "PAYED: ", _payment.valueOf()
					return

				pymts.once "approved:#{_id}", ( _payment )=>
					_testPayment = _payment
					done()
					return

				payment.exec ( err, link )=>
					should.not.exist( err )
					#done()
					openBrowser( link )
					return
				return
			return

		it "send ipn", ( done )->

			paypalIPN.sendPaypalIPN( _testPayment )

		return
	return