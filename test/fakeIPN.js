(function() {
  var FakeEndpoint, request, _configTest,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  request = require("request");

  _configTest = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../config_test.json")));

  FakeEndpoint = (function(_super) {
    __extends(FakeEndpoint, _super);

    function FakeEndpoint() {
      this.ppIpnReturn = __bind(this.ppIpnReturn, this);
      this.send = __bind(this.send, this);
      this.routes = __bind(this.routes, this);
      this.start = __bind(this.start, this);
      this.config = __bind(this.config, this);
      var express;
      express = require("express");
      this.server = express();
      this.config().routes().start();
      return;
    }

    FakeEndpoint.prototype.config = function() {
      fakeIPN.set("title", "fake-IPN for node-payment");
      fakeIPN.use(express.logger("dev"));
      return this;
    };

    FakeEndpoint.prototype.start = function() {
      this.server.listen(_configTest.test.fakeEndpointPort);
      return this;
    };

    FakeEndpoint.prototype.routes = function() {
      this.server.get("/paypal/ipn", this.ppIpnReturn);
      return this;
    };

    FakeEndpoint.prototype.send = function() {};

    FakeEndpoint.prototype.ppIpnReturn = function(req, res) {
      res.send("VERIFIED");
    };

    return FakeEndpoint;

  })(require("../lib/basic"));

  module.exports = new FakeIPN();

}).call(this);
