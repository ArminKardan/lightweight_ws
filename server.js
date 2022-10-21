const WebSocket = require("ws").Server;
const HttpsServer = require('https').createServer;
const fs = require("fs");
const net = require('net');

socket = new WebSocket({port:7240});
let listeners = {}

setInterval(() => 
{
  var keys = Object.keys(listeners);
  for(let k of keys)
  {
    if(!listeners[k].proxy || listeners[k].proxy.destroyed)
    {
      delete listeners[k]
    }
  }
}, 1000);

socket.on('connection', function connection(connection) 
{
    console.log("connection established...")

    // connection.send(Buffer.from("yeah!",'utf8'))

    connection.on('message', async function incoming(message) 
    {
      let msg = Buffer.from(message);
      // console.log("raw message:", msg)
      let cmd = msg[0];
      let num = msg.slice(1,9).readBigInt64LE();
      let numbuf = msg.slice(1,9)
      let data = msg.slice(9)

      if(cmd == 0x02)//on data
      {
        listeners[num]?.proxy.write(data);
      }
      else if(cmd == 0x00)//on close
      {
        if (!listeners[num]?.proxy.destroyed) listeners[num].proxy.destroy();
      }
      else if(cmd == 0x01)
      {
        let host = data.slice(0,4).join(".");
        let port = data.slice(4,6).readInt16LE();
        // console.log("Connecting to:"+ host+":"+port)

        let success = false;
        let proxy = null;
        for(let i = 0; i < 5; i++)
        {
          try 
          {
            proxy = net.createConnection(port, host);
            proxy.on('connect', ()=>
            {
              let address = JSON.stringify(proxy.address()).toString('utf8');
              // console.log("CONNECTED, ADDRESS:", proxy.address())
              connection.send(Buffer.concat([Buffer.from([0x01]),numbuf, Buffer.from(address,'utf8')]))
            })
            proxy.on('data', data=>
            {
              connection.send(Buffer.concat([Buffer.from([0x02]),numbuf,data]));
            })
            proxy.on('close', ()=>
            {
              connection.send(Buffer.concat([Buffer.from([0x00]),numbuf,Buffer.from([0x00])]));
            })
            proxy.on('error', ()=>
            {
              connection.send(Buffer.concat([Buffer.from([0x04]),numbuf,Buffer.from([0x00])]));
            })
            
            success = true;
            break;
          }
          catch 
          { 
            // console.log("retrying...")
          }
        }

        if(!success)
        {
          connection.send(Buffer.concat([Buffer.from([0x00]),numbuf,Buffer.from([0x00])]));
        }
        else
        {
          listeners[num] = 
          {
            host,
            port,
            proxy,
            connection,
          }
        }
      }
    });
  });
