/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

// eslint-disable-next-line no-unused-vars
class Daycare {

  constructor (date) {
    this.date = date.replace(/-/g, '/');
  }

  getDate () { return new Date(this.date); }
  toString () { return this.date; }
  toDateString () { return this.getDate().toDateString(); }

  dayType (date) {
    if (date.toDateString() === this.getDate().toDateString()) return 'daycare';
  }

}
