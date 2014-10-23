var $ = require('jquery');
var moment = require('moment');

var body = $('body');
var me = body.data('me');
var feed = $('#feed');

var sortItems = function (a, b) {
  return ($(b).data('created')) > ($(a).data('created')) ? 1 : -1;
};

exports.render = function (data) {
  console.log(data)
  if (feed.find('li[data-created="' + data.created + '"]').length === 0) {
    var isPublic = 'public';

    if (data.public.toString() === 'false') {
      isPublic = 'private';
    }

    var li = $('<li data-created="' + data.created + '" class="' + isPublic + '"><div class="avatars"></div></li>');
    var senderAvatar = $('<div><img src="' + data.senderAvatar + '"></img></div>');
    var div = $('<div class="para"></div>');
    var small;

    if (isPublic === 'private') {
      small = $('<small>P</small>');
      senderAvatar.append(small);
    }

    div.append(data.html);

    li.find('.avatars').append(senderAvatar);

    var timeEl = $('<time></time>');
    timeEl.text(moment.unix(data.created).fromNow());
    li.append(timeEl);

    li.append(div);
    feed.prepend(li);
    feed.find('li').sort(sortItems).appendTo(feed);
  }
};
