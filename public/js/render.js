var $ = require('jquery');
var moment = require('moment');

var body = $('body');
var me = body.data('me');
var feed = $('#feed');
var publicFeed = $('#public-feed');

var sortItems = function (a, b) {
  return ($(b).data('created')) > ($(a).data('created')) ? 1 : -1;
};

exports.render = function (data, publicOnly) {
  var isPublic = 'public';

  if (data.public.toString() === 'false') {
    isPublic = 'private';
  }

  var li = $('<li data-created="' + data.created + '" class="' + isPublic + '"><div class="avatars"></div></li>');
  var senderAvatar = $('<div><img src="' + data.senderAvatar + '"></img></div>');
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


  if (publicOnly) {
    if (publicFeed.find('li[data-created="' + data.created + '"]').length === 0) {
      publicFeed.prepend(li.clone());
    }
  }

  if (feed.find('li[data-created="' + data.created + '"]').length === 0) {
    feed.prepend(li);
  }
};
