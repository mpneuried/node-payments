(function() {
  var MemoryStore, Payments, Redirects, config, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    __slice = [].slice;

  config = require("./config");

  _ = require("lodash");

  Redirects = require("./redirects");

  MemoryStore = require("./paymentstores/memorystore");

  module.exports = Payments = (function(_super) {
    __extends(Payments, _super);

    function Payments(options) {
      this.ERRORS = __bind(this.ERRORS, this);
      this.getPayment = __bind(this.getPayment, this);
      this.onCancelReturn = __bind(this.onCancelReturn, this);
      this.onSuccessReturn = __bind(this.onSuccessReturn, this);
      this._getStore = __bind(this._getStore, this);
      this.addProvider = __bind(this.addProvider, this);
      this._createPayment = __bind(this._createPayment, this);
      this._provider = __bind(this._provider, this);
      this.initPaymentStore = __bind(this.initPaymentStore, this);
      this.getUrls = __bind(this.getUrls, this);
      this.getExpress = __bind(this.getExpress, this);
      var type, _err, _i, _len, _providers, _ref;
      config.init(options);
      Payments.__super__.constructor.call(this, options);
      this.ready = false;
      this.provider = this._waitUntil(this._provider);
      this.createPayment = this._waitUntil(this._createPayment);
      this.getStore = this._waitUntil(this._getStore);
      if ((options != null ? options.express : void 0) == null) {
        this.redir = new Redirects(this);
      } else {
        this.redir = new Redirects(this, options.express);
      }
      this.providers = {};
      _providers = config.get("providers");
      this.debug("list of standard providers", _providers);
      _ref = config.get("providers");
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        type = _ref[_i];
        try {
          this.addProvider(type, require("../providers/" + type + "/."));
        } catch (_error) {
          _err = _error;
          if ((_err != null ? _err.customError : void 0) != null) {
            throw _err;
            return;
          }
          this.error("init-provider", _err);
          this._handleError(null, "EREQUIREPROVIDER", {
            type: type
          });
          return;
        }
      }
      if ((options != null ? options.paymentStore : void 0) == null) {
        this.initPaymentStore(new MemoryStore());
      } else {
        this.initPaymentStore(options.paymentStore);
      }
      return;
    }

    Payments.prototype.getExpress = function() {
      return this.redir.server;
    };

    Payments.prototype.getUrls = function(pid, prefix) {
      var _baseroute;
      if (pid == null) {
        pid = ":pid";
      }
      if (prefix == null) {
        prefix = "";
      }
      _baseroute = config.get("baseroute");
      if (_.isFunction(_baseroute)) {
        return {
          success: _baseroute(this, "success", pid),
          cancel: _baseroute(this, "cancel", pid)
        };
      } else {
        return {
          success: "" + prefix + _baseroute + "success/" + pid,
          cancel: "" + prefix + _baseroute + "cancel/" + pid
        };
      }
    };

    Payments.prototype.initPaymentStore = function(store) {
      var _i, _len, _m, _ref,
        _this = this;
      _ref = ["connect", "get", "set", "destroy"];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        _m = _ref[_i];
        if (!(!((store[_m] != null) || _.isFunction(store[_m])))) {
          continue;
        }
        this._handleError(null, "ESTOREVALIDATION", {
          method: _m
        });
        return;
      }
      store.on("connect", function() {
        _this.debug("payment store connected");
        _this.ready = true;
        _this.emit("ready");
      });
      store.on("disconnect", function() {
        _this.warning("payment store disconnected");
        _this.ready = false;
      });
      this.pStore = store;
      store.connect();
      return store;
    };

    Payments.prototype._provider = function(type, cb) {
      if (this.providers[type] != null) {
        cb(null, this.providers[type]);
      } else {
        this._handleError(cb, "EUINVALIDPROVIDER", {
          type: type,
          types: Object.keys(this.providers)
        });
      }
    };

    Payments.prototype._createPayment = function() {
      var args, cb, data, type, _i,
        _this = this;
      args = 2 <= arguments.length ? __slice.call(arguments, 0, _i = arguments.length - 1) : (_i = 0, []), cb = arguments[_i++];
      type = args[0], data = args[1];
      this._provider(type, function(err, _prov) {
        if (err) {
          cb(err);
          return;
        }
        cb(null, _prov.create(data));
      });
    };

    Payments.prototype.addProvider = function(pname, Provider) {
      var _provider;
      _provider = new Provider(this);
      this.providers[pname] = _provider;
      this.debug("added provider `" + pname + "`");
      return _provider;
    };

    Payments.prototype._getStore = function(cb) {
      cb(null, this.pStore);
    };

    Payments.prototype.onSuccessReturn = function(id, token, payer_id, cb) {
      var _this = this;
      this.getPayment(id, function(err, payment) {
        if (err) {
          cb(err);
          return;
        }
        if (payer_id != null) {
          payment.payer_id = payer_id;
        }
        _this.debug("payment for execution", payment.valueOf());
        payment._executePayment(token, function(err) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, payment);
        });
      });
    };

    Payments.prototype.onCancelReturn = function(id, cb) {
      var _this = this;
      this.getPayment(id, function(err, payment) {
        if (err) {
          cb(err);
          return;
        }
        payment.cancel(cb);
      });
    };

    Payments.prototype.getPayment = function(id, cb) {
      var _this = this;
      this.getStore(function(err, store) {
        if (err) {
          cb(err);
          return;
        }
        store.get(id, function(err, data) {
          if (err) {
            cb(err);
            return;
          }
          if (data == null) {
            _this._handleError(cb, "EPAYMENTNOTFOUND", {
              id: id
            });
            return;
          }
          _this.debug("got data from store", data);
          _this.createPayment(data != null ? data.provider : void 0, data, function(err, payment) {
            if (err) {
              cb(err);
              return;
            }
            cb(null, payment);
          });
        });
      });
    };

    Payments.prototype.ERRORS = function() {
      return this.extend(Payments.__super__.ERRORS.apply(this, arguments), {
        "EPAYMENTNOTFOUND": "the Payment with id `<%= id %>` is not availible.",
        "EREQUIREPROVIDER": "The provider `<%= type %>` cannot be required.",
        "EUINVALIDPROVIDER": "The provider `<%= type %>` is not valid. Please use one of `<%= types %>`.",
        "ESTOREVALIDATION": "The user payment store misses a method called `.<%= method %>()`."
      });
    };

    return Payments;

  })(require("./basic"));

}).call(this);
