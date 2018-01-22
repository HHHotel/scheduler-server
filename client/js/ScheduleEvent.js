/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

class ScheduleEvent {

  constructor (text, type) {
    this.text = text;
    this.type = type;
    this.ID = ScheduleEvent.getNewID();
  }

  getText () { return this.text; };

  getType () { return this.type; };

  get () { return {text: this.text, color: this.type}; };

  serialize () { return JSON.stringify(this); };

}

ScheduleEvent.getNewID = function () {
  let id = '';
  let possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  for (var i = 0; i < 8; i++) {
    id += possible[Math.round(Math.random() * (possible.length - 1))];
  }

  /*  TO-DO Fix possibility of repeated ids */
  return id;
};
