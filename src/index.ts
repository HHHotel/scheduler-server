/*eslint no-console: "off" */

process.env.TZ = 'GMT+0000';

import express = require('express');
const app = express();
import http = require('http')
const server = http.createServer(app);
import socket_io = require('socket.io');
const io = socket_io(server);

import path = require('path');
const port = process.env.PORT || 8080;

server.listen(port, () => console.log('Server running on port ' + port) );

app.use(express.static(path.join(__dirname, 'landing')));

import DBInterface = require('./DatabaseInterface');
const database = new DBInterface(parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

import applyHandlers = require('./SocketEvents');

io.on('connection', function (socket) {

  console.log('New connection from ' + socket.request.connection.remoteAddress);

  socket.emit('connected');

  socket.on('login', function (user, callback) {
    database.login(user.username, user.password, function (result) {
      socket.emit('update');
      callback(result);
      applyHandlers(socket, io, result.permissions, database);
    });
  });

});

function parseDatabaseString (databaseUrl) {
  const dbUser = databaseUrl.substring(8, databaseUrl.indexOf(':', 8));
  const dbPass = databaseUrl.substring(databaseUrl.indexOf(':', 8) + 1, databaseUrl.indexOf('@'));
  const dbHost = databaseUrl.substring(databaseUrl.indexOf('@') + 1, databaseUrl.indexOf('/', databaseUrl.indexOf('@')));
  const dbName = databaseUrl.substring(databaseUrl.indexOf('/', databaseUrl.indexOf('@')) + 1, databaseUrl.indexOf('?'));

  return {
    user: dbUser,
    password: dbPass,
    host: dbHost,
    database: dbName
  };

}
