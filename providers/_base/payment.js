(function() {
  var BasePayment, config, uuid, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  _ = require("lodash");

  uuid = require("uuid");

  config = require("../../lib/config");

  module.exports = BasePayment = (function(_super) {
    __extends(BasePayment, _super);

    BasePayment.prototype.type = "_base";

    function BasePayment(ownProvider, data, options) {
      var _ref;
      this.ownProvider = ownProvider;
      this.ERRORS = __bind(this.ERRORS, this);
      this.validate = __bind(this.validate, this);
      this._setTransaction = __bind(this._setTransaction, this);
      this._getTransaction = __bind(this._getTransaction, this);
      this._setQuantity = __bind(this._setQuantity, this);
      this._getQuantity = __bind(this._getQuantity, this);
      this._setArticleNumber = __bind(this._setArticleNumber, this);
      this._getArticleNumber = __bind(this._getArticleNumber, this);
      this._setVerified = __bind(this._setVerified, this);
      this._getVerified = __bind(this._getVerified, this);
      this._setVerified = __bind(this._setVerified, this);
      this._getVerified = __bind(this._getVerified, this);
      this._setPayerID = __bind(this._setPayerID, this);
      this._getPayerID = __bind(this._getPayerID, this);
      this._setPayID = __bind(this._setPayID, this);
      this._getPayID = __bind(this._getPayID, this);
      this._setState = __bind(this._setState, this);
      this._getState = __bind(this._getState, this);
      this._setDesc = __bind(this._setDesc, this);
      this._getDesc = __bind(this._getDesc, this);
      this._setCurrency = __bind(this._setCurrency, this);
      this._getCurrency = __bind(this._getCurrency, this);
      this._setAmount = __bind(this._setAmount, this);
      this._getAmount = __bind(this._getAmount, this);
      this._getData = __bind(this._getData, this);
      this.getUrls = __bind(this.getUrls, this);
      this.executeProvider = __bind(this.executeProvider, this);
      this.requestProvider = __bind(this.requestProvider, this);
      this.setAuthentication = __bind(this.setAuthentication, this);
      this.cancel = __bind(this.cancel, this);
      this._executePayment = __bind(this._executePayment, this);
      this.exec = __bind(this.exec, this);
      this.persist = __bind(this.persist, this);
      this.toString = __bind(this.toString, this);
      this.valueOf = __bind(this.valueOf, this);
      this.get = __bind(this.get, this);
      this.set = __bind(this.set, this);
      BasePayment.__super__.constructor.call(this, options);
      this._data = {};
      this._currencies = config.get("defaultcurrency");
      if (data != null ? (_ref = data.id) != null ? _ref.length : void 0 : void 0) {
        this.getter("id", "" + data.id);
      } else {
        this.getter("id", "" + this.type + ":" + (uuid.v1()));
      }
      this.getter("provider", this.type);
      this.define("amount", this._getAmount, this._setAmount);
      this.define("currency", this._getCurrency, this._setCurrency);
      this.define("desc", this._getDesc, this._setDesc);
      this.define("state", this._getState, this._setState);
      this.define("pay_id", this._getPayID, this._setPayID);
      this.define("payer_id", this._getPayerID, this._setPayerID);
      this.define("verified", this._getVerified, this._setVerified);
      this.define("articleNumber", this._getArticleNumber, this._setArticleNumber);
      this.define("quantity", this._getQuantity, this._setQuantity);
      this.define("transaction", this._getTransaction, this._setTransaction);
      this.getter("data", this._getData, false);
      this.set(data);
      return;
    }

    BasePayment.prototype.set = function(_k, _v, _trigger) {
      var _noSetKeys, _ok, _ov;
      if (_trigger == null) {
        _trigger = true;
      }
      _noSetKeys = ["id"];
      if (_.isObject(_k)) {
        for (_ok in _k) {
          _ov = _k[_ok];
          this.set(_ok, _ov, false);
        }
        this.emit("changed", this.data);
      } else if ((_v != null) && __indexOf.call(_noSetKeys, _k) < 0 && !_.isFunction(_v)) {
        this._data[_k] = _v;
        this.emit("changed:" + _k, _v);
        if (_trigger) {
          this.emit("changed", this.data);
        }
      }
      return this;
    };

    BasePayment.prototype.get = function(_k) {
      return this._data[_k];
    };

    BasePayment.prototype.valueOf = function() {
      return this.data;
    };

    BasePayment.prototype.toString = function(format) {
      if (format == null) {
        format = false;
      }
      if (format) {
        return JSON.stringify(this.data, true, 4);
      } else {
        return JSON.stringify(this.data);
      }
    };

    BasePayment.prototype.persist = function(cb) {
      var _this = this;
      this.ownProvider.main.getStore(function(err, store) {
        if (err) {
          cb(err);
          return;
        }
        store.set(_this, function(err) {
          if (err) {
            cb(err);
            return;
          }
          _this.info("PAYMENT Saved", _this.toString(true));
          cb(null);
        });
      });
    };

    BasePayment.prototype.exec = function(cb) {
      var _this = this;
      if (!this.validate(cb)) {
        return;
      }
      this.setAuthentication(function(err, auth) {
        if (err) {
          cb(err);
          return;
        }
        _this.requestProvider(auth, function(err, id, link) {
          if (err) {
            cb(err);
            return;
          }
          _this.set("state", "CREATED");
          _this.set("pay_id", id);
          _this.emit("exec", _this);
          _this.emit("dispose", _this);
          cb(null, link);
        });
      });
    };

    BasePayment.prototype._executePayment = function(token, cb) {
      var _this = this;
      if (!this.validate(cb)) {
        return;
      }
      this.state = "ACCEPTED";
      this.setAuthentication(function(err, auth) {
        if (err) {
          cb(err);
          return;
        }
        _this.executeProvider(token, auth, function(err, state) {
          if (err) {
            cb(err);
            return;
          }
          _this.set("state", state);
          _this.emit("approved", _this);
          _this.emit("dispose", _this);
          cb(null);
        });
      });
    };

    BasePayment.prototype.cancel = function(cb) {
      var _this = this;
      this.set("state", "CANCELD");
      this.persist(function(err) {
        if (err) {
          cb(err);
          return;
        }
        _this.emit("cancel", _this);
        cb(null, _this);
      });
    };

    BasePayment.prototype.setAuthentication = function(cb) {
      this._handleError(cb, "ENOTIMPLEMENTED", {
        method: "setAuthentication"
      });
    };

    BasePayment.prototype.requestProvider = function(auth, cb) {
      this._handleError(cb, "ENOTIMPLEMENTED", {
        method: "setAuthentication"
      });
    };

    BasePayment.prototype.executeProvider = function(auth, cb) {
      this._handleError(cb, "ENOTIMPLEMENTED", {
        method: "setAuthentication"
      });
    };

    BasePayment.prototype.getUrls = function() {
      var redirprefix, _host, _port, _pre, _secure;
      redirprefix = config.get("redirprefix");
      if (redirprefix != null ? redirprefix.length : void 0) {
        _pre = redirprefix.replace(/\/$/g, "");
      } else {
        _secure = config.get("serverSecure");
        _port = this.ownProvider.main.redir.port;
        _host = this.ownProvider.main.redir.host || "localhost";
        _pre = _secure ? "https://" : "http://";
        _pre += _host;
        if (_port !== 80) {
          _pre += ":" + _port;
        }
      }
      return this.ownProvider.main.getUrls(this.id, _pre);
    };

    BasePayment.prototype._getData = function() {
      return this.extend({}, this._data, {
        id: this.id,
        amount: this.amount,
        currency: this.currency,
        provider: this.provider,
        desc: this.desc,
        state: this.state,
        pay_id: this.pay_id,
        payer_id: this.payer_id,
        verified: this.verified,
        quantity: this.quantity,
        articleNumber: this.articleNumber,
        transaction: this.transaction
      });
    };

    BasePayment.prototype._getAmount = function() {
      return this.get("amount") || 0;
    };

    BasePayment.prototype._setAmount = function(val) {
      this.set("amount", val);
    };

    BasePayment.prototype._getCurrency = function() {
      return this.get("currency") || config.get("defaultcurrency");
    };

    BasePayment.prototype._setCurrency = function(val) {
      if (this._currencies[val] == null) {
        this._handleError(null, "ECURRENCYREFUSE", {
          currency: val,
          avail: Object.keys(this._currencies).join(", ")
        });
        return;
      }
      this.set("currency", val);
    };

    BasePayment.prototype._getDesc = function() {
      return this.get("desc") || "";
    };

    BasePayment.prototype._setDesc = function(val) {
      if (!_.isString(val)) {
        this._handleError(null, "EDESCRIPTIONINVALID");
        return;
      }
      this.set("desc", val);
    };

    BasePayment.prototype._getState = function() {
      return this.get("state") || "NEW";
    };

    BasePayment.prototype._setState = function(val) {
      var _states;
      _states = ["NEW", "CREATED", "ACCEPTED", "PENDING", "APPROVED", "COMPLETED", "CANCELD", "REFUNDED"];
      if (__indexOf.call(_states, val) >= 0 && _states.indexOf(this.state) <= _states.indexOf(val)) {
        this.set("state", val);
        return;
      } else {
        this.warning("tried to set a invalid state: `" + val + "`");
      }
    };

    BasePayment.prototype._getPayID = function() {
      return this.get("pay_id") || null;
    };

    BasePayment.prototype._setPayID = function(val) {
      if (val != null ? val.length : void 0) {
        this.set("pay_id", val);
      }
    };

    BasePayment.prototype._getPayerID = function() {
      return this.get("payer_id") || null;
    };

    BasePayment.prototype._setPayerID = function(val) {
      if (val != null ? val.length : void 0) {
        this.set("payer_id", val);
      }
    };

    BasePayment.prototype._getVerified = function() {
      return this.get("verified") || false;
    };

    BasePayment.prototype._setVerified = function(val) {
      if (val != null) {
        this.set("verified", val);
      }
    };

    BasePayment.prototype._getVerified = function() {
      return this.get("verified") || false;
    };

    BasePayment.prototype._setVerified = function(val) {
      if (val != null) {
        this.set("verified", val);
      }
    };

    BasePayment.prototype._getArticleNumber = function() {
      return this.get("articlenumber");
    };

    BasePayment.prototype._setArticleNumber = function(val) {
      if (val != null) {
        this.set("articlenumber", val);
      }
    };

    BasePayment.prototype._getQuantity = function() {
      return this.get("quantity");
    };

    BasePayment.prototype._setQuantity = function(val) {
      if (val != null) {
        this.set("quantity", val);
      }
    };

    BasePayment.prototype._getTransaction = function() {
      return this.get("transaction");
    };

    BasePayment.prototype._setTransaction = function(val) {
      if (val != null) {
        this.set("transaction", val);
      }
    };

    BasePayment.prototype.validate = function(cb) {
      var _amount, _atype;
      _atype = this._currencies[this.currency];
      _amount = this.amount;
      if (_atype === "int") {
        this.amount = parseInt(this.amount, 10);
      } else {
        this.amount = parseFloat(this.amount, 10);
      }
      if (isNaN(this.amount)) {
        this._handleError(cb, "EAMOUNTINVALID", {
          type: _atype
        });
        return false;
      } else if (this.amount <= 0) {
        this._handleError(cb, "EAMOUNTEMPTY");
        return false;
      }
      if (this.desc.length <= 0) {
        this._handleError(cb, "EDESCRIPTIONEMPTY");
        return false;
      }
      return true;
    };

    BasePayment.prototype.ERRORS = function() {
      return this.extend(BasePayment.__super__.ERRORS.apply(this, arguments), {
        "ENOTIMPLEMENTED": "The method `<%= method %>` has to be defined per provider.",
        "ECURRENCYREFUSE": "The currency `<%= currency %>` is not supported. Please use one of `<%= avail %>`",
        "EDESCRIPTIONEMPTY": "The description is empty.",
        "EDESCRIPTIONINVALID": "The description has to be type of string.",
        "EAMOUNTEMPTY": "You tried to pay nothing. Please set the ammount`.",
        "EAMOUNTINVALID": "The amount has to be a of type <%= type %>"
      });
    };

    return BasePayment;

  })(require("../../lib/basic"));

}).call(this);
