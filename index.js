(function() {
  module.exports = require('./lib/main');

  module.exports.version = '0.1.7';

  module.exports.config = require('./lib/config');

  module.exports.Redirects = require('./lib/redirects');

  module.exports.MemoryStore = require('./lib/paymentstores/memorystore');

  module.exports.RedisHashStore = require('./lib/paymentstores/redishashstore');

  module.exports.providers = {
    Base: require('./providers/_base/.'),
    Paypal: require('./providers/paypal/.')
  };

}).call(this);
