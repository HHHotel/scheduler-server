/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

class SEvent {

  constructor (eventInfo) {
    if (eventInfo) {
      this.text = eventInfo.text;
      this.color = eventInfo.color;
      this.date = eventInfo.date;
      this.ID = eventInfo.ID ? eventInfo.ID : SEvent.getNewID();
    }
  }

  getText () { return this.text; }

  getColor () { return this.color; }

  getDate () { return new Date(this.date); }

  get (date) {
    if (date.toDateString() === this.getDate().toDateString()) {
      let text = '(' + SEvent.formatTime(this.getDate()) + ') ' + this.getText();

      return {text: text, color: this.color, id: this.ID};
    }
  }

  toString () { return this.getText(); }

  has (date) {
    return this.getDate().toDateString() === date.toDateString();
  }

  serialize () { return JSON.stringify({obj: this, type: 'SEvent'}); };

}

SEvent.getNewID = function () {
  let id = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 8; i++) {
    id += possible[Math.round(Math.random() * (possible.length - 1))];
  }

  /*  TO-DO Fix possibility of repeated ids */
  return id;
};

SEvent.formatTime = function (date) {
  let TOD = date.getHours() < 12 ? 'AM' : 'PM';

  let hours = date.getHours();
  hours = hours % 12 === 0 ? 12 : hours % 12;
  let mins = date.getMinutes();
  mins = mins >= 10 ? mins : '0' + mins;

  return hours + ':' + mins + ' ' + TOD;
};

module.exports = SEvent;
