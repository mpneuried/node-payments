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

```js
// configure express
var express = require( "express" );
var app = express();
app.use( express.urlencoded() );

// get and config the module
var Payments = require( "node-payments" );
// inject and reuse a existing express
var paymentConfig = { express: app, paymentStore: new Payments.RedisHashStore() }
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

# Initialize

to initailize node-payments call `new` with and put in your express.

**`new Payments( config )`**

###Config-Options:

* **express** ( `Express` - *optional; default = A internal express will be generated* ): An existing express instance ( e.g. `require( "express" )()` ).
* **baseroute** ( `String` - *optional; default = `/payment/`* ): The basic route to generate the redirect url from the external providers.
* **redirprefix** ( `String` - *recommended* ): The host added infront of the baseroute. If not set it will try to guess it. But it recommended to set this configuration key.
* **providers** ( `Array` - *optional default = `[ "paypal", "clickandbuy" ]`* ): A list of availabel providers. 
* **paypal** ( `Object` ): PayPay pay configuration
	* **endpoint** ( `String`, *optional; default = `https://api-3t.paypal.com/nvp`* ): The paypal endpoint. To use the Sandbox environment set this to `https://api-3t.sandbox.paypal.com/nvp` 
	* **userid** ( `String` ): Your PayPal mercant user id
	* **password** ( `String` ): Your PayPal mercant password
	* **signature** ( `String` ): Your PayPal mercant signature
	* **application_id** ( `String` ): Your PayPal mercant application_id. For the sandbox environment do not change this or use the default `APP-80W284485P519543T`. 
	* **receiver_email** ( `String` ): Your PayPal mail adress
	* **localcode** ( `String`, *optional; default = `DE`* ): The local code to use the correct language. [Possible codes](http://paypal-nvp.sourceforge.net/api/paypalnvp/request/SetExpressCheckout.LocalCode.html)
	* **linkTemplate** ( `String`, *optional; default = `https://www.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>`* ): A template to translate the returned token to the redirect link. To use the Sandbox environment set this to `https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>`
* **paypalipn** ( `Object` ): PayPal IPN ( Instant Payment Notification ) configuration
	* **receiverPath** ( `String`, *optional; default = `/ipn/paypal`* ): The IPN route added to your express. PayPay will send POST request to this route to verify your payments. You have to configure this within your PayPay account.
	* **receiver_email** ( `String`, *optional* ): Usually you PayPal email adress. If set `!= null` node-payments will check the reciever email within the IPN message against this value. If left `null` no check will be performend.
* **clickandbuy** ( `Object` ): ClickandBuy pay configuration
	* **endpoint** ( `String`, *optional; default = `https://api.clickandbuy.com/webservices/soap/pay_1_1_0/`* ): The ClickandBuy endpoint. To use the sandbox environment set this to `https://api.clickandbuy-s1.com/webservices/soap/pay_1_1_0/`.
	* **merchantid** ( `String` ): Your ClickandBuy mercant id
	* **projectid** ( `String` ): Your ClickandBuy mercant projectid
	* **cryptokey** ( `String` ): Your ClickandBuy project cryptokey
	* **localcode** ( `String`, *optional; default = `DE`* ): ISO 3166-1 alpha-2 country code.
* **clickandbuymms** ( `Object` ): ClickandBuy MMS ( Merchant Message Service ) configuration
	* **receiverPath** ( `String`, *optional; default = `/cab/clickandbuy`* ): The MMS route added to your express. ClickandBuy will send POST request to this route to verify your payments. You have to configure this within your ClickandBuy account.
	* **cryptokey** ( `String` ): Your ClickandBuy events cryptokey.
* **defaultcurrency** ( `String` *optional; default = `EUR`* ): The default currency.
* **productionmode** ( `Boolean` *optional; default = `true`* ): If you set this `false` the system answers with `200` for request from messaging services if the payment is not found. Otherwise it will answer with `500`.

# Methods

## Payments Object

#### `Payments.provider( name, callback )`

Get a instance of a payment provider.

#####Arguments:

* **email** ( `String` ): The users email.
* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok 
* **provider** ( `Provider` ): The instance the requested provider.

#### `Payments.getPayment( pid, callback )`

Get a instance of a payment object.

#####Arguments:

* **pid** ( `String` ): The payment id to get
* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok 
* **provider** ( `Payment` ): The instance the requested payment.

#### `Payments.createPayment( type [, data], callback )`

Create a new Payment.

#####Arguments:

* **type** ( `String` ): The provider name. Has to be one of `config.providers`.
* **data** ( `Object` *optional* ): Initial payment data. This could also be done later by using `Payment.set( ... )`
* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok 
* **provider** ( `Payment` ): A new instance of a payment.

## Provider Object

#### `Provider.create( [data] )`

Create a new `Payment` of this provider.

#####Arguments:

* **data** ( `Object` *optional* ): Initial payment data. This could also be done later by using `Payment.set( ... )`

## Payment Object

> Getters are marked with a *G* and Setters with a *S*

#### `Payment.provider` *G*

( `String` ) Getter to read the provider name

#### `Payment.amount` *required G/S*

( `Number` ) Setter/Getter to set and read the amount

#### `Payment.desc` *required G/S*

( `String` ) Setter/Getter to set and read the payment's description

#### `Payment.currency` *G/S*

( `String` ) Setter/Getter to set and read the currency

#### `Payment.articleNumber` *G/S*

( `String` ) Setter/Getter to set and read the a optional article number.

#### `Payment.quantity` *G/S*

( `String` ) Setter/Getter to set and read the a optional quantity.

#### `Payment.transaction` *G*

( `String` ) Getter to read the unique transaction number per provider. Is also a Setter, but this schould only be used internaly

#### `Payment.state` *G*

( `String` ) Getter to read the current unified state. Is also a Setter, but this schould only be used internaly

#### `Payment.rawProviderState` *G*

( `String` ) Getter to read the current raw provider state. This is just a info field to show the not unified. Is also a Setter, but this schould only be used internaly

#### `Payment.pay_id` *G*

( `String` ) Getter to read the providers pay id. This is just a info field. Is also a Setter, but this schould only be used internaly

#### `Payment.payer_id` *G*

( `String` ) Getter to read the providers payer id. This is just a info field. Is also a Setter, but this schould only be done internaly

#### `Payment.verified` *G*

( `Boolean` ) Getter with a flag witch will be `true` if a messaging service like IPN has verified this payment. Is also a Setter, but this schould only be used internaly

#### `Payment.data` *G*

( `Object` ) Getter to read the internal data. This will inculde all data above and the custom fields set by `Payment.set()`

#### `Payment.get( key )`

Get a internal value like one described as getter above or your defined custom fields

* **key** ( `String` ): Key to get

##### Returns

( `Any` ): The requested field 

#### `Payment.set( [key,] value )`

Get a internal value like one described as getter above or your defined custom fields

* **key** ( `String` ): Key to set
* **value** ( `String|Object` ): Value to set. You can also only pass a object to the `set` and all keys within the object will be setted.

##### Returns

( `Payment` ): This is a chainable method

#### `Payment.valueOf()`

Identical to `Payment.data`

##### Returns

( `Object` ) Getter to read the internal data. This will inculde all data above and the custom fields set by `Payment.set()`

#### `Payment.toString( [ format ] )`

Will return `Payment.data` as stringified JSON

* **format** ( `Boolean` *optional; default = `false`* ): Do a nicer JSON formating.

##### Returns

( `String` ) `Payment.data` as stringified JSON

#### `Payment.persist( callback )`

Write the payment by the `PaymanetStore` to the DB, disk, ...

* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok

#### `Payment.exec( callback )`

Execute the payment and generate the payment link to let the user login with his credentials for the defined provider.

* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok
* **link** ( `String` ): The link to redirect the user to the payment provider

#### `Payment.cancel( callback )`

Manually cancle the payment and set the state to cancled

* **callback** ( `Function` ): The callback method.

##### `callback` arguments

* **error** ( `Error` ): An error or `null` if everthing is ok
* **self** ( `Payment` ): The payment itself

## PaymentStore

You can or should define your own payment store. Otherwise the system uses the default fleeting memory store witch will loose all the data on every restart of the script.

For a quick start you can use the ready `RedisHashStore`.

```js
Payments = require( "../." )
new Payments( paymentStore: new Payments.RedisHashStore( { hkey: "nodepaymentexample", host: "localhost", port: 6379 } ) )
```

A PaymentStore has to implement the methods `.connect()`, `.get( pid, callback )`, `.set( payment, callback )`, `.destroy( payment, callback )`.

The following code describes a simplified solution:

```js
var EventEmitter = require('events').EventEmitter;

var YourDBConnector = require( "your-db" );
var db = new YourDBConnector();

module.exports = function(){
	
	function MyPaymentStore(){
		this.connected = false;
	}

	// extend the event emitter methods
	MyPaymentStore.prototype.emit = EventEmitter.emit;
	MyPaymentStore.prototype.on = EventEmitter.on;
	MyPaymentStore.prototype.once = EventEmitter.once;
	MyPaymentStore.prototype.removeListener = EventEmitter.removeListener;
	
	// connect method called on start to connect to your db. Just call `this.connected = true;this.emit("connect");` if you don't need to connect.
	MyPaymentStore.prototype.connect = function() {
		db.connect( function(){
			this.connected = true;
			this.emit("connect");
		} );
	};
	
	// get data of a single payment
	MyPaymentStore.prototype.get = function( pid, callback ) {
		process.nextTick(function() {
			db.get( pid, function( err, data ){
				if( err ){ return callback( err ); }
				callback( null, data );
			} );
		});
	};
	
	// set data of a single payment
	MyPaymentStore.prototype.set = function( payment, callback ) {
		process.nextTick(function() {
			db.set( payment.id, payment.valueOf(), function( err ){
				if( err ){ return callback( err ); }
				callback( null );
			} );
		});
	};
	
	// delete a single payment
	MyPaymentStore.prototype.destroy = function( payment, callback ) {
		process.nextTick(function() {
			db.destroy( payment.id, function( err ){
				if( err ){ return callback( err ); }
				callback( null );
			} );
		});
	};

	return MyPaymentStore;
};
```


## TODO's

* A `sandbox` config setting to switch beween the sandbox and live environments.
* Finalize the `paypalrest` provider. It's basically done, but the problem is it's not availible in Europe. So i can't test it live and seriously. It you want to use it add `paypalrest` to the `config.providers` list.

## Ideas

* A **logging store**, similar to the payment store solution, to save all incomming messages with a log and be able to retrace all happening events. 

## Release History
|Version|Date|Description|
|:--:|:--:|:--|
|v0.1.4|2013-12-04|Fixed loading of redis in redishashstore if not used.|
|v0.1.3|2013-12-04|Added detailed docs and some optimizations|
|v0.1.2|2013-12-03|First offical working beta|

## Work in progress

`node-payments` is work in progress. Your ideas, suggestions etc. are very welcome.

## Related Projects
|Name|Description|
|:--|:--|
|[**tcs_node_auth**](https://github.com/mpneuried/tcs_node_auth)|Authentication module to handle login and register with a integrated mail double-opt-in logic.|
|[**redis-sessions**](https://github.com/smrchy/redis-sessions)|The redis session module this middleware module is based on|
|[**tcs_node_mail_client**](https://github.com/mpneuried/tcs_mail_node_client)|Module to simply send mails by using the TCS mail Webservice (**node-tcs-de**)|


## The MIT License (MIT)

Copyright © 2013 Mathias Peter, http://www.tcs.de

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the “Software”), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.


