const netatmoWeather = require('./get-netatmo-environment');

module.exports.handleGetStationData = function(req, res, next) {
    netatmoWeather.getStationsData(
        process.env.NETATMO_CLIENT_ID,
        process.env.NETATMO_CLIENT_SECRET,
        process.env.NETATMO_USERNAME,
        process.env.NETATMO_PASSWORD,
        function(netatmoEnvironment) {
            res.json(netatmoEnvironment);
        });
};