var request = require('request-promise');
var moment = require('moment');

var apiUrl = 'https://www.googleapis.com/calendar/v3';

module.exports = function getCalendarEvents(calendarId, apiKey) {
  var url = apiUrl + '/calendars/' + calendarId + '/events';
  var minTime = moment();
  var maxTime = minTime.clone().add(7, 'days');

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
