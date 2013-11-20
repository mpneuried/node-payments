(function() {
  exports.version = '0.0.4';

  exports.config = require('./lib/config');

  exports.Redirects = require('./lib/redirects');

  exports.MemoryStore = require('./lib/paymentstores/memorystore');

  exports.providers = {
    Base: require('./providers/_base/.'),
    Paypal: require('./providers/paypal/.')
  };

  module.exports = require('./lib/main');

}).call(this);
