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

var fs = require('fs');
var parse = require('csv-parse');

fs.readFile('../data/scheduledatacopy.csv', 'utf8', function (err, data) {
  if (err) throw err;
  parse(data, function (err, output) {
    if (err) throw err;
    for (var i = 0; i < output.length; i++) {
      var evt = output[i];
      var name = evt[3].replace(' leaves', '').replace(' arrives', '').replace(' arrive', '').replace(' leave', '');
      var date = evt[0];
      var time = evt[1];
      var status = evt[5].substring(1, evt[5].length - 1).toLowerCase();
      var e = {name: name, date: date, time: time, color: status, id: -1};
      if (status === 'arrivals') {
        csvData.arrivals.push(e);
      } else if (status === 'departures') {
        csvData.depatures.push(e);
      } else if (status === 'daycare') {
        csvData.daycare.push(e);
      } else if (status !== 'boarding') {
        csvData.SEvents.push({text: name, date: date, time: time, color: status, id: -1});
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

    fs.writeFile('../data/scheduledata.json', JSON.stringify(csvData), function (err) {
      if (err) throw err;
      console.log('done');
    });
  });
});
