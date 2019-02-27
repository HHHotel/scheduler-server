"use strict";
exports.__esModule = true;
var HHHDog = /** @class */ (function () {
    function HHHDog(record) {
        this.name = record.dog_name;
        this.clientName = record.client_name;
        this.id = record.id;
        this.bookings = [];
    }
    HHHDog.prototype.addBooking = function (booking) {
        this.bookings.push(booking);
    };
    return HHHDog;
}());
exports.HHHDog = HHHDog;
