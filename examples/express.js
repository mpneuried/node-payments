/*

To test this example run `node examples/express.js` and then call
http://localhost:8888/pay/paypal?amount=0.01&desc=Cup%20of%20coffee&userid=123
*/


(function() {
  var Payments, app, express, fs, path, pymts, redisPaymentStore, _configTest, _port;

  fs = require("fs");

  path = require("path");

  express = require("express");

  app = express();

  app.use(express.urlencoded());

  app.use(express.json());

  app.use(express.logger("dev"));

  redisPaymentStore = new (require("./redisstore"));

  _configTest = JSON.parse(fs.readFileSync(path.resolve(__dirname + "/../config_test.json")));

  _configTest.express = app;

  _configTest.paymentStore = redisPaymentStore;

  Payments = require("../.");

  pymts = new Payments(_configTest);

  pymts.on("approved", function(res, payment) {
    res.send("Thank you!");
  });

  pymts.on("cancel", function(res, payment) {
    res.send("What a pity!");
  });

  pymts.on("verfied", function(payment) {
    console.log("PAYMENT VERIFIED\n", payment.valueOf());
  });

  pymts.on("payment", function(type, payment) {
    console.log("PAYMENT ACTION: " + type + "\n", payment.valueOf());
  });

  app.get("/pay/:provider", function(req, res) {
    var _amount, _desc, _provider, _uid;
    _provider = req.params.provider;
    _amount = req.query.amount;
    _desc = req.query.desc;
    _uid = req.query.userid;
    pymts.provider(_provider, function(err, provider) {
      var payment;
      if (err) {
        res.send("Unkown provider", 500);
        return;
      }
      payment = provider.create();
      payment.set({
        amount: _amount,
        desc: _desc,
        user_id: _uid
      });
      payment.exec(function(err, link) {
        if (err) {
          res.send("Cannot send payment: " + (JSON.stringify(err)), 500);
          return;
        }
        res.redirect(link);
      });
    });
  });

  _port = 8888;

  console.log("listen to " + _port);

  app.listen(_port);

}).call(this);
