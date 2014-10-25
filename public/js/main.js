var $ = require('jquery');
var moment = require('moment');
var r = require('./render');
var body = $('body');
var me = body.data('me');
var usersEl = $('#users');
var messagesEl = $('#messages');
var receiver = $('#receiver');
var search = $('#search');
var loading = $('.loading');
var info = $('.info');
var newMsg = $('#new');
var feed = $('#feed');
var subheader = $('.subheader');
var users = [];
var avatars = {};
var publicKeys = {};
var currentReceiver = '';
var blocker = $('.blocker');
var keyName;

var socket = io(body.data('server'));
var localSocket = io();

socket.emit('notifications', me);

var addUser = function (user, p) {
  $.getJSON('https://keybase.io/_/api/1.0/user/lookup.json?usernames=' +
    user + '&fields=pictures,public_keys', function (data) {
    var avatar = '/images/avatar.jpg';

    if (data.them[0].pictures) {
      avatar = data.them[0].pictures.primary.url;
    }

    publicKeys[user] = data.them[0].public_keys.primary.key_fingerprint;
    p.attr('data-pubkey', publicKeys[user]);
    avatars[user] = avatar;
  });
};

$.getJSON('/users', function (data) {
  data.users.sort();
  loading.remove();
  users = data.users;
  users.unshift(me);
  users.forEach(function (user) {
    var p = $('<p><span class="notification"></span></p>');
    var span = $('<span></span>');
    p.attr('data-user', user);
    span.text(user);
    addUser(user, p);
    p.append(span);
    usersEl.append(p);
  });
});

usersEl.on('click', 'p', function (ev) {
  feed.empty();
  var self = $(this);
  var user = $(this).data('user');
  keyName = [me, user].sort().join('-');

  receiver.val(user);
  currentReceiver = user;
  socket.emit('join', keyName);
  localSocket.emit('recent', user);
  localSocket.emit('latest-message-id', user);
  info.fadeOut(function () {
    usersEl.find('p[data-user="' + user + '"] .notification').fadeOut();
    $('#receiver-avatar').val(avatars[user]);
    $('#receiver-pubkey').val(publicKeys[user]);
    self.siblings().removeClass('selected');
    self.addClass('selected');
    messagesEl.find('h1').text(user);
    newMsg.show();
    subheader.show();
  });
});

search.on('keyup', function (ev) {
  ev.preventDefault();
  var currKeys = $(this).val().toLowerCase();

  users.forEach(function (user) {
    if (user.indexOf(currKeys) === -1) {
      usersEl.find('p[data-user="' + user + '"]').hide();
    } else {
      usersEl.find('p[data-user="' + user + '"]').show();
    }
  });
});

newMsg.on('submit', function (ev) {
  ev.preventDefault();

  var isPublic = false;
  if ($('input[name="public"]').is(':checked')) {
    isPublic = true;
  }

  if (!isPublic) {
    blocker.fadeIn();
  }

  $('.empty').remove();
  $('#sender-avatar').val(avatars[me]);
  console.log('posting message');
  setTimeout(function () {
    blocker.fadeOut();
    localSocket.emit('local', JSON.stringify({
      text: $('textarea[name="message"]').val(),
      receiver: $('#receiver').val(),
      senderAvatar: $('#sender-avatar').val(),
      receiverAvatar: $('#receiver-avatar').val(),
      pubKey: $('#receiver-pubkey').val(),
      public: isPublic
    }));

    newMsg.find('textarea').val('');
  }, 1000);
});

localSocket.on('local', function (data) {
  if (feed.find('li[data-created="' + data.created + '"]').length === 0) {
    console.log('listening to incoming local data ', data)
    r.render(data);
  }
});

socket.on('notifications', function (data) {
  if (data && currentReceiver !== data) {
    usersEl.find('p[data-user="' + data + '"] .notification').fadeIn();
  }
});

localSocket.on('latest-message-id', function (data) {
  console.log('emitting ', keyName, data)
  socket.emit('dual', {
    key: keyName,
    start: data
  });
});

socket.on('message', function (data) {
  blocker.fadeOut();
  if (feed.find('li[data-created="' + data.created + '"]').length === 0) {
    console.log('listening to incoming data ', data)
    if (data.public) {
      r.render(data);
    } else {
      localSocket.emit('decrypt', data);
    }
  }
});
