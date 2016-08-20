require('dotenv').load();

var app = require('./app');

var port = process.env.PORT || 3000;
var ip = process.env.IP || '0.0.0.0';

// Part 1. Start the HTTP server using Express.

var server = app.listen(port, ip, function() {
  console.log('Server is listening on', ip + ':' + port);
});

// Part 2. Start the WebSocket server
var WebSocketServer = require('ws').Server;
app.wss = new WebSocketServer({server});

wss.on('connection', function connection(ws) {
  console.log('Connection established', ws);

  ws.on('message', function incoming(data) {
    var message = JSON.parse(message);

    if (message.message == 'ping') {
        ws.send(JSON.stringify({message: 'pong', count: message.count + 1}))
    }
    console.log('received: %s', message);
  });

  ws.send(JSON.stringify({message: 'Hello, world!'}));
});
