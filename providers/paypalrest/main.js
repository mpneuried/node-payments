(function() {
  var PayPalRest, config, request, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  module.exports = PayPalRest = (function(_super) {
    __extends(PayPalRest, _super);

    function PayPalRest() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.ipnInput = __bind(this.ipnInput, this);
      this.verifyPayPalIpn = __bind(this.verifyPayPalIpn, this);
      this.answer200 = __bind(this.answer200, this);
      this.initIPN = __bind(this.initIPN, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PayPalRest.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PayPalRest.prototype.payment = require("./payment");

    PayPalRest.prototype.initialize = function() {
      this._currencies = config.get("defaultcurrency");
      this._ipnCnf = config.get("paypalipn");
      this.initIPN();
    };

    PayPalRest.prototype.initIPN = function() {
      var server;
      server = this.main.getExpress();
      server.post(this._ipnCnf.receiverPath, this.answer200, this.verifyPayPalIpn, this.ipnInput);
    };

    PayPalRest.prototype.answer200 = function(req, res, next) {
      this.debug("IPN Input", req.body);
      res.send("OK");
      next();
    };

    PayPalRest.prototype.verifyPayPalIpn = function(req, res, next) {
      var opt, _formdata,
        _this = this;
      _formdata = _.extend({}, req.body, {
        cmd: "_notify-validate"
      });
      opt = {
        method: "POST",
        url: (this._ipnCnf.secure ? "https://" : "http://") + this._ipnCnf.host + ((this._ipnCnf.port == null) || this._ipnCnf.port !== 80 ? ":" + this._ipnCnf.port : "") + this._ipnCnf.ppReturnPath,
        form: _formdata
      };
      request(opt, function(err, resp, body) {
        _this.info("VERIFY IPN MESSAGE", err, body);
        if (err) {
          _this.error(err);
          return;
        }
        if (body === "VERIFIED") {
          next();
        } else {
          _this.error(err);
        }
      });
    };

    PayPalRest.prototype.ipnInput = function(req, res) {
      var _amount, _atype, _currency, _pid, _receiver, _status,
        _this = this;
      _pid = req.body.custom;
      _status = req.body.payment_status.toUpperCase();
      _receiver = req.body.receiver_email;
      _currency = req.body.mc_currency;
      _atype = this._currencies[_currency];
      if (_atype === "int") {
        _amount = parseInt(req.body.mc_gross, 10);
      } else {
        _amount = parseFloat(req.body.mc_gross, 10);
      }
      if (_receiver !== this._ipnCnf.receiver_email) {
        this._handleError(null, "EPPIPNINVALIDRECEIVER", {
          got: _receiver,
          needed: this._ipnCnf.receiver_email
        });
        return;
      }
      this.main.getPayment(_pid, function(err, payment) {
        if (err) {
          _this.error(err);
          return;
        }
        _this.debug("IPN returned", _pid, payment.valueOf());
        if (_currency !== payment.currency) {
          _this._handleError(null, "EPPIPNINVALIDCURRENCY", {
            got: _currency,
            needed: payment.currency
          });
          return;
        }
        if (Math.abs(_amount) !== payment.amount) {
          _this._handleError(null, "EPPIPNINVALIDAMOUNT", {
            got: _amount,
            needed: payment.amount
          });
          return;
        }
        payment.set("state", _status);
        payment.set("verified", true);
        payment.persist(function(err) {
          if (_status === "COMPLETED") {
            if (err) {
              _this.error(err);
              return;
            }
            _this.main.emit("payment", "verified", payment);
            _this.main.emit("payment:" + payment.id, "verified", payment);
          }
        });
      });
    };

    PayPalRest.prototype.ERRORS = function() {
      return this.extend(PayPalRest.__super__.ERRORS.apply(this, arguments), {
        "EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDAMOUNT": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."
      });
    };

    return PayPalRest;

  })(require("../_base/main"));

}).call(this);
