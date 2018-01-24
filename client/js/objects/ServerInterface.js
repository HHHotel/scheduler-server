/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */
/* global Dog SEvent */

// eslint-disable-next-line no-unused-vars
class ServerInterface {

  constructor (sock) {
    this.events = [];
    this.lastChanged = '';
    this.socket = sock;
  }

  addEvent (eventInfo) {
    let eInfo = eventInfo.obj;
    let event = this.findEvents(eInfo.name)[0];

    if (eInfo.date) event.addDaycare(eInfo.date);
    else if (eInfo.start) event.addBooking(eInfo.start, eInfo.end);

    this.lastChanged = event;
  };

  newEvent (eventInfo) {
    let eInfo = eventInfo.obj;
    let event = eventInfo.type === 'Dog'
                ? new Dog(eInfo)
                : new SEvent(eInfo);
    this.events.push(event);
    this.lastChanged = event;
  }

  findEvents (eventText) {
    let out = [];
    for (let i = this.events.length - 1; i >= 0; i--) {
      let event = this.events[i];
      if (event.bookings && event.getText().toLowerCase().includes(eventText.toLowerCase())) {
        out.push(event);
      }
      if (out.length > 5) break;
    }
    return out;
  };

  getEventsInDay (day) {
    let output = [];
    for (let e of this.events) {
      if (e.get(day)) output.push(e.get(day));
    }
    return output;
  };

  remove (id) {
    for (let i = 0; i < this.events.length; i++) {
      let e = this.events[i];
      if (e.id === id) this.events.splice(i, 1);
    }
    this.lastChanged = this.events[this.events.length - 1];
    this.socket.emit('remove', id);
  }

  serialize () {
    return JSON.stringify(this.events);
  };

  serializeLastEvent () {
    let event = this.events[this.events.length - 1];
    return event.serialize();
  };

  load (servInfo) {
    let jsonInfo = JSON.parse(servInfo);
    this.events = [];
    if (jsonInfo.events) {
      for (let event of jsonInfo.events) {
        this.newEvent(event);
      }
    }
  };

  store () {
    this.socket.emit('store', this.lastChanged.serialize());
  }

}
