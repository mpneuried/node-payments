(function() {
  var Config, DEFAULT, extend,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };

  DEFAULT = {
    providers: ["paypalrest", "paypalclassic"],
    defaultcurrency: "EUR",
    paypalrest: {
      endpoint: "api.sandbox.paypal.com",
      port: "",
      client_id: "REPLACE-THIS",
      client_secret: "REPLACE-THIS",
      ipnTarget: "https://www.sandbox.paypal.com/cgi-bin/webscr?"
    },
    paypalclassic: {
      endpoint: "https://api-3t.sandbox.paypal.com/nvp",
      userid: "REPLACE-THIS",
      password: "REPLACE-THIS",
      signature: "REPLACE-THIS",
      application_id: "APP-80W284485P519543T",
      receiver_email: "REPLACE-THIS",
      linkTemplate: "https://www.sandbox.paypal.com/cgi-bin/webscr?cmd=_express-checkout&token=<%= token %>"
    },
    baseroute: "/payment/",
    serverConfig: {
      port: 8888,
      listenhost: null,
      host: "localhost",
      secure: false
    },
    express: null,
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
      var _cnf;
      if (logging == null) {
        logging = false;
      }
      _cnf = this.config[name] || null;
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
