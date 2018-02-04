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
    // Prevent Duplicate event Id's from being added
    if (this.indexOf(evt.obj.ID) > 0) return;

    // Adds a new Event of the appropriate type
    if (evt.type === 'Dog') this.events.push(new Dog(evt.obj));
    else this.events.push(new SEvent(evt.obj));
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

  getWeek (sDate) {
    let date = new Date(sDate.getTime());
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
      return evt.getText().includes(text);
    });
  }

  remove (eventID) {
    this.events.splice(this.indexOf(eventID), 1);
  }

}

module.exports = EventsInterface;
