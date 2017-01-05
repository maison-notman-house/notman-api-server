const fs = require('fs-extra');

const Promise = require('bluebird');
const google = require('googleapis');
const OAuth2 = google.auth.OAuth2;
// const key = require('./key.json');

// class GDriveSync {

//     init() 
//     sync (fileFolderId, baseFolder, key) {
//         //
//     }
// }

function timeAsSeconds(time) {
    if (typeof time === 'string') {
        return Date.parse(time) / 1000;
    } else if (time instanceof Date) {
        return time.getTime() / 1000;
    }
}

function isGDriveFileNewer(file, path) {
    try {
        var stats = fs.statSync(path);
        var fsModifiedTime = timeAsSeconds(stats.mtime);
        var driveModifiedTime = timeAsSeconds(file.modifiedTime);
        return (driveModifiedTime > fsModifiedTime);
    } catch (err) {
        if (err.code === 'ENOENT') {
            return true;
        } else {
            throw err;
        }
    }
}

function downloadFile(drive, file, path, callback) {
    var filePath = path.concat(file.name).join('/');
    if (isGDriveFileNewer(file, filePath)) {
        console.log('downloading newer: ', filePath);
        console.log('creating file: ', filePath);
        var dest = fs.createWriteStream(filePath);

        // For Google Docs files only
        drive.files.get({
                fileId: file.id,
                alt: 'media'
            })
            .on('end', function() {
                //console.log('Done, download: ', filePath);
                fs.utimesSync(
                    filePath,
                    timeAsSeconds(file.createdTime),
                    timeAsSeconds(file.modifiedTime)
                );
                if (callback) {
                    callback(undefined, [{
                        file: filePath,
                        updated: true
                    }]);
                }
            })
            .on('error', function(err) {
                console.log('Error during download', err);
                if (callback) {
                    callback(err, undefined);
                }
            })
            .pipe(dest);
    } else {
        callback(undefined, [{
            file: filePath,
            updated: false
        }]);
    }
}

function exportFile(drive, file, path, mimeType, suffix, callback) {
    var name = file.name + suffix;
    var filePath = path.concat(name).join('/');

    if (isGDriveFileNewer(file, filePath)) {
        console.log('downloading newer: ', filePath);
        console.log('exporting to file: ', filePath);
        var dest = fs.createWriteStream(filePath);

        // For Google Docs files only
        drive.files.export({
                fileId: file.id,
                mimeType: mimeType
            }, {
                encoding: null // Make sure we get the binary data
            })
            .on('end', function() {
                console.log('Done, download: ', filePath);
                fs.utimesSync(
                    filePath,
                    timeAsSeconds(file.createdTime),
                    timeAsSeconds(file.modifiedTime)
                );
                if (callback) {
                    callback(undefined, [{
                        file: filePath,
                        updated: true
                    }]);
                }
            })
            .on('error', function(err) {
                console.log('error', 'Error during download', err);
                if (callback) {
                    callback(err, undefined);
                }
            })
            .pipe(dest);
    } else {
        callback(undefined, [{
            file: filePath,
            updated: false
        }]);
    }
}


function downloadContent(drive, file, path, callback) {
    setTimeout(function() {
        if (file.mimeType === 'application/vnd.google-apps.document') {
            exportFile(drive, file, path, 'application/pdf', '.pdf', callback);
        } else if (file.mimeType === 'application/vnd.google-apps.spreadsheet') {
            exportFile(drive, file, path, 'text/csv', '.csv', callback);
        } else if (file.mimeType.startsWith('application/vnd.google-apps')) {
            console.log('unhandled Google Doc type: ', file.mimeType);
        } else {
            downloadFile(drive, file, path, callback);
        }
    }, 1000);

}


function visitDirectory(drive, fileId, parentPath, callback) {
    console.log('path: ', parentPath.join('/'));

    setTimeout(function() {
        drive.files.list({
            includeRemoved: false,
            spaces: 'drive',
            fileId: fileId,
            fields: 'nextPageToken, files(id, name, parents, mimeType, createdTime, modifiedTime)',
            q: `'${fileId}' in parents`
        }, function(err, resp) {
            if (!err) {
                var i;
                console.log(resp);
                var files = resp.files;
                for (i = 0; i < files.length; i++) {
                    if (files[i].mimeType == 'application/vnd.google-apps.folder') {
                        console.log('directory: ' + files[i].name);
                        var path = parentPath.concat(files[i].name);
                        visitDirectory(files[i].id, path, callback);
                        try {
                            fs.mkdirp(parentPath.concat(files[i].name).join('/'));
                        } catch (err) {
                            // Ignored
                        }
                    } else {
                        downloadContent(files[i], parentPath, callback);
                    }
                }
            } else {
                console.log('error: ', err);
            }
        });
    }, 1000);
}

function fetchContents(drive, fileId, downloadDir, callback) {
    drive.files.get({
        fileId: fileId,
        fields: 'id, name, parents, mimeType, createdTime, modifiedTime',
    }, function(err, resp) {
        if (err) {
            console.log(err, resp);
            if (callback) {
                callback(err, undefined);
            }
        } else if (resp) {
            if (resp.mimeType == 'application/vnd.google-apps.folder') {
                visitDirectory(drive, filedId, [downloadDir]);
            } else {
                downloadContent(drive, resp, [downloadDir], callback);
            }

        }

    });
}



function sync(fileFolderId, baseFolder, key) {
    return new Promise(function(resolve, reject) {
        var jwtClient = new google.auth.JWT(
            key.client_email,
            null,
            key.private_key, ['https://www.googleapis.com/auth/drive.readonly'],
            null
        );

        const drive = google.drive({
            version: 'v3',
            auth: jwtClient
        });

        jwtClient.authorize(function(err, tokens) {
            if (err) {
                resolve(err)
                return;
            }

            // Note: only the callback for a single file has been tested.
            //       the callback for a directory is currently broken
            fetchContents(drive, fileFolderId, baseFolder, function(err, filePaths) {
                if (err) {
                    reject(err);
                } else {
                    resolve(filePaths)
                }
            });
        });
    });
}

module.exports.sync = sync;

// ref: https://developers.google.com/drive/v3/web/folder
// ref: https://www.npmjs.com/package/googleapis
// ref: https://developers.google.com/drive/v3/web/search-parameters
// ref: https://developers.google.com/drive/v3/web/manage-downloads
// ref: https://developers.google.com/drive/v3/reference/files#resource