const fs = require('fs');

const DEVICE_FILE = 'devices.json';

let devices = {};

function init() {        
    const deviceDataPath = DEVICE_FILE;
    fs.stat(deviceDataPath, function (err, stats) {
        if (!err) {
            loadDevices(deviceDataPath, undefined, function (err, data) {
                if (data) {
                    devices = JSON.parse(data);
                }
            });
        } else if (err && err.code !== 'ENOENT') {
            console.error('devices:init', err.code, err, err.stack);                                        
        }
    });    
}

function storeDevices (deviceDataPath, data, res) {
    const json = JSON.stringify(data);
    fs.writeFile(deviceDataPath, json, 'utf8', function (err) {
        if (err) {
            if (res) {
                res.json({
                    status: 'error',
                    message: err.message
                });
            }
            console.error('devices:storeDevices', err.code, err, err.stack);            
        } else {
            if (res) {
                res.json(Object.assign({ status: 'ok' }, data));
            }
        }
    });
}

function loadDevices(deviceDataPath, res, callback) {    
    fs.readFile(deviceDataPath, 'utf8', function readFileCallback(err, data){
        if (err){
            if (res) {
                res.json({
                    status: 'error',
                    message: err.message
                });
            }
            console.error('devices:loadDevices', err.code, err, err.stack);            
        } else if (callback) {
            callback(undefined, data);            
        }
    });     
}

module.exports.handleRegisterDevice = function (req, res, next) {

    const deviceDataPath = DEVICE_FILE;
    const devicename = req.params.devicename;
    const ipv4 = req.body.ipv4;
    const ipv6 = req.body.ipv6;

    var deviceInfo = {
        devicename: devicename,
        ipv4: ipv4,
        ipv6: ipv6,
        updated: new Date()
    };

    var ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;    

    console.log('from ip: ', ip);
    console.log('device info: ', deviceInfo);

    // check to see if the file exists. if it does read in the
    // data otherwise just store what we have
    fs.stat(deviceDataPath, function (err, stats) {
        if (!err) {
            loadDevices(deviceDataPath, res, function (err, data) {
                if (!err) {
                    let obj = JSON.parse(data);
                    obj[devicename] = deviceInfo;
                    storeDevices(deviceDataPath, obj, res);
                    devices = obj;
                }
            });
        } else if (err && err.code === 'ENOENT') {
            storeDevices(deviceDataPath, devices);
        } else {
            console.error('devices:handleRegisterDevice', err, err.stack);
        }
    });

    
}

module.exports.handleGetDevice = function(req, res, next) {
    const devicename = req.params.devicename;
    if (devices[devicename]) {
        res.json(devices[devicename]);
    } else {
        res.status(404).json({
            status: 'device not found',
        })
    }    
}

module.exports.handleGetDeviceDirectory = function(req, res, next) {
    res.json(devices);
}

init();