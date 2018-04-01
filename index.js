// Matt Rochford 
// Happy Hound Scheduler Server
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

server.listen(port, () => console.log('Server running on port ' + port) );

app.use(express.static(path.join(__dirname, 'landing')));


const DB = new require('./src/DatabaseInterface');

io.on('connection', function (socket) {

    // TODO: Clean event name
    socket.on('new', function () {
            
        io.sockets.emit('update'); 
    });

    socket.on('load', function(date, callback) {
        let week = DB.getWeek(date);
        callback(week);
    });

    

});

