const WebSocket = require("ws").Server;
const HttpsServer = require('https').createServer;
const fs = require("fs");

server = HttpsServer({
    cert: fs.readFileSync("./certificate.crt"),
    key: fs.readFileSync("./private.key")
})

socket = new WebSocket({
    server: server
});

socket.on('connection', function connection(connection) {
    console.log("connection established...")
    connection.on('message', function incoming(message) {
      console.log('received: %s', message);
    });
  
    // connection.send('something');
  });


// socket.on(...);
server.listen(8812);