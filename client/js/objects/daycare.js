/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Daycare {

  constructor (date) {
    this.date = date;
  }

  getDate () { return new Date(this.date); }
  toString () { return this.date; }

  dayType (date) {
    if (date.toDateString() === this.getDate().toDateString()) return 'daycare';
  }

}
