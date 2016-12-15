const fs = require('fs');
const fastcsv = require('fast-csv');
const roomsDirectory = require('../../config/rooms');

const OCCUPANTS_CSV = 'lib/config/occupants.csv';

var occupants = [];

function loadOccupants() {
    var stream = fs.createReadStream(OCCUPANTS_CSV);

    var csvStream = fastcsv
        .fromStream(stream, { delimiter: '\t', headers: ['room', 'occupant'] })
        .on("data", function(data) {
            occupants.push(data);
        })
        .on("end", function() {
            // console.log("done");
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

loadOccupants();

/**
 * Returns the occupant directory of Notman House. Currently
 * only deals with businesses names and Notman management staff.
 *
 * Currently accepted query parameters:
 *   - floor
 *   - building
 */
module.exports.handleGetOccupants = function(req, res, next) {
    var quoteColumns = true;
    var floor = req.query.floor;
    var building = req.query.building;
    var format = req.query.format;
    var delimeter = req.query.del;
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