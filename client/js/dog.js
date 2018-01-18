/* eslint semi: ["error", "always"] */
/* global Booking */

function Dog (dogName) {
  this.name = dogName;
  this.status = 'boarding';
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
Dog.prototype.getStatus = function () { return this.status; };
Dog.prototype.getLastBooking = function () { return this.bookings[this.bookings.length - 1]; };
Dog.prototype.getBookings = function () { return this.bookings; };

Dog.prototype.toString = function (date) {
  let dogStatus = this.getLastBooking().dayType(date);
  if (dogStatus === 'arriving') {
    return this.name + ' (' + this.getLastBooking().getStartTime() + ')';
  } else if (dogStatus === 'departing') {
    return this.name + ' (' + this.getLastBooking().getEndTime() + ')';
  } else {
    return this.name;
  }
};

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
