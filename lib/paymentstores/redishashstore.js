(function() {
  var RedisHashStore, _,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  _ = require("lodash");

  module.exports = RedisHashStore = (function(_super) {
    __extends(RedisHashStore, _super);

    RedisHashStore.prototype.defaults = function() {
      return this.extend(RedisHashStore.__super__.defaults.apply(this, arguments), {
        hkey: "nodepaymentexample",
        host: "localhost",
        port: 6379,
        options: {},
        redis: null
      });
    };

    function RedisHashStore() {
      this.clear = __bind(this.clear, this);
      this.destroy = __bind(this.destroy, this);
      this.set = __bind(this.set, this);
      this.get = __bind(this.get, this);
      this.connect = __bind(this.connect, this);
      this.defaults = __bind(this.defaults, this);
      RedisHashStore.__super__.constructor.apply(this, arguments);
      this.connected = false;
      return;
    }

    RedisHashStore.prototype.connect = function() {
      var redis, _err, _ref, _ref1,
        _this = this;
      if (((_ref = this.config.redis) != null ? (_ref1 = _ref.constructor) != null ? _ref1.name : void 0 : void 0) === "RedisClient") {
        this.redis = this.config.redis;
      } else {
        try {
          redis = require("redis");
        } catch (_error) {
          _err = _error;
          this.error("you have to load redis via `npm install redis hiredis`");
          return;
        }
        this.redis = redis.createClient(this.config.port || 6379, this.config.host || "127.0.0.1", this.config.options || {});
      }
      this.connected = this.redis.connected || false;
      this.redis.on("connect", function() {
        _this.connected = true;
        _this.emit("connect");
      });
      this.redis.on("error", function(err) {
        if (err.message.indexOf("ECONNREFUSED")) {
          _this.connected = false;
          _this.emit("disconnect");
        } else {
          _this.error("Redis ERROR", err);
          _this.emit("error");
        }
      });
    };

    RedisHashStore.prototype.get = function(id, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.redis.hget(_this.config.hkey, id, function(err, data) {
          if (err) {
            cb(err);
            return;
          }
          cb(null, JSON.parse(data));
        });
      });
    };

    RedisHashStore.prototype.set = function(payment, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.redis.hset(_this.config.hkey, payment.id, payment.toString(), function(err, done) {
          if (err) {
            cb(err);
            return;
          }
          _this.debug("saved", payment.id, payment.toString());
          cb(null);
        });
      });
    };

    RedisHashStore.prototype.destroy = function(payment, cb) {
      var _this = this;
      process.nextTick(function() {
        _this.debug("destroy", payment.id);
        _this.redis.hdel(_this.config.hkey, payment.id, function(err, done) {
          cb(err);
        });
      });
    };

    RedisHashStore.prototype.clear = function(cb) {
      var _this = this;
      this.debug("clear");
      this.redis.del(this.config.hkey, function(err, done) {
        cb(err);
      });
    };

    return RedisHashStore;

  })(require("../basic"));

}).call(this);
