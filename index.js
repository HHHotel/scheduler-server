// Matt Rochford
// Happy Hound Scheduler Server
/* eslint no-console: "off" */

process.env.TZ = 'GMT+0000';

const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);

const path = require('path');
const port = process.env.PORT || 8080;

server.listen(port, () => console.log('Server running on port ' + port) );

app.use(express.static(path.join(__dirname, 'landing')));

const CLEARDB_URL     = process.env.CLEARDB_DATABASE_URL;
const CLEARDB_USERNAME  = CLEARDB_URL.substring(8, CLEARDB_URL.indexOf(':', 8));
const CLEARDB_PASSWORD  = CLEARDB_URL.substring(CLEARDB_URL.indexOf(':', 8) + 1, CLEARDB_URL.indexOf('@'));
const CLEARDB_HOST    = CLEARDB_URL.substring(CLEARDB_URL.indexOf('@') + 1, CLEARDB_URL.indexOf('/', CLEARDB_URL.indexOf('@')));
const CLEARDB_DB_NAME   = CLEARDB_URL.substring(CLEARDB_URL.indexOf('/', CLEARDB_URL.indexOf('@')) + 1, CLEARDB_URL.indexOf('?'));

const DBInterface = new require('./src/DatabaseInterface');
const database = new DBInterface(
  CLEARDB_HOST,
  CLEARDB_USERNAME,
  CLEARDB_PASSWORD,
  CLEARDB_DB_NAME
);

const UN_AUTHORIZED_ACCESS_ERROR = new Error('The required permissions for access were not met');

io.on('connection', function (socket) {

  console.log('New Connection');
  socket.emit('update');
  socket.emit('connected');

  socket.on('login', function (user, callback) {
    console.log(user);
    database.login(user.username, user.password, function (result) {
      socket.permissions = result.permissions;
      callback(result);
    });
  });

  socket.on('load', function(date, callback) {
    if (socket.permissions < 5) throw UN_AUTHORIZED_ACCESS_ERROR;
    database.getWeek(date, callback);
  });

  socket.on('add', function (event) {
    if (socket.permissions < 5) throw UN_AUTHORIZED_ACCESS_ERROR;
    database.add(event, function () {
      io.sockets.emit('update');
    });
  });

  socket.on('find', function (searchText, callback) {
    if (socket.permissions < 5) throw UN_AUTHORIZED_ACCESS_ERROR;
    let result = [];
    database.findDogs(searchText, function (res) {
      for (let entry of res) result.push(entry);
      database.findEvents(searchText, function (res) {
      for (let entry of res) result.push(entry);
      callback(result);
      });
    });
  });

  socket.on('remove_event', function (id) {
    if (socket.permissions < 5) throw UN_AUTHORIZED_ACCESS_ERROR;
    database.removeEvent(id);
    io.sockets.emit('update');
  });

  socket.on('retrieve_dog', function (id, callback) {
    if (socket.permissions < 5) throw UN_AUTHORIZED_ACCESS_ERROR;
    database.retrieveDog(id, callback);
  });


});
