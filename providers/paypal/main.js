(function() {
  var PayPal, config, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  _ = require("lodash");

  module.exports = PayPal = (function(_super) {
    __extends(PayPal, _super);

    function PayPal() {
      this.initIPN = __bind(this.initIPN, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PayPal.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PayPal.prototype.payment = require("./payment");

    PayPal.prototype.initialize = function() {
      this.initIPN();
    };

    PayPal.prototype.initIPN = function() {
      require("./ipn").init(this.main);
    };

    return PayPal;

  })(require("../_base/main"));

}).call(this);
