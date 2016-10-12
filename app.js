var express = require('express');
var moment = require('moment');
var memoryCache = require('memory-cache');
var request = require('request');
var http = require("http");
var url = require("url");

const MINUTES = 60000;
const CACHE_TIMEOUT = 15 * MINUTES;
const DEFAULT_TIMEZONE = 'America/Toronto';
const DEFAULT_DAYS = 7;
const DEFAULT_MAX_EVENTS = 5;

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

/**
 * Return events in the Public Notman House Calendar
 *
 * Query Params:
 *   - 24hour=1 .... shows times in 24 hour format
 *   - utc=1 ....... displays times in UTC timezone
 *   - desc=1 ...... include descriptions in results
 */
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

  // whether to show times in 24 hour format, defaults to 12 hour
  var twentyfourHour = req.query['24hour'];
  var format = (twentyfourHour&&twentyfourHour==='1'?'HH:mm':'h:mm a');
  options.timeFormat = format;

  // handle option of returning time in UTC
  options.timezone = (req.query['utc']==='1'?'UTC':DEFAULT_TIMEZONE);
  // whether to show the description, defaults to false
  options.showDescription = req.query['desc'] === 1;
  // how many days of events to show, defaults to 7
  var days = req.query['days'];
  if (!days || days.trim().length == 0) {
    days = DEFAULT_DAYS
  }
  // how many events to show of returned entries (-1 means don't limit), default to 5
  var maxEvents = req.query['max'];
  if (!maxEvents) {
    maxEvents = DEFAULT_MAX_EVENTS;
  } else {
    maxEvents = parseInt(maxEvents);
    if (isNaN(maxEvents)) {
       maxEvents = DEFAULT_MAX_EVENTS;
       throw new Error('\'max\' is invalid, it should be -1 or a valid integer');
    }
  }

  var calendarId = process.env.GOOGLE_CALENDAR_ID;
  var apiKey = process.env.GOOGLE_API_KEY;

  if (!calendarId || !apiKey) {
    throw new Error('Events API requires calendar config.');
  }

  getCalendarEvents(calendarId, apiKey, days).then(function(events) {
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
        );
    // By default we limit the number of the returned events, though now customisable
    if (maxEvents !== -1) {
        adaptedEvents = adaptedEvents.slice(0, maxEvents);
    }

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


// See http://www.myseat.ca/api/ for API documentation
// @deprecated will remove once front-end has been updated
app.get('/api/myseat/chairs', function(req, res, next) {
  var urlStr = `https://apiv3.myseat.fr/Request/GetChairs/key/${process.env.MYSEAT_API_KEY}`;

  request(urlStr, function(err, result) {
    if (err) {
      res.status(500).send();
      console.error(err);
      return;
    }

    res.status(result.statusCode).type(result.headers['content-type']).send(result.body);
  });
});

// New mySeat getter to allow other paths, supported by the mySeat API
// mySeat API: http://www.myseat.ca/api/
app.get(/^\/api\/myseat\/(.+)/, function(req, res, next) {
  var urlObj = url.parse(req.url);
  var query = urlObj.query
  var pathname = urlObj.pathname
  urlObj.protocol = 'https';
  urlObj.hostname = 'apiv3.myseat.fr';
  urlObj.pathname = `/Request/${req.params[0]}/key/${process.env.MYSEAT_API_KEY}`;

  var urlStr = url.format(urlObj);

  request(urlStr, function(err, result) {
    if (err) {
      res.status(500).send();
      console.error(err);
      return;
    }

    res.status(result.statusCode).type(result.headers['content-type']).send(result.body);
  });
});

app.post('/refresh', function(req, res, next) {
  app.wss.clients.forEach(ws => {
    ws.send(JSON.stringify({message: 'refresh'}));
  });
  res.send();
});

// Route 404 handler
app.use(function(req, res, next) {
  res.status(404).send('404');
});

app.use(require('body-parser'));

// Error handler
app.use(function(err, req, res, next) {
   res.status(500).json({
      status: 500,
      message:  err.message
   });
});


module.exports = app;
