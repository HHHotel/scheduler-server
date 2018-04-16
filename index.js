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

const CLEARDB_URL       = process.env.CLEARDB_DATABASE_URL;
const CLEARDB_USERNAME  = CLEARDB_URL.substring(8, CLEARDB_URL.indexOf(':', 8));
const CLEARDB_PASSWORD  = CLEARDB_URL.substring(CLEARDB_URL.indexOf(':', 8) + 1, CLEARDB_URL.indexOf('@'));
const CLEARDB_HOST      = CLEARDB_URL.substring(CLEARDB_URL.indexOf('@') + 1, CLEARDB_URL.indexOf('/', CLEARDB_URL.indexOf('@')));
const CLEARDB_DB_NAME   = CLEARDB_URL.substring(CLEARDB_URL.indexOf('/', CLEARDB_URL.indexOf('@')) + 1, CLEARDB_URL.indexOf('?'));

const DBInterface = new require('./src/DatabaseInterface');
const database = new DBInterface(
    CLEARDB_HOST,
    CLEARDB_USERNAME,
    CLEARDB_PASSWORD,
    CLEARDB_DB_NAME
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

