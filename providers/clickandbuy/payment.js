(function() {
  var ClickAndBuyPayment, config, crypto, moment, querystring, request, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  querystring = require("querystring");

  crypto = require("crypto");

  moment = require("moment");

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  module.exports = ClickAndBuyPayment = (function(_super) {
    __extends(ClickAndBuyPayment, _super);

    function ClickAndBuyPayment() {
      this.executeProvider = __bind(this.executeProvider, this);
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
      authHeader = "<authentication>\n	<merchantID>" + this.cbConfig.merchantid + "</merchantID>\n	<projectID>" + this.cbConfig.projectid + "</projectID>\n	<token>" + (this.createToken(this.cbConfig.projectid, this.cbConfig.cryptokey)) + "aaa</token>\n</authentication>";
      cb(null, authHeader);
    };

    ClickAndBuyPayment.prototype.requestProvider = function(authHeader, cb) {
      var opt, _req, _urls, _xml,
        _this = this;
      _urls = this.getUrls();
      _xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n<payRequest_Request xmlns=\"http://api.clickandbuy.com/webservices/pay_1_1_0/\">\n	" + authHeader + "\n	<details>\n		<consumerCountry>" + this.cbConfig.localcode + "</consumerCountry>\n		<amount>\n			<amount>" + this.amount + "</amount>\n			<currency>" + this.currency + "</currency>\n		</amount>\n		<orderDetails>\n			<text>" + this.desc + "</text>\n		</orderDetails>\n		<successURL>" + _urls.success + "</successURL>\n		<failureURL>" + _urls.cancel + "</failureURL>\n		<externalID>" + this.id + "</externalID>\n	</details>\n</payRequest_Request>";
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
      _req = request(opt, function(err, response, body) {
        _this.debug("clickandbuy payment response", body);
        cb("not-implemented");
      });
    };

    ClickAndBuyPayment.prototype.executeProvider = function(token, auth, cb) {
      var data, opt,
        _this = this;
      data = {
        VERSION: 98,
        METHOD: "DoExpressCheckoutPayment",
        LOCALECODE: this.cbConfig.localcode,
        PAYMENTREQUEST_0_PAYMENTACTION: "SALE",
        PAYMENTREQUEST_0_AMT: this.amount,
        PAYMENTREQUEST_0_CURRENCYCODE: this.currency,
        L_PAYMENTREQUEST_0_NUMBER0: 1,
        L_PAYMENTREQUEST_0_NAME0: this.desc,
        L_PAYMENTREQUEST_0_QTY0: 1,
        L_PAYMENTREQUEST_0_AMT0: this.amount,
        token: this.pay_id,
        payerid: this.payer_id
      };
      opt = {
        url: this.cbConfig.endpoint,
        method: "POST",
        form: this.extend(data, auth)
      };
      this.debug("send clickandbuy payment", JSON.stringify(opt, true, 4));
      request(opt, function(err, response, rbody) {
        var body, _state;
        body = querystring.parse(rbody);
        if (err || ((body != null ? body.error : void 0) != null) || (body != null ? body.ACK : void 0) !== "Success") {
          if (err) {
            cb(err);
          } else if ((body != null ? body.error : void 0) != null) {
            cb(_.first(body != null ? body.error : void 0));
          } else {
            cb(body);
          }
          return;
        }
        _state = body.PAYMENTINFO_0_PAYMENTSTATUS.toUpperCase();
        _this.info("EXEC RESPONSE", JSON.stringify(body, true, 4));
        cb(null, _state);
      });
    };

    return ClickAndBuyPayment;

  })(require("../_base/payment"));

}).call(this);
