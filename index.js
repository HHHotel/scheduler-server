// Matt Rochford 
// January 2018
// Happy Hound Hotel Scheduler Server


process.env.TZ = 'GMT+8';

const EventsInterface = require('./js/objects/old/eventsinterface.js');

const express = require('express');
const app = express();

const path = require('path');
const fs = require('fs');
// const hat = require('hat');

const server = require('http').createServer(app);
const io = require('socket.io')(server);

const port = process.env.PORT || 8080;

let events;

fs.readFile('data/dogData.json', 'utf8', function (err, data) {

  if (err) throw err;
  try {

    events = new EventsInterface(data);

  } catch (e) {

    events = new EventsInterface();

  }

});

server.listen(port, function () {

  console.log('Server running on port ' + port);

});

// process.on('SIGINT', function () {
//   console.log('Exiting..');
//   fs.writeFileSync('data/dogData.json', events.serialize());
//   server.close();
// });

const clients = {

  // Track incoming client connections
  connections: [],

  // Add a new connection
  push: function (client) {

    this.connections.push(client);

  },

  // Send appropriate datat to each connection
  update: function () {

    this.connections.forEach(function (client) {

      // Cache stored date
      let clientDate = client.user.date;

      // Send a load event to each client with week data
      client.emit('load', events.getWeek(clientDate));

    });

  },

  remove: function (id) {

    let index = this.connections.findIndex(function (conn) {

      return conn.id == id;

    });

    this.connections.splice(index, 1);

  }

};

app.use(express.static(path.join(__dirname, 'landing')));

io.on('connection', function (socket) {

  console.log('New connection id : ' + socket.id);

  socket.user = {

    date: new Date(),
    ID: socket.id

  };

  clients.push(socket);
  clients.update();

  socket.on('week.change', function (data) {

    socket.user.date = new Date(data);
    clients.update();

  });

  socket.on('events.new', function (data, ack) {

    try {

      events.addEvent(data);
      ack('Added ' + data);
      console.log('Added new event ' + JSON.stringify(data));

      clients.update();

    } catch (e) {

      ack('Error adding event: ' + e.message);

    };

  });

  socket.on('events.new.booking', function (data, ack) {

    try {

      let id = data.id;
      let booking = {
        start: data.start,
        end: data.end,
        date: data.date
      };

      events.addBooking(id, booking);
      clients.update();
      ack('Added booking to id: ' + id);
      console.log('Added Booking: ');
      console.log(booking);

    } catch (e) {

      ack('Error Adding booking: ' + e.message);

    }

  });

  socket.on('events.find', function (eventText) {

    let resEvents = events.findAll(eventText);
    socket.emit('events.find.response', resEvents);

  });

  socket.on('events.remove', function (evtID, ack) {

    try {

      events.remove(evtID);
      ack('Removed id: ' + evtID);

      console.log('Removed id: ' + evtID);

      clients.update();

    } catch (e) {

      ack('Error removing: ' + e.message);

    }

  });

  socket.on('disconnect', function () {

    console.log('id : ' + socket.id + ' disconnected');
    clients.remove(socket.id);

  });

});