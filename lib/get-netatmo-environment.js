const netatmo = require('netatmo');

/**
 * getNetatmoEnvironment
 * Connects to the Netatmo server and requests the device list which includes
 * all environment sensor readings.
 * @param {String} clientId The client_id of the Netatmo account.
 * @param {String} clientSecret The client_secret of the Netatmo account.
 * @param {String} username The username (e-mail) of the Netatmo account.
 * @param {String} password The password of the Netatmo account.
 * @param {function} callback The function to call on completion.
 * @returns {Array}
 */
module.exports = function getNetatmoEnvironment(clientId, clientSecret,
                                                username, password, callback) {
  var auth = {
    "client_id": clientId,
    "client_secret": clientSecret,
    "username": username,
    "password": password
  };

  var api = new netatmo(auth);

  api.getDevicelist(function(err, devices, modules) {
    if(err) {
      console.error(err);
      return callback([]);
    }
    return callback(devices.concat(modules));
  });
};
