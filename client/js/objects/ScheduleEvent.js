/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */

class SEvent {

  constructor (text, type) {
    this.text = text;
    this.color = type;
    this.ID = SEvent.getNewID();
  }

  getText () { return this.text; };

  getColor () { return this.color; };

  get () { return {text: this.text, color: this.color}; };

  serialize () { return JSON.stringify(this); };

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
