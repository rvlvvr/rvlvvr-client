var nconf = require('nconf');
var gpg = require('./gpg');
var keybase = require('./keybase');

nconf.argv().env().file({ file: 'local.json' });

var dispatch = function (fn) {
  return function () {
    if ((nconf.get('encryptionBackend') || 'gpg').toLowerCase() == 'gpg') {
      return gpg[fn].apply(this, arguments);
    }
    return keybase[fn].apply(this, arguments);
  };
};

exports.encrypt = dispatch('encrypt');
exports.decrypt = dispatch('decrypt');

