'use strict';

var nconf = require('nconf');
var child = require('child_process').exec;
var webremix = require('webremix');
var Publico = require('meatspace-publico');

nconf.argv().env().file({ file: 'local.json' });

var sockets = {};
var dual = {};

var TTL = 1000 * 60 * 60; // 1 hour
var GPGMessageRegexp = /^-----BEGIN PGP MESSAGE-----Version: GnuPG v2[A-Za-z0-9\/\+=]*-----END PGP MESSAGE-----$/;
var newlineRegexp = /[\r\n]/g;

var isGPGMessage = function (message) {
  return message.replace(newlineRegexp, "").match(GPGMessageRegexp);
};

var setDatabase = function (keyName, next) {
  keyName = keyName.replace(/^w+/, '');

  if (keyName.length < 3) {
    next(new Error('invalid keyname, exiting'));
    return;
  }

  if (!dual[keyName]) {
    dual[keyName] = new Publico('none', {
      db: './db/db-' + keyName,
      limit: 25
    });
  }

  next(null, keyName);
};

nconf.get('outgoingServers').forEach(function (server) {
  sockets[server] = require('socket.io-client')(server);
});

var me = nconf.get('me');
var users = [];

exports.whoAmI = function () {
  return nconf.get('me');
};

exports.recent = function (user, socket) {
  var keyName = [me, user].sort().join('-');
  setDatabase(keyName, function (err, k) {
    if (!err) {
      dual[keyName].getChats(true, function (err, c) {
        if (err) {
          console.log(err);
          return;
        }

        c.chats.reverse();

        c.chats.forEach(function (chat) {
          socket.emit('local', chat.value.message);
        });
      });
    }
  });
};

exports.decrypt = function (request, reply) {
  var data = request.payload.data;

  if (data.text.trim().length === 0) {
    console.log('message empty, ignore');
    return;
  }

  if (data.sender !== me) {
    if (!isGPGMessage(data.text)) {
      reply({
          error: 'could not decrypt'
      }).code(400);
      return;
    }
    child('echo "' + data.text + '" | gpg --decrypt', function (err, stdout, stderr) {
      console.log(err, stderr)
      if (!err) {
        webremix.generate(stdout, function (err, fmsg) {
          data.html = fmsg;

          reply({
            data: data
          });
        });
      } else {
        reply({
          error: 'could not decrypt'
        }).code(400);
      }
    });
  }
};

exports.addMessage = function (payload, localSocket) {
  payload = JSON.parse(payload);
  var message = payload.message;

  if (message.trim().length === 0) {
    console.log('message empty, ignore');
    return;
  }

  var sender = me;
  var receiver = payload.receiver;

  var sendMessage = function (messageObj) {
    for (var socket in sockets) {
      sockets[socket].emit('message', messageObj);
    }
  };

  var messageObj = {
    text: message,
    receiver: receiver,
    receiverAvatar: payload.receiverAvatar,
    sender: me,
    senderAvatar: payload.senderAvatar,
    public: !!payload.public,
    created: Math.floor(Date.now() / 1000)
  };

  var saveMessage = function (mObj, key) {
    webremix.generate(message, function (err, result) {
      if (!err) {
        mObj.html = result;
        dual[key].addChat(mObj, {
          ttl: TTL
        }, function (err) {
          if (!err) {
            localSocket.emit('local', mObj);
          }
        });
      }
    });
  };

  if (!messageObj.public) {
    // Save a plain text version of this to the local db if the sender is encrypting for someone else.
    if (messageObj.sender === me) {
      var keyName = [me, messageObj.receiver].sort().join('-');

      setDatabase(keyName, function (err, k) {
        if (err) {
          reply({
            error: 'invalid key name'
          }).status(400);
          return;
        }

        saveMessage(messageObj, keyName);
      });
    }

    child('keybase encrypt ' + receiver + ' -m "' +
      message + '"', function (err, stdout, stderr) {
      messageObj.text = stdout;
      sendMessage(messageObj);
    });
  } else {
    sendMessage(messageObj);
  }
};

exports.getUsers = function (request, reply) {
  if (!users.length) {
    child('keybase list-tracking', function (err, stdout, stderr) {
      if (stdout) {
        users = stdout.toString().split('\n');

        for (var i = 0; i < users.length; i ++) {
          // get rid of empty ones from untracked accounts
          if (!users[i]) {
            users.splice(i, 1);
          }
        }
      }

      reply({
        users: users
      });
    });
  } else {
    reply({
      users: users
    });
  }
};
