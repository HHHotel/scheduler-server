/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */
/* global Booking SEvent */

// eslint-disable-next-line no-unused-vars
class Dog {

  constructor () {
    let args = arguments[0];
    if (args.bookings) {
      this.name = args.name;
      this.bookings = [];
      for (let booking of args.bookings) {
        this.addBooking(booking.start, booking.end);
      }
      this.ID = args.ID;
    } else if (args.start) {
      this.name = args.name;
      this.bookings = [new Booking(args.start, args.end)];
      this.ID = SEvent.getNewID();
    } else {
      this.name = args;
      this.bookings = [];
      this.ID = SEvent.getNewID();
    }

  }

  addBooking (start, end) { this.bookings.push(new Booking(start, end)); }

  getName () { return this.name; }
  // Dog.prototype.getClient = function () { return this.clientName; };
  getLastBooking () { return this.bookings[this.bookings.length - 1]; }
  getBookings () { return this.bookings; }

  get (date) {
    let dogStatus = this.getLastBooking().dayType(date);
    let text = '';
    if (dogStatus === 'arriving') {
      text = this.name + ' (' + this.getLastBooking().getStartTime() + ')';
    } else if (dogStatus === 'departing') {
      text = this.name + ' (' + this.getLastBooking().getEndTime() + ')';
    } else {
      text = this.name;
    }
    return dogStatus ? {text: text, color: dogStatus, id: this.ID} : undefined;
  }

  getText () { return this.name; }

  serialize () { return JSON.stringify({obj: this, type: 'Dog'}); };

}

// function Dog (dogName) {
//   this.name = dogName;
//   this.status = 'boarding';
//   this.bookings = [];
//   this.ID = Dog.getNewID();
// }
//
// // ------------- Setters ------------------//
// Dog.prototype.addBooking = function (start, end) {
//   this.bookings.push(new Booking(start, end));
// };
//
// // ------------- Getters ------------------//
// Dog.prototype.getName = function () { return this.name; };
// // Dog.prototype.getClient = function () { return this.clientName; };
// Dog.prototype.getStatus = function () { return this.status; };
// Dog.prototype.getLastBooking = function () { return this.bookings[this.bookings.length - 1]; };
// Dog.prototype.getBookings = function () { return this.bookings; };
//
// Dog.prototype.toString = function (date) {
//   let dogStatus = this.getLastBooking().dayType(date);
//   if (dogStatus === 'arriving') {
//     return this.name + ' (' + this.getLastBooking().getStartTime() + ')';
//   } else if (dogStatus === 'departing') {
//     return this.name + ' (' + this.getLastBooking().getEndTime() + ')';
//   } else {
//     return this.name;
//   }
// };
//
// Dog.getNewID = function () {
//   let id = '';
//   let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
//   for (var i = 0; i < 8; i++) {
//     id += possible[Math.round(Math.random() * (possible.length - 1))];
//   }
//
//   /*  TO-DO Fix possibility of repeated ids */
//   return id;
// };
