'use strict';

var nconf = require('nconf');
var child = require('child_process').exec;
var webremix = require('webremix');
var Publico = require('meatspace-publico');
var io = require('socket.io-client');

var gpg = require('./gpg');

nconf.argv().env().file({ file: 'local.json' });

var sockets = {};
var dual = {};
var alphaNumRegexp = /[^A-Za-z0-9]*$/;

var TTL = 1000 * 60 * 60; // 1 hour

var clean = function (string) {
  return string.replace(alphaNumRegexp, '');
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
  sockets[server] = io(server);
});

var me = nconf.get('me');
var users = [];

exports.whoAmI = function () {
  return nconf.get('me');
};

exports.recent = function (user, socket) {
  var keyName = [me, user].sort().join('-');
  var count = 0;

  setDatabase(keyName, function (err, k) {
    if (!err) {
      dual[keyName].getChats(false, false, function (err, c) {
        if (err) {
          console.log(err);
          return;
        }

        c.chats.forEach(function (chat) {
          socket.emit('local', chat.value.message);

          if (count === c.chats.length - 1) {
            socket.emit('latest-message-id', chat.value.message.created);
          }

          count ++;
        });
      });
    }
  });
};

exports.decrypt = function (data, localSocket) {
  var keyName = [data.sender, data.receiver].sort().join('-');

  if (data.text.trim().length === 0) {
    console.log('message cannot be empty');
    return;
  }

  gpg.decrypt(data, function (err, stdout) {
    if (err) {
      console.log(err);
      return;
    }

    webremix.generate(stdout, function (err, fmsg) {
      data.html = fmsg;

      dual[keyName].addChat(data, {
        ttl: TTL
      }, function (err) {
        if (!err) {
          localSocket.emit('local', data);
        }
      });
    });
  });
};

exports.addMessage = function (payload, localSocket) {
  payload = JSON.parse(payload);
  var message = payload.text;

  if (message.trim().length === 0) {
    console.log('message empty, ignore');
    return;
  }

  var sender = me;
  var receiver = payload.receiver;

  var saveMessage = function (messageObj, key, original) {
    var localObj = new Object(messageObj);

    webremix.generate(original || localObj.text, function (err, result) {
      if (!err) {
        if (messageObj.public) {
          messageObj.html = result;
        }

        for (var socket in sockets) {
          sockets[socket].emit('message', messageObj);
        }

        localObj.html = result;

        dual[key].addChat(localObj, {
          ttl: TTL
        }, function (err) {
          if (!err) {
            localSocket.emit('local', localObj);
          }
        });
      }
    });
  };

  var sendMessage = function (messageObj, original) {
    var keyName = [messageObj.sender, messageObj.receiver].sort().join('-');

    setDatabase(keyName, function (err, k) {
      if (err) {
        console.log('Invalid key name');
        return;
      }

      saveMessage(messageObj, keyName, original);
    });
  };

  var messageObj = {
    text: message,
    receiver: receiver,
    receiverAvatar: payload.receiverAvatar,
    sender: me,
    senderAvatar: payload.senderAvatar,
    public: payload.public,
    pubKey: clean(payload.pubKey),
    created: Math.floor(Date.now() / 1000),
    html: false
  };

  if (!messageObj.public) {
    gpg.encrypt(messageObj, message, function (err, msg) {
      if (err) {
        console.log(err);
        return;
      }

      sendMessage(msg, message);
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
