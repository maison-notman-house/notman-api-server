const express = require('express');

const events = require('./lib/services/events');
const occupantsDirectory = require('./lib/services/occupants-directory');
const netatmo = require('./lib/services/netatmo');
const mySeat = require('./lib/services/myseat');
const vendor = require('./lib/services/vendor');
const reelyactive = require('./lib/services/reelyactive');

const time = require('./lib/services/time');

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


// TODO have the version actually be the GIT hash
app.get('/api/', function(req, res, next) {
    res.json({
        name: 'Notman API Server',
        version: '1.0.1'
    })
});

// API version is likely to start at '1' for a while
// We will focus on backwards compatibiltiy for now
app.get('/api/', function(req, res, next) {
    res.json({
        apiVersion: 1
    })
});


app.get(/^\/api\/vendor\/([^/]+)\/(.*)/, vendor.handleGets);
app.get('/api/events', events.handleGetEvents);
app.get('/api/netatmo/environment', netatmo.handleGetStationData);

app.get('/api/time', time.handleGetTime);
app.get('/api/directory', occupantsDirectory.handleGetOccupants);
app.get('/api/myseat/chairs', mySeat.handleGetChairs);
app.get('/api/reelyactive/devices', reelyactive.handleGetDeviceDirectory);

app.post('/refresh', function(req, res, next) {
    app.wss.clients.forEach(ws => {
        ws.send(JSON.stringify({ message: 'refresh' }));
    });
    res.send();
});

// Route 404 handler
app.use(function(req, res, next) {
    res.status(404).send('404');
});

// Error handler
app.use(require('errorhandler'));
app.use(require('body-parser'));

module.exports = app;