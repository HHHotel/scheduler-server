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

const DBInterface = new require('./src/DatabaseInterface');
const database = new DBInterface(
    'us-cdbr-iron-east-05.cleardb.net',
    'b174a353922a1b',
    '12ccc48f',
    'heroku_5394de57c9d31a8'
);

io.on('connection', function (socket) {

    console.log('New Connection');
    socket.emit('update');

    socket.on('load', function(date, callback) {
        database.getWeek(date, callback);
    });

    socket.on('add', function (event) {
        database.add(event, function () {
            io.sockets.emit('update'); 
        });
    });

    socket.on('find', function (searchText, callback) {
        database.findDogs(searchText, callback);
    });

    socket.on('remove_event', function (id) {
        database.removeEvent(id);
    });

});

