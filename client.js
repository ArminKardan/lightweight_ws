const WebSocket = require("ws")
const fs = require("fs");


const ws = new WebSocket('wss://localhost:8812',
{
  rejectUnauthorized:false
});

ws.on('open', function open() {
  let dt = Buffer.from('something','utf-8');
  console.log(dt)
  ws.send(dt);
});

ws.on('message', function message(data) {
  console.log('received: %s', data);
});