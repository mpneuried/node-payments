(function() {
  var BaseProvider,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  module.exports = BaseProvider = (function(_super) {
    __extends(BaseProvider, _super);

    BaseProvider.prototype.payment = require("./payment");

    function BaseProvider(main, options) {
      this.main = main;
      this.onDispose = __bind(this.onDispose, this);
      this.onCancel = __bind(this.onCancel, this);
      this.onApproved = __bind(this.onApproved, this);
      this.onExec = __bind(this.onExec, this);
      this.create = __bind(this.create, this);
      BaseProvider.__super__.constructor.call(this, options);
      return;
    }

    BaseProvider.prototype.create = function(data) {
      var payment;
      payment = new this.payment(this, data);
      payment.on("exec", this.onExec);
      payment.on("approved", this.onApproved);
      payment.on("cancel", this.onCancel);
      payment.on("dispose", this.onDispose);
      return payment;
    };

    BaseProvider.prototype.onExec = function(payment) {
      var _this = this;
      this.main.getStore(function(err, store) {
        if (err) {
          _this.error("getstore", err);
          return;
        }
        store.set(payment, function(err) {
          if (err) {
            _this.error("payment save", err);
            return;
          }
          _this.main.emit("payment", "exec", payment);
          _this.main.emit("payment:" + payment.id, "exec", payment);
        });
      });
    };

    BaseProvider.prototype.onApproved = function(payment) {
      var _this = this;
      payment.removeAllListeners();
      this.main.getStore(function(err, store) {
        if (err) {
          _this.error("getstore", err);
          return;
        }
        store.set(payment, function(err) {
          if (err) {
            _this.error("payment saved", err);
            return;
          }
          _this.main.emit("payment", "approved", payment);
          _this.main.emit("payment:" + payment.id, "approved", payment);
        });
      });
    };

    BaseProvider.prototype.onCancel = function(payment) {
      payment.removeAllListeners();
      this.main.emit("payment", "cancel", payment);
      this.main.emit("payment:" + payment.id, "cancel", payment);
    };

    BaseProvider.prototype.onDispose = function(payment) {
      payment.removeAllListeners();
    };

    return BaseProvider;

  })(require("../../lib/basic"));

}).call(this);
