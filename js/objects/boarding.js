/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Boarding {

  constructor (sDate, eDate) {
    this.start = sDate.replace(/-/g, '/');
    this.end = eDate.replace(/-/g, '/');
  }

  getStart () { return new Date(this.start); }
  getEnd () { return new Date(this.end); }
  toDateString () { return new Date(this.start).toDateString() + ' - ' + new Date(this.end).toDateString(); }

  getStartTime () {
    let hours = this.getStart().getHours();
    return Boarding.formatTime(hours);
  }

  getEndTime () {
    let hours = this.getEnd().getHours();
    return Boarding.formatTime(hours);
  }

  contains (date) {
    let d = new Date(date.getTime());
    let sTime = d.setHours(0);
    let eTime = d.setHours(24);
    return eTime > this.getStart().getTime() && sTime <= this.getEnd().getTime();
  }

  dateType (date) {

    if (!this.contains(date)) return;

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

Boarding.formatTime = function (hours) {
  hours = hours % 12 === 0 ? 12 : hours % 12;
  hours += hours > 12 ? ' PM' : ' AM';
  return hours;
};

module.exports = Boarding;
