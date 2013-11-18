DEFAULT = 
	providers: [ "paypalrest", "paypalclassic" ]
	defaultcurrency: "EUR"

	paypalrest: 
		endpoint: "api.sandbox.paypal.com"
		port: ""
		client_id: "REPLACE-THIS"
		client_secret: "REPLACE-THIS"
		ipnTarget: "https://www.sandbox.paypal.com/cgi-bin/webscr?"

	paypalclassic:
		endpoint: "https://api-3t.sandbox.paypal.com/nvp"
		userid: "REPLACE-THIS"
		password: "REPLACE-THIS"
		signature: "REPLACE-THIS"
		application_id: "APP-80W284485P519543T" # REPLACE-THIS - default value is the global sandbox id.
		receiver_email: "REPLACE-THIS"
		linkTemplate: "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>"

	baseroute: "/payment/"
	serverConfig: 
		port: 8888
		listenhost: null
		host: "localhost"
		secure: false

	express: null


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