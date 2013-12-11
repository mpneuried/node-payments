###

To test this example run `node examples/express.js` and then call
http://localhost:8888/pay/paypal?amount=0.01&desc=Cup%20of%20coffee&userid=123

###

# get some modules
fs = require( "fs" )
path = require( "path" )

# initialize a standard express
express = require( "express" )
app = express()
app.use( express.bodyParser() )
app.use( express.logger( "dev" ) )

# get the local testing configuration
_configTest = JSON.parse( fs.readFileSync( path.resolve( __dirname + "/../config_test.json" ) ) )


# reuse the existing express
_configTest.express = app

# init node-payments
Payments = require( "../." )
# use the Redis hashstore
_configTest.paymentStore = new Payments.RedisHashStore()
pymts = new Payments( _configTest )

# Define the answer page handler for a successfull payment return
pymts.on "approved", ( res, payment )->
	res.send( "Thank you!" )
	return

# Define the answer page handler for a canceld payment return
pymts.on "cancel", ( res, payment )->
	res.send( "What a pity!" )
	return

pymts.on "verfied", ( payment )->
	console.log "PAYMENT VERIFIED\n", payment.valueOf()
	return

pymts.on "payment", ( type, payment )->
	console.log "PAYMENT ACTION: #{type}\n", payment.valueOf()
	return

# ROUTE to create a payment
# e.g. http://localhost:8888/pay/paypal?amount=0.01&desc=Cup%20of%20coffee&userid=123
app.get "/pay/:provider", ( req, res )->
	_provider = req.params.provider 
	_amount = req.query.amount
	_desc = req.query.desc
	_uid = req.query.userid

	pymts.provider _provider, ( err, provider )->
		if err
			res.send( "Unkown provider", 500 )
			return
		
		# create a payment
		payment = provider.create()

		# set some attributes of the payment
		payment.set
			amount: _amount	# amount to pay
			desc: _desc		# item description
			user_id: _uid	# custom-data user_id

		# execute a payment
		payment.exec ( err, link )->
			if err
				res.send( "Cannot send payment: #{ JSON.stringify( err ) }", 500 )
				return

			# redirect the user to paypal
			res.redirect( link )
			return

		return

	return
_port = 8888
console.log "listen to #{_port}"
app.listen( _port )