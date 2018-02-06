/* eslint semi: ["error", "always"] */

const EventsInterface = require('./js/objects/eventsinterface.js');

var express = require('express');
var app = express();

var path = require('path');
var fs = require('fs');

var server = require('http').createServer(app);
var io = require('socket.io')(server);

const port = process.env.port || 8080;

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
//   fs.writeFileSync('dogData.json', JSON.stringify(events));
//   server.close();
// });

app.use(express.static(path.join(__dirname, 'client')));

io.on('connection', function (socket) {
  console.log('New connection id : ' + socket.id);

  io.sockets.emit('load', events.getWeek(new Date('2/4/2018')));

  console.log(events);

  socket.on('getevents', function (date, fn) {
    let response = events.getWeek(new Date(date));
    // console.log(response);
    fn(response);
  });

  socket.on('push', function (data) {
    var evt = JSON.parse(data);
    events.addEvent(evt);
  });

  socket.on('remove', function (dogID) {
    events.remove(dogID);
  });

  socket.on('disconnect', function () {
    console.log('id : ' + socket.id + ' disconnected');
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
