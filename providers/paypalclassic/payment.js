(function() {
  var PaypalClassicPayment, config, querystring, request, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  querystring = require("querystring");

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  module.exports = PaypalClassicPayment = (function(_super) {
    __extends(PaypalClassicPayment, _super);

    function PaypalClassicPayment() {
      this.executeProvider = __bind(this.executeProvider, this);
      this.requestProvider = __bind(this.requestProvider, this);
      this.setAuthentication = __bind(this.setAuthentication, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PaypalClassicPayment.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PaypalClassicPayment.prototype.type = "paypalclassic";

    PaypalClassicPayment.prototype.initialize = function() {
      this._currencies = config.get("defaultcurrency");
      this.ppcConfig = config.get("paypalclassic");
      this.ppIpnConfig = config.get("paypalipn");
    };

    PaypalClassicPayment.prototype.setAuthentication = function(cb) {
      var data;
      data = {
        USER: this.ppcConfig.userid,
        PWD: this.ppcConfig.password,
        SIGNATURE: this.ppcConfig.signature
      };
      cb(null, data);
    };

    PaypalClassicPayment.prototype.requestProvider = function(auth, cb) {
      var data, opt, _urls,
        _this = this;
      _urls = this.getUrls();
      data = {
        VERSION: 98,
        METHOD: "SetExpressCheckout",
        LOCALECODE: this.ppcConfig.localcode,
        PAYMENTREQUEST_0_PAYMENTACTION: "SALE",
        REQCONFIRMSHIPPING: 0,
        NOSHIPPING: 1,
        ALLOWNOTE: 0,
        SOLUTIONTYPE: "Sole",
        LANDINGPAGE: "Billing",
        PAYMENTREQUEST_0_AMT: this.amount,
        PAYMENTREQUEST_0_CURRENCYCODE: this.currency,
        PAYMENTREQUEST_0_CUSTOM: this.id,
        L_PAYMENTREQUEST_0_NUMBER0: 1,
        L_PAYMENTREQUEST_0_NAME0: this.desc,
        L_PAYMENTREQUEST_0_QTY0: 1,
        L_PAYMENTREQUEST_0_AMT0: this.amount,
        RETURNURL: _urls.success,
        CANCELURL: _urls.cancel
      };
      opt = {
        url: this.ppcConfig.endpoint,
        method: "POST",
        form: this.extend(data, auth)
      };
      this.debug("send paypal payment", JSON.stringify(opt, true, 4));
      request(opt, function(err, response, rbody) {
        var body, link;
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
        link = _.template(_this.ppcConfig.linkTemplate, {
          token: body.TOKEN
        });
        _this.debug("paypal payment response", body, link);
        cb(null, body.TOKEN, link);
      });
    };

    PaypalClassicPayment.prototype.executeProvider = function(token, auth, cb) {
      var data, opt,
        _this = this;
      data = {
        VERSION: 98,
        METHOD: "DoExpressCheckoutPayment",
        LOCALECODE: this.ppcConfig.localcode,
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
        url: this.ppcConfig.endpoint,
        method: "POST",
        form: this.extend(data, auth)
      };
      this.debug("send paypal payment", JSON.stringify(opt, true, 4));
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

    return PaypalClassicPayment;

  })(require("../_base/payment"));

}).call(this);
