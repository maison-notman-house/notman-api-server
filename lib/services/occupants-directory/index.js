const json2csv = require('json2csv');
const occupants = require('../../config/occupants');

function toCSV(occupants, delimiter) {
    var fields = ['room', 'floor', 'building', 'occupant'];
    return json2csv({ data: occupants, fields: fields, del: delimiter });
}

function getOccupants(floor, building) {
    // TODO Move to an external file, whether CSV or JSON

    var filteredOccupants = occupants.filter(function(value) {
        var include = true;
        if (floor !== undefined) {
            if (value.floor !== parseInt(floor)) {
                include = false;
            }
        }
        if (building !== undefined && value.building !== building) {
            include = false;
        }

        return include;
    });

    return filteredOccupants;
};

/**
 * Returns the occupant directory of Notman House. Currently
 * only deals with businesses names and Notman management staff.
 *
 * Currently accepted query parameters:
 *   - floor
 *   - building
 */

module.exports.handleGetOccupants = function(req, res, next) {
    var floor = req.query.floor;
    var building = req.query.building;
    var format = req.query.format;
    if (!format || format === 'json') {
        res.json(getOccupants(floor, building, format));
    } else {
        res.type('text/plain');
        res.send(toCSV(getOccupants(floor, building, format), '\t'));
    }
};