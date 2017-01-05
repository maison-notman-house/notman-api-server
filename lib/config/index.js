function loadKey() {
    if (process.env.DRIVE_KEY) {
        return JSON.parse(process.env.DRIVE_KEY);
    } else {
        return require('../../key.json');
    }
}

var driveKey = loadKey();


module.exports = {
    cacheDir: 'cache',
    googleDrive: {
        key: driveKey
    },
    occupants: {
        driveFileId: '1yvN4sz9w_wyLSPYg95BsuxYa6yJtwz64ZAqcjll9ow4'
    }
}