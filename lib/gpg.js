'use strict';

var spawn = require('child_process').spawn;

var GPGMessageRegexp = /^-----BEGIN PGP MESSAGE-----[A-Za-z0-9\/\+\.=\s\(\):\-]*-----END PGP MESSAGE-----$/;
var newlineRegexp = /[\r\n]/g;

var isGPGMessage = function (message) {
  return message.replace(newlineRegexp, '').match(GPGMessageRegexp);
};

exports.encrypt = function (messageObj, message, next) {
  var proc = spawn('gpg', ['--encrypt', '--armor', '--no-use-agent', '--no-version',
                           '--batch', '--recipient', messageObj.pubKey]);
  var stdout = '';
  var buffers = [];
  var buffLength = 0;
  var error = '';

  proc.stdin.end(messageObj.text);

  proc.stdout.on('data', function (data) {
    buffers.push(data);
    buffLength += data.length;
  });

  proc.stderr.on('data', function (data) {
    error += data.toString('utf8');
  });

  proc.on('close', function (exitCode) {
    if (exitCode !== 0) {
      next(new Error(error));
      return;
    }

    var buffer = new Buffer(buffLength);
    var start = 0;

    buffers.forEach(function (b) {
      b.copy(buffer, start);
      start += b.length;
    });

    messageObj.text = buffer.toString('utf8');
    next(null, messageObj);
  });
};

exports.decrypt = function (data, next) {
  if (!isGPGMessage(data.text)) {
    console.log('Invalid pgp block');
    next(new Error('Invalid pgp block'));
    return;
  }

  var proc = spawn('gpg', ['--use-agent', '--decrypt'], { stdin: 'pipe' });
  var stdout = '';
  var error = '';

  proc.stdout.on('data', function (data) {
    stdout += data;
  });

  proc.stderr.on('data', function (data) {
    error += data.toString('utf8');
  });

  proc.on('close', function (exitCode) {
    if (exitCode !== 0) {
      next(new Error(error));
      return;
    }

    next(null, stdout);
  });

  proc.stdin.write(data.text);
  proc.stdin.end();
};