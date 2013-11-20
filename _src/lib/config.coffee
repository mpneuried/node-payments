DEFAULT = 
	# this is the basic route the module will add it's required routes
	baseroute: "/payment/"
	
	# a express app placeholder
	express: null
	# some defaults for a internal gernerated express server
	serverDefaultPort: 8888
	serverDefaultHost: "localhost"
	serverSecure: false
	
	# PROVIDER SETTINGS
	# availible providers
	providers: [ "paypal", "paypalrest", "clickandbuy" ]

	# paypal classic api settings
	paypal:
		endpoint: "https://api-3t.sandbox.paypal.com/nvp"
		userid: "REPLACE-THIS"
		password: "REPLACE-THIS"
		signature: "REPLACE-THIS"
		application_id: "APP-80W284485P519543T" # REPLACE-THIS - default value is the global sandbox id.
		receiver_email: "REPLACE-THIS"
		localcode: "DE"
		linkTemplate: "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>"

	# paypal rest api settings
	paypalrest: 
		endpoint: "api.sandbox.paypal.com"
		port: ""
		client_id: "REPLACE-THIS"
		client_secret: "REPLACE-THIS"
		ipnTarget: "https://www.sandbox.paypal.com/cgi-bin/webscr?"

	clickandbuy: 
		endpoint: "https://api.clickandbuy.com/webservices/soap/pay_1_1_0/"
		merchantid: "REPLACE-THIS",
		projectid: "REPLACE-THIS",
		cryptokey: "REPLACE-THIS"
		localcode: "DE"


	# EXTERNAL MESSAGING SETTINGS ( IPN / MMS / ... )

	# paypal ipn settings
	paypalipn:
		# internal ipn route to get ipn messages from paypal
		receiverPath: "/ipntest/paypal" # 
		# ipn host settings
		host: "www.paypal.com"
		port: 80
		secure: true
		ppReturnPath: "/cgi-bin/webscr" # path to the ipn server to verify messages
		# only accept for this user email. If set to `null` no check will be done
		receiver_email: null

		# this is just for testing to define the port of the simulated ipn
		listenport: false

	clickandbuymms: 

		# internal ipn route to get mms messages from click&buy
		receiverPath: "/ipntest/clickandbuy"


	# use this currency if no currencie has been defined
	defaultcurrency: "EUR"
	# currency settings to translate them to float or number
	currencies: 
		"AUD": "float"	# Australian dollar 	
		"CAD": "float"	# Canadian dollar 	
		"CZK": "float"	# Czech koruna 	
		"DKK": "float"	# Danish krone 	
		"EUR": "float"	# Euro 	
		"HKD": "float"	# Hong Kong dollar 	
		"HUF": "float"	# Hungarian forint 	
		"ILS": "float"	# Israeli new shekel 	
		"JPY": "int"	# Japanese yen	
		"MXN": "float"	# Mexican peso 	
		"TWD": "int"	# New Taiwan dollar	
		"NZD": "float"	# New Zealand dollar 	
		"NOK": "float"	# Norwegian krone 	
		"PHP": "float"	# Philippine peso 	
		"PLN": "float"	# Polish złoty 	
		"GBP": "float"	# Pound sterling 	
		"SGD": "float"	# Singapore dollar 	
		"SEK": "float"	# Swedish krona 	
		"CHF": "float"	# Swiss franc 	
		"THB": "float"	# Thai baht 	
		"USD": "float"	# United States dollar 	


# The config module
extend = require( "extend" )

class Config
	constructor: ( @severity = "warning" )->
		return

	init: ( input )=>
		@config = extend( true, {}, DEFAULT, input )
		return

	get: ( name, logging = false )=>
		
		_cnf = @config[ name ] or null
		if logging

			logging = 
				logging:
					severity: process.env[ "severity_#{name}"] or @severity
					severitys: "fatal,error,warning,info,debug".split( "," )
			return extend( true, {}, logging, _cnf )
		else
			return _cnf

module.exports = new Config( process.env.severity )