(function() {
  var PaypalPayment, config,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  module.exports = PaypalPayment = (function(_super) {
    __extends(PaypalPayment, _super);

    PaypalPayment.prototype.type = "paypalrest";

    function PaypalPayment() {
      this.executeProvider = __bind(this.executeProvider, this);
      this.requestProvider = __bind(this.requestProvider, this);
      this.setAuthentication = __bind(this.setAuthentication, this);
      this.ppInited = false;
      this.ppClient = require('paypal-rest-sdk');
      PaypalPayment.__super__.constructor.apply(this, arguments);
      return;
    }

    PaypalPayment.prototype.setAuthentication = function(cb) {
      if (this.ppInited) {
        cb(null, true);
        return;
      }
      this.ppInited = true;
      this.ppClient.configure(config.get("paypal"));
      cb(null, true);
    };

    PaypalPayment.prototype.requestProvider = function(auth, cb) {
      var _oPP, _urls,
        _this = this;
      _urls = this.getUrls();
      _oPP = {
        intent: "sale",
        payer: {
          payment_method: "paypal"
        },
        transactions: [
          {
            amount: {
              total: this.amount,
              currency: this.currency
            },
            description: this.desc
          }
        ],
        redirect_urls: {
          return_url: _urls.success,
          cancel_url: _urls.cancel
        }
      };
      this.debug("send paypal payment", JSON.stringify(_oPP, true, 4));
      this.ppClient.payment.create(_oPP, function(err, response) {
        var link, _i, _len, _ref;
        if (err) {
          cb(err);
          return;
        }
        _this.info("PAYMENT RESPONSE", JSON.stringify(response, true, 4));
        _this.debug("paypal payment links", response.links);
        _ref = response.links;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          link = _ref[_i];
          if (!(link.rel === "approval_url")) {
            continue;
          }
          cb(null, response.id, link.href);
          return;
        }
        cb(null, response.id, response.links);
      });
    };

    PaypalPayment.prototype.executeProvider = function(token, auth, cb) {
      var _this = this;
      this.ppClient.payment.execute(this.pay_id, {
        payer_id: this.payer_id
      }, {}, function(err, response) {
        if (err) {
          cb(err);
          return;
        }
        _this.info("EXEC RESPONSE", JSON.stringify(response, true, 4));
        cb(null, response.state.toUpperCase(), response);
      });
    };

    return PaypalPayment;

  })(require("../_base/payment"));

}).call(this);
