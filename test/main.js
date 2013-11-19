(function() {
  var Payments, config, fs, openBrowser, path, paypalIPN, pymts, should, spawn, _configTest, _localtest;

  should = require("should");

  fs = require("fs");

  path = require("path");

  spawn = require('child_process').spawn;

  config = require("../lib/config");

  _configTest = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../config_test.json")));

  config.init(_configTest);

  Payments = require("../.");

  _localtest = config.get("paypalipn").listenport !== false;

  if (_localtest) {
    paypalIPN = require("./fakeendpoint");
    console.log("USE LOCAL IPN TEST");
  }

  openBrowser = function(url) {
    switch (process.platform) {
      case "darwin":
        spawn('open', [url]);
        break;
      case "linux":
        spawn('firefox', [url]);
        break;
      default:
        console.log("Open `" + url + "` in your Browser");
    }
  };

  pymts = null;

  describe("=== MAIN TESTS === ", function() {
    describe("- Init -", function() {
      var _this = this;
      pymts = new Payments(_configTest);
      pymts.on("approved", function(res, payment) {
        res.send("APPROVED:\n\n" + (payment.toString(true)));
      });
      pymts.on("cancel", function(res, payment) {
        res.send("CANCLED:\n\n" + (payment.toString(true)));
      });
    });
    describe("- Paypal -", function() {
      var _testPayment;
      _testPayment = null;
      it("create payment", function(done) {
        var _this = this;
        this.timeout(1000 * 60 * 5);
        pymts.provider("paypal", function(err, paypal) {
          var payment, _amount, _id;
          should.not.exist(err);
          _amount = 0.01;
          payment = paypal.create();
          payment.amount = _amount;
          payment.desc = "Imperial Star Destroyer";
          payment.set("my_user_id", 123);
          _id = payment.id;
          pymts.on("payment", function(type, _payment) {
            if (type === "approved") {
              _payment.amount.should.equal(_amount);
              _payment.get("my_user_id").should.equal(123);
            }
          });
          pymts.on("payment:" + _id, function(type, _payment) {
            switch (type) {
              case "approved":
                _testPayment = _payment;
                console.log("APPROVED STATE: ", _payment.state);
                done();
                return;
              case "cancel":
                _testPayment = _payment;
                done();
                return;
            }
          });
          payment.exec(function(err, link) {
            should.not.exist(err);
            openBrowser(link);
          });
        });
      });
      if (_localtest) {
        it("send ipn", function(done) {
          var _this = this;
          if (_testPayment != null) {
            paypalIPN.sendPaypalIPN(_testPayment);
            pymts.once("payment:" + _testPayment.id, function(type, _payment) {
              if (type === "verfied") {
                console.log("VERIFIED STATE: ", _payment.valueOf());
                _testPayment.id.should.equal(_payment.id);
                done();
              }
            });
          } else {
            console.log("PAYMENT CANCELD!");
            done();
          }
        });
      } else {
        it("wait for IPN message", function(done) {
          var _this = this;
          this.timeout(1000 * 60 * 5);
          if (_testPayment != null) {
            pymts.once("payment:" + _testPayment.id, function(type, _payment) {
              if (type === "verfied") {
                console.log("VERIFIED STATE: ", _payment.valueOf());
                _testPayment.id.should.equal(_payment.id);
                done();
              }
            });
          } else {
            console.log("PAYMENT CANCELD!");
            done();
          }
        });
      }
    });
  });

}).call(this);
