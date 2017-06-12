const fs = require('fs');
const Promise = require('bluebird');
const fastcsv = require('fast-csv');
const CronJob = require('cron').CronJob;
const resolve = require('path').resolve;
const latinize = require('latinize');

const gDriveSync = require('./../gdrive-sync');
const config = require('../../config/');
const imageSuffixes = ['png','jpg','jpeg','svg'];

const roomsDirectory = require('../../config/rooms');

var occupantsPath = config.cacheDir + '/occupants.csv';
var occupants = [];

function loadOccupants(occupantsCsv) {
    return new Promise(function(resolve, reject) {
        var stream = fs.createReadStream(occupantsCsv);

        occupants = [];

        var csvStream = fastcsv
            .fromStream(stream, { delimiter: ',', headers: ['room', 'occupant'], strictColumnHandling: false })
            .on("data", function(data) {
                occupants.push(data);
            })
            .on("end", function() {
                occupants = populatLogoPaths(occupants);
                resolve(occupants);
            })
            .on("error", function(error,data) {
                reject(error);
            });

    });
}

function occupantForRoom(room) {
    var i;
    for (i = 0; i < occupants.length; i++) {
        if (occupants[i].room === room + '') {
            return occupants[i];
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

        var occupant = occupantForRoom(entry.room);
        if (occupant) {
            entry.occupant = occupant.occupant;
            if (occupant.logo) {
                entry.logo = escape(occupant.logo);
            }
            if (occupant.avatar) {
                entry.avatar = escape(occupant.avatar);
            }
        }

        return include;
    });

    return filteredOccupants;
};

function populatLogoPaths(occupants) {
    for (var i=0; i<occupants.length; i++) {
        var occupantName = occupants[i].occupant;
        var logoPath = getLogoPath(occupantName);
        if (logoPath) {
            occupants[i].logo = logoPath;
        }
        var avatarPath = getAvatarPath(occupantName);
        if (avatarPath) {
            occupants[i].avatar = avatarPath;
        }
    }
    return occupants;
}

function getLogoPath(occupantName) {
    if (occupantName && occupantName.trim().length > 0) {
        var basePath = config.cacheDir + '/assets/organizations/' + latinize(occupantName) + '/logo.';
        for (var i=0; i<imageSuffixes.length;i++) {
            var occupantImagePath = basePath + imageSuffixes[i];

            if (fs.existsSync(occupantImagePath)) {
                return '/api/directory/' + latinize(occupantName) + '/logo';
            }
        }
    }
}

function getAvatarPath(occupantName) {
    if (occupantName && occupantName.trim().length > 0) {
        var basePath = config.cacheDir + '/assets/organizations/' + latinize(occupantName) + '/avatar.';
        for (var i=0; i<imageSuffixes.length;i++) {
            var occupantImagePath = basePath + imageSuffixes[i];

            if (fs.existsSync(occupantImagePath)) {
                return '/api/directory/' + latinize(occupantName) + '/avatar';
            }
        }
    }
}

function sync() {
    // TODO attempt to load file from default path, in case
    //      there was a sync failure
    gDriveSync.sync(
            config.occupants.driveFileId,
            config.cacheDir,
            config.googleDrive.key)
        .then(function(files) {
            console.log('debug', 'fetched from Google Drive: ', files);
            return loadOccupants(occupantsPath);
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
function handleGetDirectory(req, res, next) {
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


function handleGetOccupantLogo (req, res, next) {

    try {
        const occupantName = req.params[0]
        const basePath = config.cacheDir + '/assets/organizations/' + latinize(occupantName) + '/logo.';

        for (var i=0; i<imageSuffixes.length;i++) {
            const occupantImagePath = basePath + imageSuffixes[i];

            if (fs.existsSync(occupantImagePath)) {
                res.sendFile(resolve(occupantImagePath));
                return
            }
        }

        res.status(404).send("No logo could be found");

    } catch (error) {
        console.log('error', error);
        res.status(500).send('An error occurred');
    }
}

function handleGetOccupantAvatar (req, res, next) {

    try {
        const occupantName = req.params[0]
        const categories = ['organizations', 'people'];

        for (var i=0; i < categories.length; i++) {
            const basePath = config.cacheDir + '/assets/' + categories[i] + '/' + latinize(occupantName) + '/avatar.';

            for (var j=0; j<imageSuffixes.length; j++) {
                const occupantImagePath = basePath + imageSuffixes[j];
                if (fs.existsSync(occupantImagePath)) {
                    res.sendFile(resolve(occupantImagePath));
                    return
                }
            }
        }

        res.status(404).send("No avatar could be found");

    } catch (error) {
        console.log('error', error);
        res.status(500).send('An error occurred');
    }
}

module.exports.init = init;
module.exports.handleGetDirectory = handleGetDirectory;
module.exports.handleGetOccupantLogo = handleGetOccupantLogo;
module.exports.handleGetOccupantAvatar = handleGetOccupantAvatar;