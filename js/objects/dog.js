/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

const Daycare = require('./daycare.js');
const Boarding = require('./boarding.js');
const SEvent = require('./sevent.js');

// eslint-disable-next-line no-unused-vars
class Dog {

  constructor () {
    let args = arguments[0];
    if (args.bookings) this.loadJSON(args); // Loading from JSON

    else if (args.name) { // Adding a new Dog
      this.name = args.name;
      this.cName = args.cName;
      this.bookings = [];
      this.ID = SEvent.getNewID();
    }
  }

  loadJSON (json) {
    this.name = json.name;
    this.cName = json.cName;
    this.ID = json.ID ? json.ID : SEvent.getNewID();
    this.bookings = [];

    for (let booking of json.bookings) {
      if (booking.start) this.addBoarding(booking.start, booking.end);
      else if (booking.date) this.addDaycare(booking.date);
    }
  }

  addBoarding (start, end) { this.bookings.push(new Boarding(start, end)); }

  addDaycare (date) { this.bookings.push(new Daycare(date)); }

  getName () { return this.name; }

  getBookings () { return this.bookings; }

  getBooking (date) {
    let filteredBookings = this.bookings.filter(booking => booking.contains(date));
    return filteredBookings[filteredBookings.length - 1];
  }

  get (date) {
    if (!this.bookings) return;

    let booking = this.getBooking(date);
    let dogStatus = booking.dateType(date);

    let text;
    if (dogStatus === 'arrivals') {
      text = '(' + booking.getStartTime() + ') ' + this.getText();
    } else if (dogStatus === 'departures') {
      text = '(' + booking.getEndTime() + ') ' + this.getText();
    } else if (dogStatus === 'daycare') {
      text = '(8:00 AM) ' + this.getText();
    } else {
      text = this.getText();
    }
    return dogStatus ? {text: text, color: dogStatus, id: this.ID} : undefined;
  }

  getText () {
    return this.name + (this.cName ? ' ' + this.cName[0] : '');
  }

  toString () {
    return this.name + ' ' + this.cname;
  }

  has (date) {
    return this.bookings.filter(booking => booking.contains(date)).length > 0;
  }

  serialize () { return JSON.stringify({obj: this, type: 'Dog'}); };

}

module.exports = Dog;
