/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Booking {

  constructor (sDate, eDate) {
    this.start = sDate.replace(/-/g, '/');
    this.end = eDate.replace(/-/g, '/');
  }

  getStart () { return new Date(this.start); }
  getEnd () { return new Date(this.end); }
  toDateString () { return new Date(this.start).toDateString() + ' - ' + new Date(this.end).toDateString(); }

  getStartTime () {
    return this.getStart().getHours() < 12 ? '8:00 AM' : '4:00 PM';
  }

  getEndTime () {
    return this.getEnd().getHours() < 12 ? '8:00 AM' : '4:00 PM';
  }

  dayType (date) {
    let d = new Date(date.getTime());
    let sTime = d.setHours(0);
    let eTime = d.setHours(24);
    if (!(eTime > this.getStart().getTime() && sTime <= this.getEnd().getTime())) return;

    if (this.getStart().toDateString() === date.toDateString()) {
      return 'arrivals';
    } else if (this.getEnd().toDateString() === date.toDateString()) {
      return 'departures';
    } else {
      return 'boarding';
    }
  }

  /* TO-DO This is a quick and dirty way of obtaining the days of the stay it
  still needs a better implementation */

  // getPrice () {
  //   let delMonths = this.start.getMonth() - this.end.getMonth();
  //   let delDay = this.end.getDate() - this.start.getDate();
  //   return this.rate * (delMonths * 30 + delDay);
  // }

}
