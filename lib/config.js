(function() {
  var Config, DEFAULT, extend,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEFAULT = {
    baseroute: "/payment/",
    redirprefix: null,
    productionmode: true,
    express: null,
    serverDefaultPort: 8888,
    serverDefaultHost: "localhost",
    serverSecure: false,
    providers: ["paypal", "paypalrest", "clickandbuy"],
    paypal: {
      endpoint: "https://api-3t.sandbox.paypal.com/nvp",
      userid: "REPLACE-THIS",
      password: "REPLACE-THIS",
      signature: "REPLACE-THIS",
      application_id: "APP-80W284485P519543T",
      receiver_email: "REPLACE-THIS",
      localcode: "DE",
      linkTemplate: "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>"
    },
    paypalrest: {
      endpoint: "api.sandbox.paypal.com",
      port: "",
      client_id: "REPLACE-THIS",
      client_secret: "REPLACE-THIS",
      ipnTarget: "https://www.sandbox.paypal.com/cgi-bin/webscr?"
    },
    clickandbuy: {
      endpoint: "https://api.clickandbuy.com/webservices/soap/pay_1_1_0/",
      merchantid: "REPLACE-THIS",
      projectid: "REPLACE-THIS",
      cryptokey: "REPLACE-THIS",
      localcode: "DE"
    },
    paypalipn: {
      receiverPath: "/ipntest/paypal",
      host: "www.paypal.com",
      port: 80,
      secure: true,
      ppReturnPath: "/cgi-bin/webscr",
      receiver_email: null,
      listenport: false
    },
    clickandbuymms: {
      receiverPath: "/cabtest/clickandbuy",
      cryptokey: "REPLACE-THIS"
    },
    defaultcurrency: "EUR",
    currencies: {
      "AUD": "float",
      "CAD": "float",
      "CZK": "float",
      "DKK": "float",
      "EUR": "float",
      "HKD": "float",
      "HUF": "float",
      "ILS": "float",
      "JPY": "int",
      "MXN": "float",
      "TWD": "int",
      "NZD": "float",
      "NOK": "float",
      "PHP": "float",
      "PLN": "float",
      "GBP": "float",
      "SGD": "float",
      "SEK": "float",
      "CHF": "float",
      "THB": "float",
      "USD": "float"
    }
  };

  extend = require("extend");

  Config = (function() {
    function Config(severity) {
      this.severity = severity != null ? severity : "warning";
      this.get = __bind(this.get, this);
      this.init = __bind(this.init, this);
      return;
    }

    Config.prototype.init = function(input) {
      this.config = extend(true, {}, DEFAULT, input);
    };

    Config.prototype.get = function(name, logging) {
      var _cnf, _ref;
      if (logging == null) {
        logging = false;
      }
      _cnf = ((_ref = this.config) != null ? _ref[name] : void 0) || null;
      if (logging) {
        logging = {
          logging: {
            severity: process.env["severity_" + name] || this.severity,
            severitys: "fatal,error,warning,info,debug".split(",")
          }
        };
        return extend(true, {}, logging, _cnf);
      } else {
        return _cnf;
      }
    };

    return Config;

  })();

  module.exports = new Config(process.env.severity);

}).call(this);
