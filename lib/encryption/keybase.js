var child_process = require('child_process');
var spawn = child_process.spawn;
var child = child_process.exec;

exports.encrypt = function (messageObj, message, next) {
    var proc = spawn('keybase', ['encrypt', messageObj.receiver, '-m', message]);
    var stdout = '';

    proc.stdout.on('data', function (data) {
      stdout += data;
    });

    proc.on('close', function (exitCode) {
      messageObj.text = stdout;
      if (exitCode === 0) {
        next(null, messageObj);
      }
    });
};


exports.decrypt = function (data, next) {
  child('keybase decrypt -m "' + data.text + '"', next);
};
