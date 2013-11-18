(function() {
  var PayPal, config, request, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  module.exports = PayPal = (function(_super) {
    __extends(PayPal, _super);

    function PayPal() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.ipnInput = __bind(this.ipnInput, this);
      this.verifyPayPalIpn = __bind(this.verifyPayPalIpn, this);
      this.answer200 = __bind(this.answer200, this);
      this.initIPN = __bind(this.initIPN, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PayPal.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PayPal.prototype.payment = require("./payment");

    PayPal.prototype.initialize = function() {
      this._currencies = config.get("defaultcurrency");
      this._ipnCnf = config.get("paypalipn");
      this.initIPN();
    };

    PayPal.prototype.initIPN = function() {
      var server;
      server = this.main.getExpress();
      server.post(this._ipnCnf.path, this.answer200, this.verifyPayPalIpn, this.ipnInput);
    };

    PayPal.prototype.answer200 = function(req, res, next) {
      res.send("OK");
      next();
    };

    PayPal.prototype.verifyPayPalIpn = function(req, res, next) {
      var opt, qs,
        _this = this;
      qs = _.extend({}, req.query, {
        cmd: "_notify-validate"
      });
      opt = {
        method: "GET",
        url: (this._ipnCnf.secure ? "https://" : "http://") + this._ipnCnf.host + ((this._ipnCnf.port == null) || this._ipnCnf.port !== 80 ? ":" + this._ipnCnf.port : "") + this._ipnCnf.path,
        qs: qs
      };
      request(opt, function(err, resp, body) {
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

    PayPal.prototype.ipnInput = function(req, res) {
      var _amount, _atype, _currency, _pid, _receiver, _status,
        _this = this;
      _pid = req.query.custom;
      _status = req.query.payment_status.toUpperCase();
      _receiver = req.query.receiver_email;
      _currency = req.query.mc_currency;
      _atype = this._currencies[_currency];
      if (_atype === "int") {
        _amount = parseInt(req.query.mc_gross, 10);
      } else {
        _amount = parseFloat(req.query.mc_gross, 10);
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
        if (_currency !== payment.currency) {
          _this._handleError(null, "EPPIPNINVALIDCURRENCY", {
            got: _currency,
            needed: payment.currency
          });
          return;
        }
        if (_amount !== payment.amount) {
          _this._handleError(null, "EPPIPNINVALIDAMOUNT", {
            got: _amount,
            needed: payment.amount
          });
          return;
        }
        payment.set("state", _status);
        payment.persist(function(err) {
          if (_status === "COMPLETED") {
            if (err) {
              _this.error(err);
              return;
            }
            _this.main.emit("payment:completed", payment);
            _this.main.emit("completed:" + payment.id, payment);
          }
        });
      });
    };

    PayPal.prototype.ERRORS = function() {
      return this.extend(PayPal.__super__.ERRORS.apply(this, arguments), {
        "EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDAMOUNT": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."
      });
    };

    return PayPal;

  })(require("../_base/main"));

}).call(this);
