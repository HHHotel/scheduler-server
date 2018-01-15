/* eslint semi: ["error", "always"] */
/* global Info Booking */

function Dog (dogName) {
  this.name = dogName;
  this.status = 'boarding';
  this.info = new Info();
  this.bookings = [];
  this.ID = Dog.getNewID();
}

// ------------- Setters ------------------//
Dog.prototype.addBooking = function (start, end) {
  this.bookings.push(new Booking(start, end));
};

// ------------- Getters ------------------//
Dog.prototype.getName = function () { return this.name; };
// Dog.prototype.getClient = function () { return this.clientName; };
Dog.prototype.getInfo = function () { return this.info; };
Dog.prototype.getStatus = function () { return this.status; };
Dog.prototype.getLastBooking = function () { return this.bookings[this.bookings.length - 1]; };
Dog.prototype.getBookings = function () { return this.bookings; };

Dog.getNewID = function () {
  let id = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 8; i++) {
    id += possible[Math.round(Math.random() * (possible.length - 1))];
  }

  /*

HEY DUMMY YOU'RE TOO LAZY TO DO THIS PROPER SO YOU PUT THIS POS IMPLEMENTATION
IN. PLS FIX WHEN YOU GET OFF YOUR ASS AND LEARN SQL AND NODE

   */

  return id;

  // YA THIS SHIT
};
