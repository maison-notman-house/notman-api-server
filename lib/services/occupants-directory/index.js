const occupants = require('../../config/occupants');

function toCSV(occupants) {
    var i, response = '';
    response += `room\tfloor\tbuilding\toccupant\t\n`;
    for (i = 0; i < occupants.length; i++) {
        response += `${occupants[i].room}\t${occupants[i].floor}\t${occupants[i].building}\t${occupants[i].occupant}\t\n`;
    }
    return response;
}

function getOccupants(floor, building, format) {
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

    if (format === 'csv') {
        return toCSV(filteredOccupants);
    } else {
        return filteredOccupants;
    }
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
        res.send(getOccupants(floor, building, format));
    }
};