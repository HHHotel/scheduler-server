/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Daycare {

  constructor (date) {
    this.date = date;
  }

  getDate () { return new Date(this.date); }
  toString () { return this.date; }
  toDateString () { return this.getDate().toDateString(); }

  contains (date) { return date.toDateString() === this.getDate().toDateString(); }

  dateType (date) {
    if (this.contains(date)) return 'daycare';
  }

}

module.exports = Daycare;
