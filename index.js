/* eslint semi: ["error", "always"] */

const express = require('express');
const app = express();
const path = require('path');
const fs = require('fs');
const server = require('http').createServer(app);
const io = require('socket.io')(server);

let storage;

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

server.on('close', function () {
  console.log(' Stopping ...');
  fs.writeFile('dogData.txt', storage, function (err) {
    if (err) throw err;
    console.log('Saved!');
  });
});

process.on('SIGINT', function () {
  server.close();
});

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', function (socket) {
  socket.emit('load', storage);
  socket.on('store', function (data) {
    if (!storage.includes(data)) {
      storage += data;
    }
    socket.broadcast.emit('load', storage);
  });

  socket.on('remove', function (dogID) {
    let idIndex = storage.indexOf(dogID);
    let endIndex = storage.indexOf('!', idIndex);
    let startIndex;
    for (let i = idIndex; i >= 0; i--) {
      if (storage[i] === '!') {
        startIndex = i;
        break;
      }
    }
    storage = storage.slice(0, startIndex) + storage.slice(endIndex + 1);
    io.sockets.emit('load', storage);
  });
});
