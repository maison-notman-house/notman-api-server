const fs = require('fs');
const Promise = require('bluebird');
const fastcsv = require('fast-csv');
const CronJob = require('cron').CronJob;

const gDriveSync = require('./../gdrive-sync');
const config = require('../../config/');

const roomsDirectory = require('../../config/rooms');

var occupantsPath = config.cacheDir + '/occupants.csv';
var occupants = [];

function loadOccupants(occupantsCsv) {
    return new Promise(function(resolve, reject) {
        var stream = fs.createReadStream(occupantsCsv);

        occupants = [];

        var csvStream = fastcsv
            .fromStream(stream, { delimiter: ',', headers: ['room', 'occupant'] })
            .on("data", function(data) {
                occupants.push(data);
            })
            .on("end", function() {
                resolve(occupants);
            })
            .on("error", function(error) {
                reject(error);
            });
    });
}

function occupantForRoom(room) {
    var i;
    for (i = 0; i < occupants.length; i++) {
        if (occupants[i].room === room + '') {
            return occupants[i].occupant;
        }
    }
    return undefined;
}

function toCSV(occupants, delimiter, quoteColumns, callback) {
    var fields = ['room', 'floor', 'building', 'occupant'];
    fastcsv.writeToString(occupants, { headers: true, delimiter: delimiter, quoteColumns: quoteColumns }, callback);
}

function getOccupants(floor, building) {

    var filteredOccupants = roomsDirectory.filter(function(entry) {
        var include = true;
        if (floor !== undefined) {
            if (entry.floor !== parseInt(floor)) {
                include = false;
            }
        }

        if (building !== undefined && entry.building !== building) {
            include = false;
        }

        entry.occupant = occupantForRoom(entry.room);

        return include;
    });

    return filteredOccupants;
};

function sync() {
    // TODO attempt to load file from default path, in case
    //      there was a sync failure
    gDriveSync.sync(
            config.occupants.driveFileId,
            config.cacheDir,
            config.googleDrive.key)
        .then(function(files) {
            console.log('debug', 'fetched from Google Drive: ', files);
            occupantsPath = files[0].file;
            return loadOccupants(files[0].file);
        }).then(function(occupants) {
            //console.log('debug', occupants);
        }).catch(function(error) {
            console.log('error', error);
        })
}

function init() {
    new CronJob({
        cronTime: '* 0 * * * *',
        onTick: function() {
            sync();
        },
        start: true,
        timeZone: 'UTC'
    });

    sync();
}

/**
 * Returns the occupant directory of Notman House. Currently
 * only deals with businesses names and Notman management staff.
 *
 * Currently accepted query parameters:
 *   - floor
 *   - building
 */
function handleGetOccupants(req, res, next) {
    var quoteColumns = true;
    var floor = req.query.floor;
    var building = req.query.building;
    var format = req.query.format;
    var delimeter = req.query.del;
    var forceSync = req.query.sync === '1' || req.query.sync === 1;

    if (forceSync) {
        sync();
    }

    if (!format || format === 'json') {
        res.json(getOccupants(floor, building, format));
    } else {
        if (!delimeter) {
            delimeter = '\t';
            quoteColumns = false;
        }
        res.type('text/plain');
        toCSV(getOccupants(floor, building, format), delimeter, quoteColumns, function(err, data) {
            res.send(data);
        });
    }
};


module.exports.init = init;
module.exports.handleGetOccupants = handleGetOccupants;