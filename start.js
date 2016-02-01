require('dotenv').load();

var app = require('./app');

var port = process.env.PORT || 3000;
var ip = process.env.IP || '0.0.0.0';

app.listen(port, ip, function() {
  console.log('Server is listening on', ip + ':' + port);
});
