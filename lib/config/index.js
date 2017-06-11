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
        driveFileId: '0B0gS8SYjdTSsc3REdjR2dS11dU0'
    }
}