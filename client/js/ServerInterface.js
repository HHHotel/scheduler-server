/* eslint semi: ["error", "always"] */
/* global Dog ScheduleEvent */

function ServerInterface () {
  this.events = [];
}

ServerInterface.prototype.addEvent = function (eInfo) {
  let eventInfo = JSON.parse(eInfo);
  let event = eventInfo[0] === 'dog' ? new Dog(eventInfo.name) : new ScheduleEvent(eventInfo.text, eventInfo.type);
  event.ID = eventInfo.ID ? eventInfo.ID : event.ID;
  this.events.push(event);
};

ServerInterface.prototype.findEvents = function (eventText) {
  let out = [];
  for (let event of this.events) {
    if (event.getText().toLowerCase().includes(eventText.toLowerCase())) {
      out.push(event);
    }
  }
  return out;
};

ServerInterface.prototype.getEventsInDay = function (day) {
  let output = [];
  for (let e of this.events) {
    output.push(e.get(day));
  }
  return output;
};

ServerInterface.prototype.serialize = function () {
  let storageString = '';
  this.events.forEach(function (event) {
    storageString += event.serialize() + '\n';
  });
  return storageString;
};

ServerInterface.prototype.serializeLastEvent = function () {
  let event = this.events[this.events.length - 1];
  return event.serialize();
};

ServerInterface.prototype.load = function (servInfo) {
  let jsonInfo = JSON.parse(servInfo);
  this.events = jsonInfo.events;
};
