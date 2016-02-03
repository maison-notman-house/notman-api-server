var moment = require('moment-timezone');
var parseStringTags = require('./parse-string-tags');
var clockDurationBetween = require('./clock-duration-between');

var TIMEZONE = 'America/Toronto';

module.exports = function adaptCalendarEvent(event) {
  var startTime = moment(event.start.dateTime).tz(TIMEZONE);
  var endTime = moment(event.end.dateTime).tz(TIMEZONE);

  var date = startTime.format('YYYY-MM-DD');

  var day = startTime.calendar(null, {
    sameDay: '[Today]',
    nextDay: '[Tomorrow]',
    nextWeek: 'dddd',
    sameElse: 'MMMM Do'
  });

  var title = parseStringTags(event.summary);

  return {
    title: title.string,
    date: date,
    tags: title.tags,
    duration: clockDurationBetween(startTime, endTime),
    today: moment().isSame(startTime, 'day'),
    day: day,
    start: startTime.format('h:mm a'),
    end: endTime.format('h:mm a')
  };
};
