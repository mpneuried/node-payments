node-payments
=============

Node-payments is a express based facade to multiple payment services.  
The idea is an simple and inutive API to handle just simple single payments. It's als designed to add more payment services over time, but without changing the general API.

The service type is just one argument within the process.

For every provider the required messaging endpoint, like PayPal's IPN, will be attached to express. So everything you need is included.

#### Features

* A simple and equal API for multiple providers.
* Integrated messaging endpoints to verify the payments.
* A flexible payment-store to simply integrate it within your environment.
 
#### What it can't do

To hold it simple and equal over all providers it has only the option for single and simple payments. Batch payments, recurring subscriptions, etc. are **not** availible.

#### Currently applied services

* [PayPal](www.paypal.com)
* [ClickandBuy](www.clickandbuy.com)

## Example

```
// configure express
var express = require( "express" );
var app = express();
app.use( express.urlencoded() );

// get and config the module
var Payments = require( "node-payments" );
// inject and reuse a existing express
var paymentConfig = { express: app }
var pymts = new Payments( paymentConfig );

// listen to events

// the event fired for a succesfull provider payment
pymts.on( "approved", function( res, payment ){
	// use the express response object to generate the page after retuning from the providers page
	res.send( "Thank you!" );
});

// the event fired for a canceld provider payment
pymts.on( "cancel", function( res, payment ){
	// use the express response object to generate the page after a canceld payments by/within the providers page
	res.send( "What a pity!" );
});

// the event fired for a successfull verify by a message service ( e.g. PayPal-IPN or ClickandBuy-MMS ).
pymts.on( "verfied", function( payment ){
	console.log( "PAYMENT VERIFIED\"n", payment.valueOf() );
});

// the event on every change of a payment
pymts.on( "payment", function( type, payment ){
	console.log( "PAYMENT ACTION: " + type "\"n", payment.valueOf() );
});

// listen for pay requests ( e.g. "www.mysite.com/pay/paypal"
app.get( "/pay/:provider/:cid", function( req, res ){
	// Get thh service provider
	pymts.provider( req.params.provider, function( err, provider ){
		if( err ){
			console.log( err );
			res.send( "ERROR", 500 );
		}
		
		// create a payment instance
		var payment = provider.create()
		
		// set some parameters
		payment.set({
			amount: 41.99,
			curreny: "EUR",
			desc: "Imperial Star Destroyer",
			// you can define your own attributes
			my_custom_id: req.params.cid
		});
		
		payment.execute( function( err, link ){
			if( err ){
				console.log( err );
				res.send( "ERROR", 500 );
			}
			// redirect to the providers login page
			res.redirect( link );
		});
	});
});

// start express. Make sure you start listening after node-payments has been configured.
var _port = 8888;
console.log( "listen to", _port );
app.listen( _port );
```


