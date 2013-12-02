querystring = require( "querystring" )
crypto = require( "crypto" )
moment = require( "moment" )
xml2js = require( "xml2js" )

config = require( "../../lib/config" )
request = require( "request" )
_ = require( "lodash" )

xmlParser = new xml2js.Parser()

stateMapping = 
	"CREATED": "CREATED"
	"PENDING_VERIFICATION": "CREATED"
	"EXPIRED": "CANCELD"
	"ABORTED": "CANCELD"
	"DECLINED": "CANCELD"
	"CANCELLED": "CANCELD"
	"IN_PROGRESS": "PENDING"
	"SUCCESS": "COMPLETED"
	"PAYMENT_PENDING": "PENDING"
	"BOOKED_OUT": "PENDING"
	"BOOKED_IN": "PENDING"
	"PAYMENT_GUARANTEE": "COMPLETED"


module.exports = class ClickAndBuyPayment extends require( "../_base/payment" )
	type: "clickandbuy"

	initialize: =>
		@_currencies = config.get( "defaultcurrency" )
		@cbConfig = config.get( "clickandbuy" )
		return

	createToken: ( pid, secret )=>
		ts = moment().utc().format( "YYYYMMDDHHmmSS" )
		_hs = "#{pid}::#{secret}::#{ts}"
		_hash = crypto.createHash('sha1').update( _hs ).digest('hex')

		return ts + "::" + _hash

	setAuthentication: ( cb )=>

		authHeader = """
<ns2:authentication>
	<ns2:merchantID>#{ @cbConfig.merchantid }</ns2:merchantID>
	<ns2:projectID>#{ @cbConfig.projectid }</ns2:projectID>
	<ns2:token>#{ @createToken( @cbConfig.projectid, @cbConfig.cryptokey ) }</ns2:token>
</ns2:authentication>
		"""


		cb( null, authHeader )
		return

	requestProvider: ( authHeader, cb )=>
		# construct clickandbuy JSON object
		_urls = @getUrls()

		_xml = """<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
	<SOAP-ENV:Header/>
	<SOAP-ENV:Body>
		<ns2:payRequest_Request xmlns:ns2="http://api.clickandbuy.com/webservices/pay_1_1_0/">
			#{authHeader}
			<ns2:details>
				<ns2:consumerCountry>#{@cbConfig.localcode}</ns2:consumerCountry>
				<ns2:amount>
					<ns2:amount>#{@amount}</ns2:amount>
					<ns2:currency>#{@currency}</ns2:currency>
				</ns2:amount>
				<ns2:orderDetails>
					<ns2:text>#{@desc}</ns2:text>
				</ns2:orderDetails>
				<ns2:successURL>#{_urls.success}</ns2:successURL>
				<ns2:failureURL>#{_urls.cancel}</ns2:failureURL>
				<ns2:externalID>#{@id}</ns2:externalID>
			</ns2:details>
		</ns2:payRequest_Request>
	</SOAP-ENV:Body>
</SOAP-ENV:Envelope>
		"""	

		@debug "raw xml", _xml

		_xml = new Buffer( _xml, 'utf8' )

		opt = 
			url: @cbConfig.endpoint
			method: "POST"
			body: _xml
			headers:
				"User-Agent": "node-payments",
				"Accept" : "application/xml,text/xml",
				"Accept-Encoding": "utf-8",
				"Accept-Charset": "utf-8",
				"Connection": "Keep-Alive"
				#"Content-Length": _xml.length
				"Content-Type": "text/xml; charset=utf-8"



		@debug "send clickandbuy payment", opt
		request opt, ( err, response, bodyXml )=>
			@debug "clickandbuy payment response", response.statusCode, bodyXml
			if err
				cb( err )
				return
			xmlParser.parseString bodyXml, ( err, bodyObj )=>
				if err
					cb( err )
					return

				_data = bodyObj[ "SOAP-ENV:Envelope" ]?[ "SOAP-ENV:Body" ]
				@debug "clickandbuy payment parsed xml", ( _data or bodyObj )
				if response.statusCode isnt 200	
					cb( _data?[ 0 ]?[ "SOAP-ENV:Fault" ] or _data or bodyObj )
					return

				_converted = @_convertPayRequest_Response( _data )
				@set "rawProviderState", _converted.state
				_converted.state = @_translateState( _converted.state )
				
				@debug "clickandbuy payment parsed xml", _converted

				cb( null, _converted.id, _converted.link, _converted.transaction )
			return
		return

	_convertPayRequest_Response: ( raw )=>
		ret = {}

		_resp = raw?[ 0 ]?[ "ns2:payRequest_Response" ]?[ 0 ]
		ret.id = _resp?[ "ns2:requestTrackingID" ]?[ 0 ]

		_trans = _resp?[ "ns2:transaction" ]?[ 0 ]
		@debug "_convertPayRequest_Response", _resp, _trans

		ret.transaction = _trans?[ "ns2:transactionID" ]?[ 0 ]
		ret.state = _trans?[ "ns2:transactionStatus" ]?[ 0 ]
		ret.link = _trans?[ "ns2:redirectURL" ]?[ 0 ]

		return ret


	executeProvider: ( token, auth, cb )=>

		_xml = """<?xml version="1.0" encoding="UTF-8"?>
<SOAP-ENV:Envelope xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/">
	<SOAP-ENV:Header/>
	<SOAP-ENV:Body>
		<ns2:statusRequest_Request xmlns:ns2="http://api.clickandbuy.com/webservices/pay_1_1_0/">
			#{auth}
			<ns2:details>
				<ns2:transactionIDList>
					<ns2:transactionID>#{@transaction}</ns2:transactionID>
				</ns2:transactionIDList>
			</ns2:details>
		</ns2:statusRequest_Request>
	</SOAP-ENV:Body>
</SOAP-ENV:Envelope>
		"""	

		@debug "raw xml", _xml

		opt = 
			url: @cbConfig.endpoint
			method: "POST"
			body: _xml
			headers:
				"User-Agent": "node-payments",
				"Accept" : "application/xml,text/xml",
				"Accept-Encoding": "utf-8",
				"Accept-Charset": "utf-8",
				"Connection": "Keep-Alive"
				#"Content-Length": _xml.length
				"Content-Type": "text/xml; charset=utf-8"				

		@debug "send clickandbuy payment", JSON.stringify( opt, true, 4 )
		
		request opt, ( err, response, bodyXml )=>
			@debug "clickandbuy payment response", response.statusCode, bodyXml
			if err
				cb( err )
				return
			xmlParser.parseString bodyXml, ( err, bodyObj )=>
				if err
					cb( err )
					return

				_data = bodyObj[ "SOAP-ENV:Envelope" ]?[ "SOAP-ENV:Body" ]
				@debug "clickandbuy payment parsed xml", ( _data or bodyObj )
				if response.statusCode isnt 200	
					cb( _data?[ 0 ]?[ "SOAP-ENV:Fault" ] or _data or bodyObj )
					return

				_converted = @_convertPayStatus_Response( _data )
				@set "rawProviderState", _converted.state

				_converted.state = @_translateState( _converted.state )

				@info "EXEC RESPONSE", JSON.stringify( _converted, true, 4 )
	
				cb( null, _converted.state )
			return
		return

	_translateState: ( cbState )=>
		return stateMapping[ cbState.toUpperCase() ] or "UNKONWN"

	_convertPayStatus_Response: ( raw )=>
		ret = {}
		@debug "_convertPayStatus_Response", JSON.stringify( raw, 1, 4 )

		_resp = raw?[ 0 ]?[ "ns2:statusRequest_Response" ]?[ 0 ]
		ret.id = _resp?[ "ns2:requestTrackingID" ]?[ 0 ]

		_trans = _resp?[ "ns2:transactionList" ]?[ 0 ]?[ "ns2:transaction" ]?[ 0 ]
		@debug "_convertPayRequest_Response", _resp, _trans

		ret.transaction = _trans?[ "ns2:transactionID" ]?[ 0 ]
		ret.state = _trans?[ "ns2:transactionStatus" ]?[ 0 ]

		return ret
