/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */
/* global Booking SEvent Daycare */

// eslint-disable-next-line no-unused-vars
class Dog {

  constructor () {
    let args = arguments[0];
    if (args.bookings) { // Loading from JSON

      this.name = args.name;
      this.cName = args.cName;
      this.ID = args.ID ? args.ID : SEvent.getNewID();
      this.bookings = [];

      for (let booking of args.bookings) {
        if (booking.start) this.addBooking(booking.start, booking.end);
        else if (booking.date) this.addDaycare(booking.date);
      }

    } else if (args.name) { // Adding a new Dog
      this.name = args.name;
      this.cName = args.cName;
      this.bookings = [];
      this.ID = SEvent.getNewID();
    }
  }

  addBooking (start, end) { this.bookings.push(new Booking(start, end)); }
  addDaycare (date) { this.bookings.push(new Daycare(date)); }

  getName () { return this.name; }
  // Dog.prototype.getClient = function () { return this.clientName; };
  getLastBooking () { return this.bookings[this.bookings.length - 1]; }
  getDate () { return this.getLastBooking(); }
  getBookings () { return this.bookings; }

  get (date) {
    if (!this.getLastBooking()) return;
    let dogStatus = this.getLastBooking(date).dayType(date);
    let text = '';
    if (dogStatus === 'arriving') {
      text = this.getText() + ' (' + this.getLastBooking().getStartTime() + ')';
    } else if (dogStatus === 'departing') {
      text = this.getText() + ' (' + this.getLastBooking().getEndTime() + ')';
    } else if (dogStatus === 'daycare') {
      text = this.getText() + ' (8:00 AM)';
    } else {
      text = this.getText();
    }
    return dogStatus ? {text: text, color: dogStatus, id: this.ID} : undefined;
  }

  getText () {
    return this.name + (this.cName ? ' ' + this.cName[0] : '');
  }

  serialize () { return JSON.stringify({obj: this, type: 'Dog'}); };

}
