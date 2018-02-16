/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Boarding {

  constructor (sDate, eDate) {
    this.start = sDate;
    this.end = eDate;
  }

  getStart () { return new Date(this.start); }
  getEnd () { return new Date(this.end); }
  toDateString () { return new Date(this.start).toDateString() + ' - ' + new Date(this.end).toDateString(); }

  getStartTime () {
    return Boarding.formatTime(this.getStart());
  }

  getEndTime () {
    return Boarding.formatTime(this.getEnd());
  }

  contains (date) {
    let d = new Date(date.getTime());
    let sTime = new Date(d.toDateString()).getTime();
    let eTime = d.setHours(23);
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

Boarding.formatTime = function (date) {
  let TOD = date.getHours() < 12 ? 'AM' : 'PM';

  let hours = date.getHours();
  hours = hours % 12 === 0 ? 12 : hours;
  let mins = date.getMinutes();
  mins = mins >= 10 ? mins : '0' + mins;

  return hours + ':' + mins + ' ' + TOD;
};

module.exports = Boarding;
