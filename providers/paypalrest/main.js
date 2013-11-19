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
      this.initIPN = __bind(this.initIPN, this);
      this.initialize = __bind(this.initialize, this);
      _ref = PayPalRest.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    PayPalRest.prototype.payment = require("./payment");

    PayPalRest.prototype.initialize = function() {
      this.initIPN();
    };

    PayPalRest.prototype.initIPN = function() {
      require("../paypal/ipn").init(this.main);
    };

    return PayPalRest;

  })(require("../_base/main"));

}).call(this);
