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

  get (date) { if (date.toDateString() === this.getDate().toDateString()) return {text: this.toString(), color: this.color, id: this.ID}; };

  toString () { return this.getText() + ((this.getDate().getHours() > 0) ? ' (' + this.getDate().getHours() % 12 + ':00 ' + (this.getDate().getHours() >= 12 ? 'PM)' : 'AM)') : ''); }

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
