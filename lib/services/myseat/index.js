/**
 * Returns the mySeat data. Should this be removed due to mySeat
 * no longer being part of the 'Hack the House' initiative?
 */
module.exports.handleGetChairs = function(req, res, next) {
    var url = `https://apiv3.myseat.fr/Request/GetChairs/key/${process.env.MYSEAT_API_KEY}`;

    request(url, function(err, result) {
        if (err) {
            res.status(500).send();
            console.error(err);
            return;
        }

        res.status(result.statusCode).type(result.headers['content-type']).send(result.body);
    });
}