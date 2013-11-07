should = require( "should" )
fs = require( "fs" )
path = require( "path" )
spawn = require('child_process').spawn

Payments = require( "../." )

_configTest = JSON.parse( fs.readFileSync( path.resolve( __dirname + "/../config_test.json" ) ) )

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

		return

	describe "- Paypal -", ->

		it "create payment", ( done )->
			@timeout 0
			pymts.provider "paypal", ( err, paypal )=>
				should.not.exist( err )

				payment = paypal.create()

				payment.amount = 1
				payment.desc = "Imperial Star Destroyer"

				console.log "PAYMENT", payment.valueOf()
				
				#openBrowser( 'http://localhost:3000' )
				
				payment.exec ( err, link, method )=>
					should.not.exist( err )
					#done()
					openBrowser( link )
					return
				return
			return

		return
	return