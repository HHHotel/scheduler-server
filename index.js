/* eslint-disable */

const EventsInterface = require('./js/objects/eventsinterface.js');

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
  push: function (client) {this.connections.push(client)},

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

  }

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

      events.remove(dogID);
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


// var csvData = {
//   events: [],
//   arrivals: [],
//   depatures: [],
//   daycare: [],
//   SEvents: [],
//   indexOf: function (eventObj, field, index) {
//     for (var i = index; i < field.length; i++) {
//       var el = field[i];
//       if (el && eventObj && el.name === eventObj.name) return i;
//     }
//     return -1;
//   },
//
//   indexOfDates: function (eventObj, field, index) {
//     for (var i = index; i < field.length; i++) {
//       var el = field[i];
//       if (el && eventObj && el.name === eventObj.name) return i;
//     }
//     return -1;
//   }
// };
//
// var parse = require('csv-parse');
//
// fs.readFile('data/schedule.csv', 'utf8', function (err, data) {
//   if (err) throw err;
//   parse(data, function (err, output) {
//     if (err) throw err;
//     for (var i = 0; i < output.length; i++) {
//       var evt = output[i];
//       var name = evt[3].replace(' leaves', '').replace(' arrives', '').replace(' arrive', '').replace(' leave', '');
//       var date = evt[0];
//       var time = evt[1];
//       var status = evt[5].substring(1, evt[5].length - 1).toLowerCase();
//       var e = {name: name, date: date, time: time, color: status, id: getNewID()};
//       if (status === 'arrivals') {
//         csvData.arrivals.push(e);
//       } else if (status === 'departures') {
//         csvData.depatures.push(e);
//       } else if (status === 'daycare') {
//         csvData.daycare.push(e);
//       } else if (status !== 'boarding') {
//         csvData.SEvents.push({text: name, date: date, time: time, color: status, id: getNewID()});
//       }
//     }
//
//     for (var j = 0; j < csvData.arrivals.length; j++) {
//       var el = csvData.arrivals[j];
//       if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, id: el.id, cName: ' ', bookings: []});
//       var pairIndex = csvData.indexOf(el, csvData.depatures, j);
//       var pairEl = csvData.depatures[pairIndex];
//       var eventIndex = csvData.indexOf(el, csvData.events, 0);
//       if (pairEl) csvData.events[eventIndex].bookings.push({start: el.date, end: pairEl.date});
//     }
//     for (var q = 0; q < csvData.daycare.length; q++) {
//       el = csvData.daycare[q];
//       if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, id: el.id, cName: ' ', bookings: []});
//       eventIndex = csvData.indexOf(el, csvData.events, 0);
//       csvData.events[eventIndex].bookings.push({date: el.date});
//     }
//     for (var p = 0; p < csvData.SEvents.length; p++) {
//       var event = csvData.events[p];
//       if (event) storage.add({obj: event, type: 'Dog'});
//       var sEvent = csvData.SEvents[p];
//       storage.add({obj: sEvent, type: 'SEvent'});
//     }
//   });
// });
//
// function getNewID () {
//   let id = '';
//   let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   for (var i = 0; i < 8; i++) {
//     id += possible[Math.round(Math.random() * (possible.length - 1))];
//   }
//
//   /*  TO-DO Fix possibility of repeated ids */
//   return id;
// };
