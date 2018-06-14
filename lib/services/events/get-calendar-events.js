const moment = require('moment');
const { google } = require('googleapis');

const defaultDays = 7;

function authorize (key) {

    return new Promise((resolve, reject) => {
        console.log('.....', key);
        var jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key, ['https://www.googleapis.com/auth/calendar.readonly'],
            null
        );

        const calendar = google.calendar({
            version: 'v3',
            auth: jwtClient
        });

        jwtClient.authorize((err) => {
           if (err) {
               reject(err);
           } else {
               resolve(calendar);
           }
        });
    });
}

/**
 * Lists the next 10 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(calendarId, apiKey, days) {
    return authorize(apiKey)
        .then((calendar) => {
            return new Promise((resolve, reject) => {
                var minTime = moment();
                var maxTime = minTime.clone().add((days ? days : defaultDays), 'days');

                calendar.events.list({
                    calendarId: calendarId,
                    orderBy: 'startTime',
                    showDeleted: 'false',
                    singleEvents: 'true',
                    timeMin: minTime.toISOString(),
                    timeMax: maxTime.toISOString()
                }, (err, response) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    const data = response.data;
                    resolve(data.items);
                });
            });
        });
  }

module.exports = listEvents;
