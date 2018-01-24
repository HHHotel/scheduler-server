/* eslint semi: ["error", "always"] */

var express = require('express');
var app = express();
var path = require('path');
var fs = require('fs');
var parse = require('csv-parse');
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var storage = {
  events: [],
  add: function (eventInfo) {
    this.events.push(eventInfo);
  },
  set: function (index, obj) {
    this.events[index] = obj;
  },
  push: function (index, eventObj) {
    if (index < 0) {
      storage.add(eventObj);
    } else {
      storage.set(index, eventObj);
    }
  },
  remove: function (dogID) {
    var index = storage.indexOf({obj: {ID: dogID}});
    storage.events.splice(index, 1);
  },
  indexOf: function (eventObj) {
    for (var i = 0; i < this.events.length; i++) {
      var el = this.events[i];
      if (el && eventObj && el.obj.ID === eventObj.obj.ID) return i;
    }
    return -1;
  },
  load: function (serverData) {
    var sObj = JSON.parse(serverData);
    this.events = sObj.events;
  }

};

var csvData = {
  events: [],
  arrivals: [],
  depatures: [],
  daycare: [],
  SEvents: [],
  indexOf: function (eventObj, field, index) {
    for (var i = index; i < field.length; i++) {
      var el = field[i];
      if (el && eventObj && el.name === eventObj.name) return i;
    }
    return -1;
  }
};

fs.readFile('dogData.json', 'utf8', function (err, data) {
  if (err) throw err;
  var tStart = Date.now();
  try {
    storage.load(data);
    console.log(Date.now() - tStart);
  } catch (e) {
    storage.events = [];
  }
});

fs.readFile('schedule.csv', 'utf8', function (err, data) {
  if (err) throw err;
  parse(data, function (err, output) {
    if (err) throw err;
    for (var i = 0; i < output.length; i++) {
      var evt = output[i];
      var name = evt[3].replace(' leaves', '').replace(' arrives', '').replace(' arrive', '').replace(' leave', '');
      var date = evt[0];
      var time = evt[1];
      var status = evt[5].substring(1, evt[5].length - 1).toLowerCase();
      var e = {name: name, date: date, time: time, color: status, id: getNewID()};
      if (status === 'arrivals') {
        csvData.arrivals.push(e);
      } else if (status === 'departures') {
        csvData.depatures.push(e);
      } else if (status === 'daycare') {
        csvData.daycare.push(e);
      } else if (status !== 'boarding') {
        csvData.SEvents.push({text: name, date: date, time: time, color: status, id: getNewID()});
      }
    }

    for (var j = 0; j < csvData.arrivals.length; j++) {
      var el = csvData.arrivals[j];
      if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, id: el.id, cName: ' ', bookings: []});
      var pairIndex = csvData.indexOf(el, csvData.depatures, j);
      var pairEl = csvData.depatures[pairIndex];
      var eventIndex = csvData.indexOf(el, csvData.events, 0);
      if (pairEl) csvData.events[eventIndex].bookings.push({start: el.date, end: pairEl.date});
    }
    for (var q = 0; q < csvData.daycare.length; q++) {
      el = csvData.daycare[q];
      if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, id: el.id, cName: ' ', bookings: []});
      eventIndex = csvData.indexOf(el, csvData.events, 0);
      csvData.events[eventIndex].bookings.push({date: el.date});
    }
    for (var p = 0; p < csvData.SEvents.length; p++) {
      var event = csvData.events[p];
      if (event) storage.add({obj: event, type: 'Dog'});
      var sEvent = csvData.SEvents[p];
      storage.add({obj: sEvent, type: 'SEvent'});
    }
  });
});

function getNewID () {
  let id = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 8; i++) {
    id += possible[Math.round(Math.random() * (possible.length - 1))];
  }

  /*  TO-DO Fix possibility of repeated ids */
  return id;
};

server.listen(8000, function () {
  console.log('Server running on port 8000');
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
    var eventObj = JSON.parse(data);
    var index = storage.indexOf(eventObj);
    storage.push(index, eventObj);

    socket.broadcast.emit('load', JSON.stringify(storage));
  });

  // TO-DO SQL

  socket.on('remove', function (dogID) {
    storage.remove(dogID);
    io.sockets.emit('load', JSON.stringify(storage));
  });

  socket.on('disconnect', function () {
    console.log('id : ' + socket.id + ' disconnected');
  });
});
