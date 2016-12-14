const moment = require('moment');

const DEFAULT_TIMEZONE = 'America/Toronto';

/**
 * Returns the time on the server. Provided, since the time
 * on the Raspberry Pi was proving unreliable. 
 * 
 */
module.exports.handleGetTime = function(req, res, next) {
    // handle option of returning time in 24 hours
    var twentyfourHour = req.query['24hour'];
    var format = (twentyfourHour && twentyfourHour === '1' ? 'HH:mm' : 'h:mm a');
    // handle option of returning time in UTC
    var utc = req.query['utc'];
    var tz = (utc && utc === '1' ? 'UTC' : DEFAULT_TIMEZONE);
    var timeString = moment().tz(tz).format(format);
    res.json({ time: timeString });
}