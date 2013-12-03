(function() {
  var ClickAndBuyMMS, async, config, crypto, request, xml2js, xmlParser, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  request = require("request");

  crypto = require("crypto");

  _ = require("lodash");

  async = require("async");

  xml2js = require("xml2js");

  xmlParser = new xml2js.Parser();

  ClickAndBuyMMS = (function(_super) {
    __extends(ClickAndBuyMMS, _super);

    function ClickAndBuyMMS() {
      this.ERRORS = __bind(this.ERRORS, this);
      this.processEvent = __bind(this.processEvent, this);
      this.input = __bind(this.input, this);
      this.verify = __bind(this.verify, this);
      this.checkSignature = __bind(this.checkSignature, this);
      this.answer200 = __bind(this.answer200, this);
      this.init = __bind(this.init, this);
      this.initialize = __bind(this.initialize, this);
      _ref = ClickAndBuyMMS.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    ClickAndBuyMMS.prototype.initialize = function() {
      this.cbConfig = config.get("clickandbuy");
      this.initialized = false;
      this._currencies = config.get("defaultcurrency");
    };

    ClickAndBuyMMS.prototype.init = function(main) {
      var server;
      this.main = main;
      if (!this.initialized) {
        this.initialized = true;
        server = this.main.getExpress();
        server.post(this.config.receiverPath, this.verify, this.input);
      }
    };

    ClickAndBuyMMS.prototype.answer200 = function(req, res, next) {
      this.debug("IPN Input", req.body);
      res.send("OK");
      next();
    };

    ClickAndBuyMMS.prototype.checkSignature = function(xml, sig, secret) {
      var _cleanXML, _hash, _hs;
      _cleanXML = xml.replace("<signature>" + sig + "</signature>", "<signature />");
      _hs = "" + secret + _cleanXML;
      _hash = crypto.createHash('sha1').update(_hs).digest('hex');
      console.log(_hash, sig, _cleanXML);
      if (sig === _hash) {
        return true;
      } else {
        return false;
      }
    };

    ClickAndBuyMMS.prototype.verify = function(req, res, next) {
      var _this = this;
      if (req.body.xml == null) {
        res.send("OK");
        return;
      }
      xmlParser.parseString(req.body.xml, function(err, bodyObj) {
        var signature, _ref1, _ref2, _ref3;
        if (err) {
          _this.error("parse xml", err);
          res.send("FAILED", 500);
          return;
        }
        signature = bodyObj != null ? (_ref1 = bodyObj.eventlist) != null ? (_ref2 = _ref1.signature) != null ? _ref2[0] : void 0 : void 0 : void 0;
        req._mmsevents = bodyObj != null ? (_ref3 = bodyObj.eventlist) != null ? _ref3.payEvent : void 0 : void 0;
        if (_this.checkSignature(req.body.xml, signature, _this.config.cryptokey)) {
          next();
        } else {
          _this._handleError(null, "ECBMMSINVALIDSIGNATURE");
          res.send("FAILED", 500);
        }
      });
    };

    ClickAndBuyMMS.prototype.input = function(req, res) {
      var afns, _event, _i, _len, _ref1,
        _this = this;
      afns = [];
      _ref1 = req._mmsevents;
      for (_i = 0, _len = _ref1.length; _i < _len; _i++) {
        _event = _ref1[_i];
        afns.push(this.processEvent(_event));
      }
      async.series(afns, function(err) {
        _this.info("processed " + afns.length + " mms events");
        if (err != null) {
          _this.error(err);
          res.send("FAILED", 500);
          return;
        }
        res.send("OK");
      });
    };

    ClickAndBuyMMS.prototype.processEvent = function(data) {
      var _this = this;
      return function(cb) {
        var _amount, _atype, _currency, _dataAmout, _merchantID, _payer, _pid, _rawstate, _ref1, _transaction;
        _pid = data.externalID[0];
        _rawstate = data.newState[0];
        _transaction = data.transactionID[0];
        _merchantID = data.merchantID[0];
        _dataAmout = data.merchantAmount[0];
        _currency = _dataAmout.currency[0];
        _payer = (_ref1 = data.crn) != null ? _ref1[0] : void 0;
        _atype = _this._currencies[_currency];
        if (_atype === "int") {
          _amount = parseInt(_dataAmout.amount[0], 10);
        } else {
          _amount = parseFloat(_dataAmout.amount[0], 10);
        }
        if ((_this.cbConfig.merchantid != null) && _merchantID !== _this.cbConfig.merchantid) {
          _this._handleError(cb, "ECBMMSINVALIDMERCHANT", {
            got: _merchantID,
            needed: _this.cbConfig.merchantid
          });
          return;
        }
        _this.main.getPayment(_pid, function(err, payment) {
          var _state;
          if (err) {
            cb(err);
            return;
          }
          _this.debug("MMS returned", _pid, payment.valueOf());
          if (_currency !== payment.currency) {
            _this._handleError(cb, "ECBMMSINVALIDCURRENCY", {
              got: _currency,
              needed: payment.currency
            });
            return;
          }
          if (Math.abs(_amount) !== payment.amount) {
            _this._handleError(cb, "ECBMMSINVALIDAMOUNT", {
              got: _amount,
              needed: payment.amount
            });
            return;
          }
          _state = payment._translateState(_rawstate);
          payment.set("rawProviderState", _rawstate);
          if (_payer != null ? _payer.length : void 0) {
            payment.set("payer_id", _payer);
          }
          payment.set("state", _state);
          payment.set("transaction", _transaction);
          payment.set("verified", true);
          payment.persist(function(err) {
            if (err) {
              cb(err);
              return;
            }
            _this.main.emit("payment", "verfied", payment);
            _this.main.emit("payment:" + payment.id, "verfied", payment);
            _this.main.emit("verfied", payment);
            cb(null);
          });
        });
      };
    };

    ClickAndBuyMMS.prototype.ERRORS = function() {
      return this.extend(ClickAndBuyMMS.__super__.ERRORS.apply(this, arguments), {
        "ECBMMSINVALIDMERCHANT": "The click and buy MMS sends a completed message for a wrong receiver. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "ECBMMSINVALIDCURRENCY": "The click and buy MMS sends a currency unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "ECBMMSINVALIDAMOUNT": "The click and buy MMS sends a amount unlike the expected. Has to be `<%= needed %>` bot got `<%= got %>`.",
        "ECBMMSINVALIDSIGNATURE": "The signature check failed."
      });
    };

    return ClickAndBuyMMS;

  })(require("../_base/main"));

  module.exports = new ClickAndBuyMMS();

}).call(this);
