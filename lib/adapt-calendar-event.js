var moment = require('moment-timezone');
var parseStringTags = require('./parse-string-tags');
var clockDurationBetween = require('./clock-duration-between');

module.exports = function adaptCalendarEvent(event, options) {

    var startTime = moment(event.start.dateTime).tz(options.timezone);
    var endTime = moment(event.end.dateTime).tz(options.timezone);

    var date = startTime.format('YYYY-MM-DD');

    var day = startTime.calendar(null, {
        sameDay: '[Today]',
        nextDay: '[Tomorrow]',
        nextWeek: 'dddd',
        sameElse: 'MMMM Do'
    });

    var title = parseStringTags(event.summary);
    var description;

    if (options.showDescription && event.description) {
        description = event.description;
    }
    var room;
    if (title.tags && title.tags.length > 0) {
        room = title.tags[0]
    }

    return {
        id: event.id,
        title: title.string,
        description: description,
        'public': title.publicEvent,
        date: date,
        tags: title.tags,
        duration: clockDurationBetween(startTime, endTime),
        today: moment().isSame(startTime, 'day'),
        day: day,
        start: startTime.format(options.timeFormat),
        end: endTime.format(options.timeFormat),
        description: event.description,
        room: room
    };
};