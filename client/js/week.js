/* eslint semi: ["error", "always"] */

function Week () {
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

Week.prototype.getDay = function (i) { return this.days[i]; };
Week.prototype.getFirst = function () { return this.days[0]; };
Week.prototype.getLast = function () { return this.days[this.days.length - 1]; };
Week.prototype.nextWeek = function () {
  let dates = Week.getStartEnd(this.getFirst().getTime() + 604800000);
  this.initWeek(dates[0], dates[1]);
};
Week.prototype.prevWeek = function () {
  let dates = Week.getStartEnd(this.getFirst().getTime() - 604800000);
  this.initWeek(dates[0], dates[1]);
};

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

Week.prototype.initWeek = function (sDate, eDate) {
  this.days = [];
  for (let i = 0; i < 7; i++) {
    let d = new Date(sDate.toString());
    d.setDate(sDate.getDate() + i);
    this.days.push(d);
  }
};

// Week.prototype.toString = function () {
//   const months = ['January', 'February',
//     'March', 'April', 'May', 'June',
//     'July', 'August', 'September', 'October',
//     'November', 'December'];
//   let dStart = this.days[0].getDate();
//   let dEnd = this.days[this.days.length - 1].getDate();
//   let year = this.days[0].getFullYear();
//   if (this.days[0].getMonth() === this.days[this.days.length - 1].getMonth()) {
//     let month = months[this.days[this.days.length - 1].getMonth()];
//     return month + ' ' + dStart + '-' + dEnd + ', ' + year;
//   } else {
//     let mStart = this.getFirst().getMonth() + 1;
//     let mEnd = this.getLast().getMonth() + 1;
//     return mStart + '/' + dStart + ' - ' + mEnd + '/' + dEnd + ', ' + year;
//   }
// };

Week.prototype.toString = function () {
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
};
