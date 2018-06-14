const memoryCache = require('memory-cache');

const getCalendarEvents = require('./get-calendar-events');
const adaptCalendarEvent = require('./adapt-calendar-event');
const groupEventsByDate = require('./group-events-by-date');

const MINUTES = 60000;
const CACHE_TIMEOUT = 15 * MINUTES;
const DEFAULT_TIMEZONE = 'America/Toronto';

module.exports.handleGetEvents = function(req, res, next) {

    // flush the cache if we get flushcache=1, added to allow for cases
    // where the calendar was updated and we want to see the results immediately

    if ('1' === req.query['flushcache']) {
        memoryCache.clear();
    }

    // we use url as key, in order to support request with varying parameters
    var cachedEvents = memoryCache.get(req.url);
    if (cachedEvents !== null) {
        res.json(cachedEvents);
        return;
    }

    var options = {};

    var twentyfourHour = req.query['24hour'];
    var showDesc = req.query['desc'];
    options.showDesc = (showDesc && showDesc === '1');
    var format = (twentyfourHour && twentyfourHour === '1' ? 'HH:mm' : 'h:mm a');
    options.timeFormat = format;

    // handle option of returning time in UTC
    var utc = req.query['utc'];
    var tz = (utc && utc === '1' ? 'UTC' : DEFAULT_TIMEZONE);
    options.timezone = tz;

    var calendarId = process.env.GOOGLE_CALENDAR_ID;
    var apiKey = process.env.CALENDAR_KEY;
    if (apiKey) {
        apiKey = JSON.parse(apiKey);
    }
    
    if (!calendarId || !apiKey) {
        throw new Error('Events API requires calendar config.');
    }

    getCalendarEvents(calendarId, apiKey).then(function(events) {
        var i;
        if ('1' !== req.query['private']) {
            var selectedEvents = [];

            for (i = 0; i < events.length; i++) {
                if (events[i].summary.endsWith('*')) {
                    selectedEvents.push(events[i]);
                }
            }
            events = selectedEvents;
        }

        var adaptedEvents = events.map(
            event => adaptCalendarEvent(event, options)
        ).slice(0, 5);

        var groupedEvents = groupEventsByDate(adaptedEvents);
        res.json(groupedEvents);
        memoryCache.put(req.url, groupedEvents, CACHE_TIMEOUT);
    }).catch(next);
};