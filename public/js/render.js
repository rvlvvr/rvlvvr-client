var MAX_LIMIT = 30;

var $ = require('jquery');
var moment = require('moment');

var body = $('body');
var me = body.data('me');
var feed = $('#feed');
var publicFeed = $('#public-feed');

var sortItems = function (a, b) {
  return ($(b).data('created')) > ($(a).data('created')) ? 1 : -1;
};

exports.render = function (data, publicOnly, currentReceiver) {
  var isPublic = 'public';

  if (data.public.toString() === 'false') {
    isPublic = 'private';
  }

  var li = $('<li data-created="' + data.created + '" class="' + isPublic + '"><div class="avatars"></div></li>');
  var senderAvatar = $('<div class="sender"><img src="' + data.senderAvatar + '"></img></div>');
  var div = $('<div class="para"></div>');
  var small;

  if (isPublic === 'private') {
    small = $('<img class="lock" src="/images/lock.svg">');
    senderAvatar.append(small);
  }

  div.html(data.html);

  li.find('.avatars').append(senderAvatar);

  var timeEl = $('<time></time>');
  timeEl.text(moment.unix(data.created).fromNow());
  li.append(timeEl);

  li.append(div);

  var truncateMessages = function(elements) {
    if (elements.length > MAX_LIMIT) {
      elements.slice(MAX_LIMIT, elements.length).remove();
    };
  }

  if (publicOnly) {
    if (publicFeed.find('li[data-created="' + data.created + '"]').length === 0) {
      var message = li.clone();
      var senderLabel = $('<span class="label">' + data.sender + '</span>');
      message.find('.sender').append(senderLabel);
      if (data.sender !== data.receiver) {
        var recipient = $('<div class="recipient"></div>');
        var receiverAvatar = $('<img src="' + data.receiverAvatar + '"></img>');
        var receiverLabel = $('<span class="label">' + data.receiver + '</span>');
        recipient.append(receiverAvatar).append(receiverLabel);
        message.find('.avatars').append(recipient);
      }
      publicFeed.prepend(message);
      truncateMessages(publicFeed.find('li'));
    }
  } else if (currentReceiver && feed.find('li[data-created="' + data.created + '"]').length === 0) {
    feed.prepend(li);
    truncateMessages(feed.find('li'));
  }
};
