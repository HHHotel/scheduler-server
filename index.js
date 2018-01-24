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
  },

  indexOfDates: function (eventObj, field, index) {
    for (var i = index; i < field.length; i++) {
      var el = field[i];
      if (el && eventObj && el.name === eventObj.name) return i;
    }
    return -1;
  }
};

fs.readFile('dogData.json', 'utf8', function (err, data) {
  if (err) throw err;
  try {
    storage.load(data);
  } catch (e) {
    storage.events = [];
  }
});

fs.readFile('schedule_data.csv', 'utf8', function (err, data) {
  if (err) throw err;
  var events;
  parse(data, function (err, output) {
    if (err) throw err;
    events = output;
    for (var i = 0; i < events.length; i++) {
      var evt = events[i];
      var name = evt[3].replace(' leaves', '').replace(' arrives', '').replace(' arrive', '').replace(' leave', '');
      var date = evt[0];
      var time = evt[1];
      var status = evt[5].substring(1, evt[5].length - 1).toLowerCase();
      var e = {name: name, date: date, time: time, color: status};
      if (i > 21117) {
        if (status === 'arrivals') {
          csvData.arrivals.push(e);
        } else if (status === 'departures') {
          csvData.depatures.push(e);
        } else if (status === 'daycare') {
          csvData.daycare.push(e);
        }
      } else {
        csvData.SEvents.push({text: name, date: date, time: time, color: status});
      }
    }

    for (var j = 0; j < csvData.arrivals.length; j++) {
      var el = csvData.arrivals[j];
      if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, cName: ' ', bookings: []});
      var pairIndex = csvData.indexOf(el, csvData.depatures, j);
      var pairEl = csvData.depatures[pairIndex];
      var eventIndex = csvData.indexOf(el, csvData.events, 0);
      if (pairEl) csvData.events[eventIndex].bookings.push({start: el.date, end: pairEl.date});
    }
    for (var q = 0; q < csvData.daycare.length; q++) {
      el = csvData.daycare[q];
      if (csvData.indexOf(el, csvData.events, 0) < 0) csvData.events.push({name: el.name, cName: ' ', bookings: []});
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
