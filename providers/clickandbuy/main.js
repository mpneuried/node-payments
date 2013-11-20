(function() {
  var CLickAndBuy, config, _, _ref,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("../../lib/config");

  _ = require("lodash");

  module.exports = CLickAndBuy = (function(_super) {
    __extends(CLickAndBuy, _super);

    function CLickAndBuy() {
      this.initMMS = __bind(this.initMMS, this);
      this.initialize = __bind(this.initialize, this);
      _ref = CLickAndBuy.__super__.constructor.apply(this, arguments);
      return _ref;
    }

    CLickAndBuy.prototype.payment = require("./payment");

    CLickAndBuy.prototype.initialize = function() {
      this.initMMS();
    };

    CLickAndBuy.prototype.initMMS = function() {
      require("./mms").init(this.main);
    };

    return CLickAndBuy;

  })(require("../_base/main"));

}).call(this);
