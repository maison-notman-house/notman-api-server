//https://www.hyperlocalcontext.com/contextat/directory/notman

const request = require('request');

const REMOTE_URL = 'https://www.hyperlocalcontext.com/contextat/directory/notman';

/** 
 * Returns whether the device is 'fixed' to the location. For example
 * the sensors and other devices which are afixed to the building.
 */
function isFixedDevice(device) {
    if (device.url === 'http://reelyactive.com/products/ra-r436/') {
        return true;
    } else if (device.url === 'https://sniffypedia.org/Product/reelyActive_RA-R436/') {
        return true;
    } else if (device.url === 'https://sniffypedia.org/Organization/Estimote_Inc/') {
        return true;
    } else if ((device.url + '').startsWith('https://maison-notman-house.github.io/notman-reelyactive-dashboard/places')) {
        return true;
    } else {
        return false;
    }
}

module.exports.handleGetDeviceDirectory = function(req, res, next) {
    request(REMOTE_URL, function(error, response, body) {
        console.log('----', body);
        var deviceData = JSON.parse(body);
        //console.log(deviceData.devices)
        for (key in deviceData.devices) {
            deviceData.devices[key].fixedDevice = isFixedDevice(deviceData.devices[key]);
            console.log(key)
        };

        res.json(deviceData);
    });

}