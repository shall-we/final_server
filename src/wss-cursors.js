var WebSocket = require('ws');
var _ = require('lodash');
var uuid = require('uuid');

module.exports = function(server) {

  function notifyConnections(sourceId) {
    connections.forEach(function(connection) {
      sessions[connection.id].send(JSON.stringify({
        id: connection.id,
        sourceId: sourceId,
        connections: connections
      }));
    });
  }

  var sessions = {};
  var connections = [];

  var wss = new WebSocket.Server({
    noServer: true
  });

  wss.on('connection', function(ws, req) {

    // generate an id for the socket
    ws.id = uuid();
    ws.isAlive = true;

    ws.on('message', function(data) {
      var connectionIndex;

      data = JSON.parse(data);

      // If a connection id isn't still set
      // we keep sending id along with an empty connections array
      if (!data.id) {
        ws.send(JSON.stringify({
          id: ws.id,
          sourceId: ws.id,
          connections: []
        }));

        return;
      } else {
        // If session/connection isn't registered yet, register it
        if (!sessions[ws.id]) {
          // Override/refresh connection id
          data.id = ws.id;

          // Push/add connection to connections hashtable
          connections.push(data);

          // Push/add session to sessions hashtable
          sessions[data.id] = ws;
        }
        //
        else {
          // If this connection can't be found, ignore
          if (!~(connectionIndex = _.findIndex(connections, {
              'id': data.id
            }))) {

            return;
          }

          // Update connection data
          connections[connectionIndex] = data;
        }


        // Notify all sessions
        notifyConnections(data.id);
      }
    });

    ws.on('close', function(code, reason) {


      // Find connection index and remove it from hashtable
      if (~(connectionIndex = _.findIndex(connections, {
          'id': ws.id
        }))) {

        connections.splice(connectionIndex, 1);
      }

      // Remove session from sessions hashtable
      delete sessions[ws.id];

      // Notify all connections
      notifyConnections(ws.id);
    });

    ws.on('error', function(error) {
     

      if (~(connectionIndex = _.findIndex(connections, {
          'id': ws.id
        }))) {

       
      }
    });

    ws.on('pong', function(data) {
      
      ws.isAlive = true;
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
