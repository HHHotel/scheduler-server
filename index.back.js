// Matt Rochford 
// January 2018
// Happy Hound Hotel Scheduler Server
/* eslint no-console: "off" */


process.env.TZ = 'GMT+8';

const express = require('express');
const app = express();

const path = require('path');
// const fs = require('fs');
// const hat = require('hat');

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8080;

let events;

server.listen(port, function () {

  console.log('Server running on port ' + port);

});

const clients = {

  // Track incoming client connections
  connections: [],

  // Add a new connection
  push: function (client) {

    this.connections.push(client);

  },

  // Send appropriate data to each connection
  update: function () {

    this.connections.forEach(function (client) {

      // Cache stored date
      let clientDate = client.user.date;

      // Send a load event to each client with week data
      client.emit('load', events.getWeek(clientDate));

    });

  },

  remove: function (id) {

    let index = this.connections.findIndex(function (conn) {

      return conn.id == id;

    });

    this.connections.splice(index, 1);

  }

};

app.use(express.static(path.join(__dirname, 'landing')));

const handleSockets = require('./src/SocketHandler.js');

io.on('connection', function (socket) {
  handleSockets(socket, clients);
});
