(function() {
  var PayPalIpn, config, request, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  request = require("request");

  _ = require("lodash");

  PayPalIpn = (function(_super) {
    __extends(PayPalIpn, _super);

    function PayPalIpn() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.input = __bind(this.input, this);
      this.verify = __bind(this.verify, this);
      this.init = __bind(this.init, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PayPalIpn.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PayPalIpn.prototype.initialize = function() {
      this.initialized = false;
      this._currencies = config.get("defaultcurrency");
    };

    PayPalIpn.prototype.init = function(main) {
      var server;
      this.main = main;
      if (!this.initialized) {
        this.initialized = true;
        server = this.main.getExpress();
        server.post(this.config.receiverPath, this.verify, this.input);
      }
    };

    PayPalIpn.prototype.verify = function(req, res, next) {
      var opt, _formdata, _url,
        _this = this;
      _formdata = _.extend({}, req.body, {
        cmd: "_notify-validate"
      });
      _url = (this.config.secure ? "https://" : "http://") + this.config.host + ((this.config.port == null) || this.config.port !== 80 ? ":" + this.config.port : "");
      if (!this.config.listenport) {
        _url += this.config.ppReturnPath;
      } else {
        _url += this.config.receiverPath;
      }
      opt = {
        method: "POST",
        url: _url,
        form: _formdata
      };
      request(opt, function(err, resp, body) {
        _this.info("VERIFY IPN MESSAGE", opt, err, body);
        if (err) {
          _this.error(err);
          res.send("FAILED", 500);
          return;
        }
        if (body === "VERIFIED") {
          next();
        } else {
          _this.error(err);
          res.send("FAILED", 500);
        }
      });
    };

    PayPalIpn.prototype.input = function(req, res, next) {
      var _amount, _atype, _currency, _err, _pid, _receiver, _status, _transaction,
        _this = this;
      try {
        _pid = req.body.custom;
        _status = req.body.payment_status.toUpperCase();
        _receiver = req.body.receiver_email;
        _currency = req.body.mc_currency;
        _transaction = req.body.txn_id;
        _atype = this._currencies[_currency];
        if (_atype === "int") {
          _amount = parseInt(req.body.mc_gross, 10);
        } else {
          _amount = parseFloat(req.body.mc_gross, 10);
        }
        if ((this.config.receiver_email != null) && _receiver !== this.config.receiver_email) {
          this._handleError(null, "EPPIPNINVALIDRECEIVER", {
            got: _receiver,
            needed: this.config.receiver_email
          });
          res.send("FAILED", 500);
          return;
        }
        this.main.getPayment(_pid, function(err, payment) {
          if (err) {
            if (!config.get("productionmode") && (err != null ? err.name : void 0) === "EPAYMENTNOTFOUND") {
              _this.warning("Payment not found in system so return a 200 to IPN");
              res.send("NOTFOUND", 200);
              return;
            }
            _this.error(err);
            res.send("FAILED", 500);
            return;
          }
          _this.debug("IPN returned", _pid, payment.valueOf());
          if (_currency !== payment.currency) {
            _this._handleError(null, "EPPIPNINVALIDCURRENCY", {
              got: _currency,
              needed: payment.currency
            });
            res.send("FAILED", 500);
            return;
          }
          if (Math.abs(_amount) !== payment.amount) {
            _this._handleError(null, "EPPIPNINVALIDAMOUNT", {
              got: _amount,
              needed: payment.amount
            });
            res.send("FAILED", 500);
            return;
          }
          payment.set("rawProviderState", req.body.payment_status);
          payment.set("state", _status);
          payment.set("transaction", _transaction);
          payment.set("verified", true);
          payment.persist(function(err) {
            if (err) {
              _this.error(err);
              res.send("FAILED", 500);
              return;
            }
            _this.main.emit("payment", "verfied", payment);
            _this.main.emit("payment:" + payment.id, "verfied", payment);
            _this.main.emit("verfied", payment);
            res.send("OK");
          });
        });
      } catch (_error) {
        _err = _error;
        this.error(_err);
        res.send("FAILED", 500);
        return;
      }
    };

    PayPalIpn.prototype.ERRORS = function() {
      return this.extend(PayPalIpn.__super__.ERRORS.apply(this, arguments), {
        "EPPIPNINVALIDRECEIVER": "The paypal IPN sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDCURRENCY": "The paypal IPN sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "EPPIPNINVALIDAMOUNT": "The paypal IPN sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`."
      });
    };

    return PayPalIpn;

  })(require("../_base/main"));

  module.exports = new PayPalIpn();

}).call(this);
