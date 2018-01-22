/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

class Week {

  constructor () {
    let sDate;
    let eDate;
    if (arguments.length === 2) {
      sDate = arguments[0];
      eDate = arguments[1];
    } else if (arguments.length === 1) {
      let startEnd = Week.getStartEnd(arguments[0]);
      sDate = startEnd[0];
      eDate = startEnd[1];
    }
    this.initWeek(sDate, eDate);
  }

  getDay (i) { return this.days[i]; }
  getFirst () { return this.days[0]; }
  getLast () { return this.days[this.days.length - 1]; }
  nextWeek () {
    let dates = Week.getStartEnd(this.getFirst().getTime() + 604800000);
    this.initWeek(dates[0], dates[1]);
  }
  prevWeek () {
    let dates = Week.getStartEnd(this.getFirst().getTime() - 604800000);
    this.initWeek(dates[0], dates[1]);
  }

  initWeek (sDate, eDate) {
    this.days = [];
    for (let i = 0; i < 7; i++) {
      let d = new Date(sDate.toString());
      d.setDate(sDate.getDate() + i);
      this.days.push(d);
    }
  }

  toString () {
    const months = ['January', 'February',
      'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October',
      'November', 'December'];
    let year = this.days[0].getFullYear();
    if (this.days[0].getMonth() === this.days[this.days.length - 1].getMonth()) {
      let month = months[this.days[this.days.length - 1].getMonth()];
      return month + ' ' + year;
    } else {
      let mStart = months[this.getFirst().getMonth()].slice(0, 3);
      let mEnd = months[this.getLast().getMonth()].slice(0, 3);
      return mStart + ' - ' + mEnd + ' ' + year;
    }
  }

}

Week.getStartEnd = function () {
  let sDate;
  let eDate;
  const currentDate = new Date(arguments[0]);
  sDate = new Date(currentDate.toString());
  sDate.setDate(currentDate.getDate() - currentDate.getDay());
  eDate = new Date(currentDate.toString());
  eDate.setDate(currentDate.getDate() + (6 - currentDate.getDay()));
  return [sDate, eDate];
};
