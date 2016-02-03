var express = require('express');
var moment = require('moment');
var memoryCache = require('memory-cache');

var MINUTES = 60000;
var CACHE_TIMEOUT = 15 * MINUTES;

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
  var cachedEvents = memoryCache.get('calendar-events');
  if (cachedEvents !== null) {
    res.json(cachedEvents);
    return;
  }

  var calendarId = process.env.GOOGLE_CALENDAR_ID;
  var apiKey = process.env.GOOGLE_API_KEY;

  if (!calendarId || !apiKey) throw new Error('Events API requires calendar config.');

  getCalendarEvents(calendarId, apiKey).then(function(events) {
    var adaptedEvents = events.map(adaptCalendarEvent).slice(0, 5);
    var groupedEvents = groupEventsByDate(adaptedEvents);
    res.json(groupedEvents);
    memoryCache.put('calendar-events', groupedEvents, CACHE_TIMEOUT);
  }).catch(next);
});

app.get('/api/time', function(req, res, next) {
  var timeString = moment().tz('America/Toronto').format('h:mm a');
  res.json({time: timeString});
});

// Route 404 handler
app.use(function(req, res, next) {
  res.status(404).send('404');
});

// Error handler
app.use(require('errorhandler'));

module.exports = app;
