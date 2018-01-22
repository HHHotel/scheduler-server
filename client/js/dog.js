/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */
/* global ScheduleEvent Booking */

class Dog extends ScheduleEvent {

  constructor (dName) {
    super(dName, 'Dog');
    this.name = dName;
    this.bookings = [];
  }

  addBooking (start, end) {
    this.bookings.push(new Booking(start, end));
  };

  getName () { return this.name; };
  // Dog.prototype.getClient = function () { return this.clientName; };
  getLastBooking () { return this.bookings[this.bookings.length - 1]; };
  getBookings () { return this.bookings; };

  get (date) {
    let dogStatus = this.getLastBooking().dayType(date);
    if (dogStatus === 'arriving') {
      this.text = this.name + ' (' + this.getLastBooking().getStartTime() + ')';
    } else if (dogStatus === 'departing') {
      this.text = this.name + ' (' + this.getLastBooking().getEndTime() + ')';
    } else {
      this.text = this.name;
    }
    return dogStatus ? {text: this.text, color: dogStatus} : undefined;
  }

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
