(function() {
  var ClickAndBuyPayment, config, crypto, moment, querystring, request, stateMapping, xml2js, xmlParser, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  querystring = require("querystring");

  crypto = require("crypto");

  moment = require("moment");

  xml2js = require("xml2js");

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  xmlParser = new xml2js.Parser();

  stateMapping = {
    "CREATED": "CREATED",
    "PENDING_VERIFICATION": "CREATED",
    "EXPIRED": "CANCELD",
    "ABORTED": "CANCELD",
    "DECLINED": "CANCELD",
    "CANCELLED": "CANCELD",
    "IN_PROGRESS": "PENDING",
    "SUCCESS": "COMPLETED",
    "PAYMENT_PENDING": "PENDING",
    "BOOKED_OUT": "PENDING",
    "BOOKED_IN": "PENDING",
    "PAYMENT_GUARANTEE": "COMPLETED"
  };

  module.exports = ClickAndBuyPayment = (function(_super) {
    __extends(ClickAndBuyPayment, _super);

    function ClickAndBuyPayment() {
      this._convertPayStatus_Response = __bind(this._convertPayStatus_Response, this);
      this._translateState = __bind(this._translateState, this);
      this.executeProvider = __bind(this.executeProvider, this);
      this._convertPayRequest_Response = __bind(this._convertPayRequest_Response, this);
      this.requestProvider = __bind(this.requestProvider, this);
      this.setAuthentication = __bind(this.setAuthentication, this);
      this.createToken = __bind(this.createToken, this);
      this.initialize = __bind(this.initialize, this);
      _ref = ClickAndBuyPayment.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ClickAndBuyPayment.prototype.type = "clickandbuy";

    ClickAndBuyPayment.prototype.initialize = function() {
      this._currencies = config.get("defaultcurrency");
      this.cbConfig = config.get("clickandbuy");
    };

    ClickAndBuyPayment.prototype.createToken = function(pid, secret) {
      var ts, _hash, _hs;
      ts = moment().utc().format("YYYYMMDDHHmmSS");
      _hs = "" + pid + "::" + secret + "::" + ts;
      _hash = crypto.createHash('sha1').update(_hs).digest('hex');
      return ts + "::" + _hash;
    };

    ClickAndBuyPayment.prototype.setAuthentication = function(cb) {
      var authHeader;
      authHeader = "<ns2:authentication>\n	<ns2:merchantID>" + this.cbConfig.merchantid + "</ns2:merchantID>\n	<ns2:projectID>" + this.cbConfig.projectid + "</ns2:projectID>\n	<ns2:token>" + (this.createToken(this.cbConfig.projectid, this.cbConfig.cryptokey)) + "</ns2:token>\n</ns2:authentication>";
      cb(null, authHeader);
    };

    ClickAndBuyPayment.prototype.requestProvider = function(authHeader, cb) {
      var opt, _urls, _xml,
        _this = this;
      _urls = this.getUrls();
      _xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">\n	<SOAP-ENV:Header/>\n	<SOAP-ENV:Body>\n		<ns2:payRequest_Request xmlns:ns2=\"http://api.clickandbuy.com/webservices/pay_1_1_0/\">\n			" + authHeader + "\n			<ns2:details>\n				<ns2:consumerCountry>" + this.cbConfig.localcode + "</ns2:consumerCountry>\n				<ns2:amount>\n					<ns2:amount>" + this.amount + "</ns2:amount>\n					<ns2:currency>" + this.currency + "</ns2:currency>\n				</ns2:amount>\n				<ns2:orderDetails>\n					<ns2:text>" + this.desc + "</ns2:text>\n				</ns2:orderDetails>\n				<ns2:successURL>" + _urls.success + "</ns2:successURL>\n				<ns2:failureURL>" + _urls.cancel + "</ns2:failureURL>\n				<ns2:externalID>" + this.id + "</ns2:externalID>\n			</ns2:details>\n		</ns2:payRequest_Request>\n	</SOAP-ENV:Body>\n</SOAP-ENV:Envelope>";
      this.debug("raw xml", _xml);
      _xml = new Buffer(_xml, 'utf8');
      opt = {
        url: this.cbConfig.endpoint,
        method: "POST",
        body: _xml,
        headers: {
          "User-Agent": "node-payments",
          "Accept": "application/xml,text/xml",
          "Accept-Encoding": "utf-8",
          "Accept-Charset": "utf-8",
          "Connection": "Keep-Alive",
          "Content-Type": "text/xml; charset=utf-8"
        }
      };
      this.debug("send clickandbuy payment", opt);
      request(opt, function(err, response, bodyXml) {
        _this.debug("clickandbuy payment response", response.statusCode, bodyXml);
        if (err) {
          cb(err);
          return;
        }
        xmlParser.parseString(bodyXml, function(err, bodyObj) {
          var _converted, _data, _ref1, _ref2;
          if (err) {
            cb(err);
            return;
          }
          _data = (_ref1 = bodyObj["SOAP-ENV:Envelope"]) != null ? _ref1["SOAP-ENV:Body"] : void 0;
          _this.debug("clickandbuy payment parsed xml", _data || bodyObj);
          if (response.statusCode !== 200) {
            cb((_data != null ? (_ref2 = _data[0]) != null ? _ref2["SOAP-ENV:Fault"] : void 0 : void 0) || _data || bodyObj);
            return;
          }
          _converted = _this._convertPayRequest_Response(_data);
          _this.set("rawProviderState", _converted.state);
          _converted.state = _this._translateState(_converted.state);
          _this.debug("clickandbuy payment parsed xml", _converted);
          return cb(null, _converted.id, _converted.link, _converted.transaction);
        });
      });
    };

    ClickAndBuyPayment.prototype._convertPayRequest_Response = function(raw) {
      var ret, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _resp, _trans;
      ret = {};
      _resp = raw != null ? (_ref1 = raw[0]) != null ? (_ref2 = _ref1["ns2:payRequest_Response"]) != null ? _ref2[0] : void 0 : void 0 : void 0;
      ret.id = _resp != null ? (_ref3 = _resp["ns2:requestTrackingID"]) != null ? _ref3[0] : void 0 : void 0;
      _trans = _resp != null ? (_ref4 = _resp["ns2:transaction"]) != null ? _ref4[0] : void 0 : void 0;
      this.debug("_convertPayRequest_Response", _resp, _trans);
      ret.transaction = _trans != null ? (_ref5 = _trans["ns2:transactionID"]) != null ? _ref5[0] : void 0 : void 0;
      ret.state = _trans != null ? (_ref6 = _trans["ns2:transactionStatus"]) != null ? _ref6[0] : void 0 : void 0;
      ret.link = _trans != null ? (_ref7 = _trans["ns2:redirectURL"]) != null ? _ref7[0] : void 0 : void 0;
      return ret;
    };

    ClickAndBuyPayment.prototype.executeProvider = function(token, auth, cb) {
      var opt, _xml,
        _this = this;
      _xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<SOAP-ENV:Envelope xmlns:SOAP-ENV=\"http://schemas.xmlsoap.org/soap/envelope/\">\n	<SOAP-ENV:Header/>\n	<SOAP-ENV:Body>\n		<ns2:statusRequest_Request xmlns:ns2=\"http://api.clickandbuy.com/webservices/pay_1_1_0/\">\n			" + auth + "\n			<ns2:details>\n				<ns2:transactionIDList>\n					<ns2:transactionID>" + this.transaction + "</ns2:transactionID>\n				</ns2:transactionIDList>\n			</ns2:details>\n		</ns2:statusRequest_Request>\n	</SOAP-ENV:Body>\n</SOAP-ENV:Envelope>";
      this.debug("raw xml", _xml);
      opt = {
        url: this.cbConfig.endpoint,
        method: "POST",
        body: _xml,
        headers: {
          "User-Agent": "node-payments",
          "Accept": "application/xml,text/xml",
          "Accept-Encoding": "utf-8",
          "Accept-Charset": "utf-8",
          "Connection": "Keep-Alive",
          "Content-Type": "text/xml; charset=utf-8"
        }
      };
      this.debug("send clickandbuy payment", JSON.stringify(opt, true, 4));
      request(opt, function(err, response, bodyXml) {
        _this.debug("clickandbuy payment response", response.statusCode, bodyXml);
        if (err) {
          cb(err);
          return;
        }
        xmlParser.parseString(bodyXml, function(err, bodyObj) {
          var _converted, _data, _ref1, _ref2;
          if (err) {
            cb(err);
            return;
          }
          _data = (_ref1 = bodyObj["SOAP-ENV:Envelope"]) != null ? _ref1["SOAP-ENV:Body"] : void 0;
          _this.debug("clickandbuy payment parsed xml", _data || bodyObj);
          if (response.statusCode !== 200) {
            cb((_data != null ? (_ref2 = _data[0]) != null ? _ref2["SOAP-ENV:Fault"] : void 0 : void 0) || _data || bodyObj);
            return;
          }
          _converted = _this._convertPayStatus_Response(_data);
          _this.set("rawProviderState", _converted.state);
          _converted.state = _this._translateState(_converted.state);
          _this.info("EXEC RESPONSE", JSON.stringify(_converted, true, 4));
          return cb(null, _converted.state);
        });
      });
    };

    ClickAndBuyPayment.prototype._translateState = function(cbState) {
      return stateMapping[cbState.toUpperCase()] || "UNKONWN";
    };

    ClickAndBuyPayment.prototype._convertPayStatus_Response = function(raw) {
      var ret, _ref1, _ref2, _ref3, _ref4, _ref5, _ref6, _ref7, _ref8, _resp, _trans;
      ret = {};
      this.debug("_convertPayStatus_Response", JSON.stringify(raw, 1, 4));
      _resp = raw != null ? (_ref1 = raw[0]) != null ? (_ref2 = _ref1["ns2:statusRequest_Response"]) != null ? _ref2[0] : void 0 : void 0 : void 0;
      ret.id = _resp != null ? (_ref3 = _resp["ns2:requestTrackingID"]) != null ? _ref3[0] : void 0 : void 0;
      _trans = _resp != null ? (_ref4 = _resp["ns2:transactionList"]) != null ? (_ref5 = _ref4[0]) != null ? (_ref6 = _ref5["ns2:transaction"]) != null ? _ref6[0] : void 0 : void 0 : void 0 : void 0;
      this.debug("_convertPayRequest_Response", _resp, _trans);
      ret.transaction = _trans != null ? (_ref7 = _trans["ns2:transactionID"]) != null ? _ref7[0] : void 0 : void 0;
      ret.state = _trans != null ? (_ref8 = _trans["ns2:transactionStatus"]) != null ? _ref8[0] : void 0 : void 0;
      return ret;
    };

    return ClickAndBuyPayment;

  })(require("../_base/payment"));

}).call(this);
