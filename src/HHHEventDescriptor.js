"use strict";
exports.__esModule = true;
var HHHEventDescriptor = /** @class */ (function () {
    function HHHEventDescriptor(eventDescriptor) {
        this.startDate = parseInt(eventDescriptor.event_start, 10);
        this.endDate = parseInt(eventDescriptor.event_end, 10);
        this.id = eventDescriptor.id;
        this.eventId = eventDescriptor.event_id;
        this.eventText = eventDescriptor.event_text;
        this.eventType = eventDescriptor.event_type;
        this.dogName = eventDescriptor.dog_name;
        this.clientName = eventDescriptor.client_name;
    }
    HHHEventDescriptor.prototype.getHHHEvent = function () {
        var event = {
            endDate: new Date(this.endDate),
            id: this.eventId,
            startDate: new Date(this.startDate),
            text: this.eventText,
            type: this.eventType
        };
        if (this.dogName) {
            event.dogId = this.id;
            event.dogName = this.dogName;
            event.clientName = this.clientName;
        }
        return event;
    };
    return HHHEventDescriptor;
}());
exports.HHHEventDescriptor = HHHEventDescriptor;
