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

    event.ID = eInfo.ID ? eInfo.ID : event.ID;
    this.events.push(event);
    this.lastChanged = event;
  }

  findEvents (eventText) {
    let out = [];
    for (let event of this.events) {
      if (event.getText().toLowerCase().includes(eventText.toLowerCase())) {
        out.push(event);
      }
    }
    return out;
  };

  getEventsInDay (day) {
    let output = [];
    for (let e of this.events) {
      output.push(e.get(day));
    }
    return output;
  };

  serialize () {
    return JSON.stringify(this.events);
  };

  serializeLastEvent () {
    let event = this.events[this.events.length - 1];
    return event.serialize();
  };

  load (servInfo) {
    let jsonInfo = JSON.parse(servInfo);
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
