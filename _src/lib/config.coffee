DEFAULT = 
	providers: [ "paypal" ]
	defaultcurrency: "EUR"

	paypal: 
		endpoint: "api.sandbox.paypal.com"
		port: ""
		client_id: "REPLACE-THIS"
		client_secret: "REPLACE-THIS"

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
		console.log "INPUT", input
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