(function() {
  var MemoryStore, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("lodash");

  module.exports = MemoryStore = (function(_super) {
    __extends(MemoryStore, _super);

    function MemoryStore() {
      this.clear = __bind(this.clear, this);
      this.destroy = __bind(this.destroy, this);
      this.set = __bind(this.set, this);
      this.get = __bind(this.get, this);
      this.connect = __bind(this.connect, this);
      MemoryStore.__super__.constructor.apply(this, arguments);
      this.warning("You are using the fallback in memory store!");
      this.store = {};
      this.connected = false;
      return;
    }

    MemoryStore.prototype.connect = function() {
      this.debug("connect");
      this.connected = true;
      this.emit("connect");
    };

    MemoryStore.prototype.get = function(id, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.debug("GET. current id list", id, Object.keys(_this.store));
        if (_this.store[id] != null) {
          cb(null, _this.store[id]);
          return;
        }
        cb(null);
      });
    };

    MemoryStore.prototype.set = function(payment, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.store[payment.id] = payment.valueOf();
        _this.debug("saved", payment.id, payment.toString());
        cb(null);
      });
    };

    MemoryStore.prototype.destroy = function(payment, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.debug("destroy", payment.id);
        _.omit(_this.store, [payment.id]);
        cb(null);
      });
    };

    MemoryStore.prototype.clear = function(cb) {
      this.debug("clear");
      this.store = {};
      cb();
    };

    return MemoryStore;

  })(require("../basic"));

}).call(this);
