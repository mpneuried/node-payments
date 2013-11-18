(function() {
  var RedirServer, config,
    __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    __hasProp = {}.hasOwnProperty,
    __extends = function(child, parent) { for (var key in parent) { if (__hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; };

  config = require("./config");

  module.exports = RedirServer = (function(_super) {
    __extends(RedirServer, _super);

    function RedirServer(main, express) {
      this.main = main;
      this.ERRORS = __bind(this.ERRORS, this);
      this.onCancel = __bind(this.onCancel, this);
      this.onSuccess = __bind(this.onSuccess, this);
      this.createRoutes = __bind(this.createRoutes, this);
      this.auth = __bind(this.auth, this);
      this.createExpress = __bind(this.createExpress, this);
      RedirServer.__super__.constructor.call(this);
      if ((express != null ? express.engines : void 0) != null) {
        this.server = express;
      } else {
        this.createExpress();
      }
      this.createRoutes();
      return;
    }

    RedirServer.prototype.createExpress = function() {
      var express, _econfig, _err;
      _econfig = config.get("serverConfig");
      try {
        express = require("express");
      } catch (_error) {
        _err = _error;
        if (_err.code === "MODULE_NOT_FOUND") {
          this._handleError(null, "EMISSINGEXPRESS");
        }
        return;
      }
      this.server = express();
      this.server.set("title", "node-payment");
      this.server.use(express.logger("dev"));
      this.server.use(express.bodyParser());
      this.server.listen(_econfig.port, _econfig.listenhost);
    };

    RedirServer.prototype.auth = function(req, res, next) {
      next();
    };

    RedirServer.prototype.createRoutes = function() {
      var _urls;
      _urls = this.main.getUrls();
      this.debug("redir-urls", _urls);
      this.server.get(_urls.success, this.auth, this.onSuccess);
      this.server.get(_urls.cancel, this.auth, this.onCancel);
    };

    RedirServer.prototype.onSuccess = function(req, res) {
      var _this = this;
      this.main.onSuccessReturn(req.params.pid, req.query.token, req.query.PayerID, function(err, payment) {
        if (err) {
          res.send(err, 500);
          return;
        }
        _this.main.emit("redirect:approved", res, payment);
      });
    };

    RedirServer.prototype.onCancel = function(req, res) {
      var _this = this;
      this.main.onCancelReturn(req.params.pid, function(err, payment) {
        if (err) {
          res.send(err, 500);
          return;
        }
        _this.main.emit("redirect:canceld", res, payment);
      });
    };

    RedirServer.prototype.ERRORS = function() {
      return this.extend(RedirServer.__super__.ERRORS.apply(this, arguments), {
        "EMISSINGEXPRESS": "To use a internal express you have to run `npm install express`. It's not a hard dependency to reduce node_module size for the usually used integrated version."
      });
    };

    return RedirServer;

  })(require("./basic"));

}).call(this);
