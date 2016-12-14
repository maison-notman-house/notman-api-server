const moment = require('moment');

module.exports = function clockDurationBetween(a, b) {
    var duration = moment.duration(b.diff(a));
    var h = duration.hours();
    var m = duration.minutes();
    var output = '';
    if (h) {
        output += h + 'h ';
    }
    if (m) {
        output += m + 'm';
    }
    return output.trim();
};