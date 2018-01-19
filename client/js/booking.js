/* eslint semi: ["error", "always"] */

function Booking (sDate, eDate) {
  this.start = sDate.replace(/-/g, '/');
  this.end = eDate.replace(/-/g, '/');
}

Booking.prototype.getStart = function () { return new Date(this.start); };
Booking.prototype.getEnd = function () { return new Date(this.end); };
Booking.prototype.toString = function () { return new Date(this.start).toDateString() + ' - ' + new Date(this.end).toDateString(); };

/* TO-DO This is a quick and dirty way of obtaining the days of the stay it
still needs a better implementation */

// Booking.prototype.getPrice = function () {
//   let delMonths = this.start.getMonth() - this.end.getMonth();
//   let delDay = this.end.getDate() - this.start.getDate();
//   return this.rate * (delMonths * 30 + delDay);
// };
