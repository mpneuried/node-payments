(function() {
  var PaypalIPN, assert, config, express, request, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  assert = require("assert");

  _ = require("lodash");

  express = require("express");

  request = require("request");

  config = require("../lib/config");

  PaypalIPN = (function(_super) {
    __extends(PaypalIPN, _super);

    function PaypalIPN() {
      this.ppIpnReturn = __bind(this.ppIpnReturn, this);
      this.sendPaypalIPN = __bind(this.sendPaypalIPN, this);
      this.routes = __bind(this.routes, this);
      this.start = __bind(this.start, this);
      this.init = __bind(this.init, this);
      PaypalIPN.__super__.constructor.apply(this, arguments);
      this.server = express();
      this.init().routes().start();
      return;
    }

    PaypalIPN.prototype.init = function() {
      this.server.set("title", "fake-IPN for node-payment");
      this.server.use(express.logger("dev"));
      return this;
    };

    PaypalIPN.prototype.start = function() {
      this.server.listen(this.config.listenport);
      return this;
    };

    PaypalIPN.prototype.routes = function() {
      this.server.post(this.config.receiverPath, this.ppIpnReturn);
      return this;
    };

    PaypalIPN.prototype.sendPaypalIPN = function(payment, status) {
      var opt, _body, _host, _port, _pre, _secure,
        _this = this;
      if (status == null) {
        status = "Completed";
      }
      _secure = config.get("serverSecure");
      _port = config.get("serverDefaultPort");
      _host = config.get("serverDefaultHost");
      _pre = _secure ? "https://" : "http://";
      _pre += _host;
      if (_port !== 80) {
        _pre += ":" + _port;
      }
      _body = {
        receiver_email: this.config.receiver_email,
        receiver_id: "S8XGHLYDW9T3S",
        residence_country: "US",
        test_ipn: 1,
        transaction_subject: "",
        txn_id: "61E67681CH3238416",
        txn_type: "express_checkout",
        payer_email: "mp+test@tcs.de",
        payer_id: payment.payer_id,
        payer_status: "verified",
        first_name: "Test",
        last_name: "User",
        address_city: "San+Jose",
        address_country: "United+States",
        address_country_code: "US",
        address_name: "Test+User",
        address_state: "CA",
        address_status: "confirmed",
        address_street: "1+Main+St",
        address_zip: "95131",
        custom: payment.id,
        handling_amount: 0,
        item_name: payment.desc,
        item_number: "",
        mc_currency: payment.currency,
        mc_fee: "0.88",
        mc_gross: payment.amount,
        payment_date: "20%3A12%3A59+Jan+13%2C+2009+PST",
        payment_fee: "0.88",
        payment_gross: "19.95",
        payment_status: status,
        payment_type: "instant",
        protection_eligibility: "Eligible",
        quantity: 1,
        shipping: "0.00",
        tax: "0.00",
        charset: "windows-1252",
        notify_version: "2.6",
        verify_sign: "AtkOfCXbDm2hu0ZELryHFjY-Vb7PAUvS6nMXgysbElEn9v-1XcmSoGtf"
      };
      this.lastQuery = JSON.stringify(_body);
      opt = {
        method: "POST",
        url: _host + config.get("paypalipn").path,
        form: _body
      };
      request(opt, function(err, resp, body) {
        if (err) {
          throw err;
        }
      });
    };

    PaypalIPN.prototype.ppIpnReturn = function(req, res) {
      try {
        assert.deepEqual(_.omit(req.body, ["cmd"]), JSON.parse(this.lastQuery || "{}"));
      } catch (_error) {
        res.send("INVALID");
        return;
      }
      res.send("VERIFIED");
    };

    return PaypalIPN;

  })(require("../lib/basic"));

  module.exports = new PaypalIPN();

}).call(this);
