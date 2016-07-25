var express = require('express');
var moment = require('moment');
var memoryCache = require('memory-cache');

const MINUTES = 60000;
const CACHE_TIMEOUT = 15 * MINUTES;
const DEFAULT_TIMEZONE = 'America/Toronto';

var getCalendarEvents = require('./lib/get-calendar-events');
var adaptCalendarEvent = require('./lib/adapt-calendar-event');
var groupEventsByDate = require('./lib/group-events-by-date');

var app = express();

// Express app structure
// 1. Middleware
// 2. Route handlers
// 3. 404 handler
// 4. Error handler

// Middleware
var helmet = require('helmet');
app.use(helmet());

var cors = require('cors');
app.use(cors());

var logger = require('morgan');
app.use(logger('dev'));

app.use(express.static('public'));

// Route handlers
app.get('/api/events', function(req, res, next) {

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
  var format = (twentyfourHour&&twentyfourHour==='1'?'HH:mm':'h:mm a');
  options.timeFormat = format;

  // handle option of returning time in UTC
  var utc = req.query['utc'];
  var tz = (utc&&utc==='1'?'UTC':DEFAULT_TIMEZONE);
  options.timezone = tz;

  var calendarId = process.env.GOOGLE_CALENDAR_ID;
  var apiKey = process.env.GOOGLE_API_KEY;

  if (!calendarId || !apiKey) {
    throw new Error('Events API requires calendar config.');
  }

  getCalendarEvents(calendarId, apiKey).then(function(events) {
    var i;
    if ('1' !== req.query['private']) {
        var selectedEvents = [];

        for (i=0; i<events.length; i++) {
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
});

app.get('/api/time', function(req, res, next) {
  // handle option of returning time in 24 hours
  var twentyfourHour = req.query['24hour'];
  var format = (twentyfourHour&&twentyfourHour==='1'?'HH:mm':'h:mm a');
  // handle option of returning time in UTC
  var utc = req.query['utc'];
  var tz = (utc&&utc==='1'?'UTC':DEFAULT_TIMEZONE);
  var timeString = moment().tz(tz).format(format);
  res.json({time: timeString});
});

// Route 404 handler
app.use(function(req, res, next) {
  res.status(404).send('404');
});

// Error handler
app.use(require('errorhandler'));
app.use(require('body-parser'));

module.exports = app;
