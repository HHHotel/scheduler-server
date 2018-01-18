/* eslint semi: ["error", "always"] */

function Booking (sDate, eDate) {
  this.start = sDate.replace(/-/g, '/');
  this.end = eDate.replace(/-/g, '/');
}

Booking.prototype.getStart = function () { return new Date(this.start); };
Booking.prototype.getEnd = function () { return new Date(this.end); };
Booking.prototype.toString = function () { return new Date(this.start) + ' - ' + new Date(this.end); };

Booking.prototype.getStartTime = function () {
  return this.getStart().getHours() < 12 ? '8:00 AM' : '4:00 PM';
};

Booking.prototype.getEndTime = function () {
  return this.getEnd().getHours() < 12 ? '8:00 AM' : '4:00 PM';
};

Booking.prototype.dayType = function (date) {
  if (!(date.getTime() > this.getStart().getTime() && date.getTime() < this.getEnd().getTime())) return;

  if (this.getStart().toDateString() === date.toDateString()) {
    return 'arriving';
  } else if (this.getEnd().toDateString() === date.toDateString()) {
    return 'departing';
  } else {
    return 'boarding';
  }
};

/* TO-DO This is a quick and dirty way of obtaining the days of the stay it
still needs a better implementation */

// Booking.prototype.getPrice = function () {
//   let delMonths = this.start.getMonth() - this.end.getMonth();
//   let delDay = this.end.getDate() - this.start.getDate();
//   return this.rate * (delMonths * 30 + delDay);
// };
