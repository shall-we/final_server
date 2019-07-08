var WebSocket = require('ws');
var WebSocketJSONStream = require('websocket-json-stream');
var shareDBServer = require('./sharedb-server');
var uuid = require('uuid');


module.exports = function(server) {
  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {

    // generate an id for the socket
    ws.id = uuid();
    ws.isAlive = true;

    var stream = new WebSocketJSONStream(ws);
    shareDBServer.listen(stream);

    ws.on('pong', function(data, flags) {
      ws.isAlive = true;
    });

    ws.on('error', function(error) {
    });
  });

  // Sockets Ping, Keep Alive
  setInterval(function() {
    wss.clients.forEach(function(ws) {
      if (ws.isAlive === false) return ws.terminate();

      ws.isAlive = false;
      ws.ping();
    });
  }, 30000);

  return wss;
};
