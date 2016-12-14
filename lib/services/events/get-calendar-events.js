const request = require('request-promise');
const moment = require('moment');

const apiUrl = 'https://www.googleapis.com/calendar/v3';
const defaultDays = 7;

module.exports = function getCalendarEvents(calendarId, apiKey, days) {
    var url = apiUrl + '/calendars/' + calendarId + '/events';
    var minTime = moment();
    var maxTime = minTime.clone().add((days ? days : defaultDays), 'days');

    return request({
        url: url,
        qs: {
            key: apiKey,

            orderBy: 'startTime',
            showDeleted: 'false',
            singleEvents: 'true',
            timeMin: minTime.toISOString(),
            timeMax: maxTime.toISOString()
        },
        json: true
    }).then(function(response) {
        return response.items;
    });
};