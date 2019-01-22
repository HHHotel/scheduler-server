// Matt Rochford
/*eslint no-console: "off" */

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

io.on('connection', function (socket) {

  console.log('New connection from ' + socket.request.connection.remoteAddress);
  socket.permissions = 0;

  socket.emit('connected');

  handleEvent(socket, 'login', function (user, callback) {
    database.login(user.username, user.password, function (result) {
      socket.permissions = result.permissions;
      socket.emit('update');
      callback(result);
      applyHandlers(socket);
    });
  });

});


function applyHandlers(socket) {
  handleEvent(socket, 'load', function(date, callback) {
    database.getWeek(date, callback);
  });

  handleEvent(socket, 'add', function (event) {
    database.add(event, function () {
      io.sockets.emit('update');
    });
  }, 5);

  handleEvent(socket, 'find', function (searchText, callback) {
    let result = [];
    database.findDogs(searchText, function (res) {
      for (let entry of res) result.push(entry);
      database.findEvents(searchText, function (res) {
      for (let entry of res) result.push(entry);
      callback(result);
      });
    });
  });

  handleEvent(socket, 'remove_event', function (id, callback) {
    database.removeEvent(id, callback);
    io.sockets.emit('update');
  }, 5);

  handleEvent(socket, 'remove_dog', function (id, callback) {
    database.removeDog(id, callback);
    io.sockets.emit('update');
  }, 6);

  handleEvent(socket, 'retrieve_dog', function (id, callback) {
    database.retrieveDog(id, callback);
  });

  handleEvent(socket, 'edit_dog', function (dogProfile, callback) {
    database.editDog(dogProfile.id, 'dog_name', dogProfile.name);
    database.editDog(dogProfile.id, 'client_name', dogProfile.clientName);

    for ( let booking of dogProfile.bookings ) {
      database.editEvent(booking.eventID, 'event_start', booking.start);
      database.editEvent(booking.eventID, 'event_end', booking.end);
    }

    io.sockets.emit('update');
  }, 6);
}

function handleEvent (socket, eventName, handler, permissionLevel) {
  if (!permissionLevel) permissionLevel = 0;

  if (socket.permissions < permissionLevel) {
    console.error('Error: required permissions not met for event ' + eventName + ' from ' + socket.request.connection.remoteAddress);
  } else {
    socket.on(eventName, handler);
  }
 }
