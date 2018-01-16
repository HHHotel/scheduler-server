/* eslint semi: ["error", "always"] */

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var storage;

fs.readFile('dogData.txt', 'utf8', function (err, data) {
  if (err) {
    storage = '';
  } else {
    storage = data;
  }
});

server.listen(8080, function () {
  console.log('Server running on port 8080');
});

process.on('SIGINT', function () {
  console.log('Exiting..');
  fs.writeFileSync('dogData.txt', storage, function (err) {
    if (err) throw err;
  });
  server.close();
});

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', function (socket) {
  console.log('New connection');
  socket.emit('load', storage);
  socket.on('store', function (data) {
    if (!storage.includes(data)) {
      storage += data;
    }
    socket.broadcast.emit('load', storage);
  });

  socket.on('remove', function (dogID) {
    var idIndex = storage.indexOf(dogID);
    var endIndex = storage.indexOf('!', idIndex);
    var startIndex;
    for (var i = idIndex; i >= 0; i--) {
      if (storage[i] === '!') {
        startIndex = i;
        break;
      }
    }
    storage = storage.slice(0, startIndex) + storage.slice(endIndex + 1);
    io.sockets.emit('load', storage);
  });
});
