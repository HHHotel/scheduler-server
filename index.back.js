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

server.listen(port, function () {

  console.log('Server running on port ' + port);

});

app.use(express.static(path.join(__dirname, 'landing')));

io.on('connection', function (socket) {
  console.log('New Connection');
});
