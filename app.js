const express = require('express');
const bodyParser = require('body-parser');

const fs = require('fs');
const events = require('./lib/services/events');
const occupantsDirectory = require('./lib/services/occupants-directory');
const netatmo = require('./lib/services/netatmo');
const mySeat = require('./lib/services/myseat');
const vendor = require('./lib/services/vendor');
const reelyactive = require('./lib/services/reelyactive');
const devices = require('./lib/services/devices');

const gDriveSync = require('sync-gdrive');

const config = require('./lib/config');
const time = require('./lib/services/time');


function logRequest(req, res, next) {
    // ensure that the header x-forwarded-for, is from a trusted proxy
    var remoteAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    console.log('request', req.method, req.originalUrl, remoteAddress);
    next();
}

var driveCache = 'gdrive-cache';

try {
    console.log('createing: ', config.cacheDir);
    fs.mkdirSync(config.cacheDir);
} catch (err) {
    // ignore
}

// Init the occupants directory, which gets its data from Google
occupantsDirectory.init();


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

app.use(bodyParser.json());

// Route handlers

app.get('/', function(req, res, next) {
    res.json({
        name: 'Notman API Server',
        version: '1.0.1'
    })
});

// TODO have the version actually be the GIT hash
app.get('/api/', function(req, res, next) {
    res.json({
        name: 'Notman API',
        version: '1'
    })
});

// API version is likely to start at '1' for a while
// We will focus on backwards compatibiltiy for now
app.get('/api/', function(req, res, next) {
    res.json({
        apiVersion: 1
    })
});


const router = express.Router();
app.use('/api/', router);

router.all(/.*/, logRequest);

router.get(/^\/vendor\/([^/]+)\/(.*)/, vendor.handleGets);
router.get('/events', events.handleGetEvents);
router.get('/netatmo/environment', netatmo.handleGetStationData);

router.get('/time', time.handleGetTime);
router.get(/directory\/([^/]+)\/logo/, occupantsDirectory.handleGetOccupantLogo);
router.get(/directory\/([^/]+)\/avatar/, occupantsDirectory.handleGetOccupantAvatar);
router.get('/directory', occupantsDirectory.handleGetDirectory);
router.get('/myseat/chairs', mySeat.handleGetChairs);
router.get('/reelyactive/devices', reelyactive.handleGetDeviceDirectory);

router.post('/devices/:devicename', devices.handleRegisterDevice);
router.get('/devices/:devicename', devices.handleGetDevice);
router.get('/devices', devices.handleGetDeviceDirectory);

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


module.exports = app;