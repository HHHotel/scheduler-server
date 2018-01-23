/* eslint semi: ["error", "always"] */

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var storage;

fs.readFile('dogData.json', 'utf8', function (err, data) {
  if (err) {
    storage = [];
  } else {
    storage = JSON.parse(data);
  }
});

server.listen(8080, function () {
  console.log('Server running on port 8080');
});

process.on('SIGINT', function () {
  console.log('Exiting..');
  fs.writeFileSync('dogData.json', JSON.stringify(storage));
  server.close();
});

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', function (socket) {
  console.log('New connection id : ' + socket.id);

  socket.emit('load', JSON.stringify(storage));

  socket.on('store', function (data) {
    var eventData = JSON.parse(data);
    var index = indexOf(eventData);

    if (index < 0) {
      storage.events.push(eventData);
    } else {
      storage.events[index] = eventData;
    }
    socket.broadcast.emit('load', JSON.stringify(storage));
  });

  function indexOf (eventObj) {
    for (var i = 0; i < storage.events.length; i++) {
      var el = storage.events[i];
      if (el.obj.ID === eventObj.obj.ID) return i;
    }
    return -1;
  }

  // TO-DO SQL

  socket.on('remove', function (dogID) {
    var index = indexOf({obj: {id: dogID}});
    storage.events = storage.events.slice(0, index) + storage.events.slice(index + 1);
    io.sockets.emit('load', JSON.stringify(storage));
  });

  socket.on('disconnect', function () {
    console.log('id : ' + socket.id + ' disconnected');
  });
});
