/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

const SEvent = require('./sevent.js');
const Dog = require('./dog.js');

// eslint-disable-next-line no-unused-vars
class EventsInterface {

  constructor () {

    if (arguments[0]) this.load(arguments[0]);

    else this.events = [];

  }

  addEvent (evt) {

    // Adds a new Event of the appropriate type
    if (evt.type === 'Dog') this.events.push(new Dog(evt.obj));

    else this.events.push(new SEvent(evt.obj));

  }

  addBooking (id, booking) {

    let index = this.indexOf(id);

    if (booking.type === 'boarding') this.events[index].addBoarding(booking.data);

    else if (booking.type === 'daycare') this.events[index].addDaycare(booking.data);

  }

  load (json) {

    this.events = [];

    const parsedJson = JSON.parse(json);

    try {

      for (let evt of parsedJson.events) {

        this.addEvent(evt);

      }
    } catch (e) {

      console.log('Error loading data to cache: ' + e.message);

    }

  }

  getWeek (date) {

    let sDate = EventsInterface.getWeekStart(date);
    let week = [];

    for (let i = 0; i < 7; i++) {

      date.setDate(sDate.getDate() + i);
      week.push(this.getInDay(date));

    }

    return week;

  }

  getInDay (date) {

    let eventsInDay = this.events.filter(function (evt) {

      return evt.has(date);

    });

    return eventsInDay.map(function (evt) {

      return evt.get(date);

    });

  }

  indexOf (eventID) {

    return this.events.findIndex(function (evt) {

      return evt.ID === eventID;

    });

  }

  findAll (text) {

    return this.events.filter(function (evt) {

      return evt.toString().includes(text);

    });

  }

  remove (eventID) {

    this.events.splice(this.indexOf(eventID), 1);

  }

  serialize () {
    let evts = '{"events": [';

    for (let evt of this.events) {
      evts += evt.serialize() + ',';

    }

    evts = evts.substring(0, evts.length - 1) + ']}';
    return evts;
  }

}

EventsInterface.getWeekStart = function (date) {

  let sDate;

  const currentDate = date;

  sDate = new Date(currentDate.toDateString());
  sDate.setDate(currentDate.getDate() - currentDate.getDay());

  return sDate;

};

module.exports = EventsInterface;
