const url = require('url');
const request = require('request');

/**
 * This service essentially provides a proxy service to vendor APIs,
 * filling in required credentials. Ideally we would be using NodeJS
 * based APIs, rather than needing to call directly.
 */

module.exports.handleGets = function(req, res, next) {
    var baseUrl;
    var requestUrl;
    var path = req.params[1];
    var query = req.query;
    var matched = true;

    if (req.params[0] === 'myseat') {
        console.log('vendor myseat');
        baseUrl = 'https://apiv3.myseat.fr/Request/'
        if (!query) {
            query = {};
        }
        if (path.indexOf('/key') > 0) {
            path = path.substring(0, path.indexOf('/key'))
        }

        if (!path.endsWith('/')) {
            path += '/';
        }
        requestUrl = url.parse(`${baseUrl}${path}key/${process.env.MYSEAT_API_KEY}`);
        requestUrl.query = query;
        // Just an easy way to get parameters added in
        requestUrl = url.parse(url.format(requestUrl));

    } else {
        matched = false;
    }

    if (matched) {
        request(url.format(requestUrl), function(error, response, body) {
            if (!error && response.statusCode == 200) {
                res.type(response.headers['content-type']);
                res.send(body);
            } else {
                res.send({
                    error: error
                });
            }
        });
    } else {
        res.send({
            error: 'vendor access not supported, via /api/vendor'
        });
    }
}