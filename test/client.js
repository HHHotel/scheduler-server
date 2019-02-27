#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var fs = require("fs");
var os = require("os");
var path = require("path");
var io = require("socket.io-client");
var socket = io("http://localhost:8080");
console.log("Welcome to the HHH Scheduler CLI");
socket.on("connected", function () { login(); });
var Settings;
var args = process.argv;
function login() {
    var data = fs.readFileSync(path.join(os.homedir(), ".hhhsched/settings.json"));
    Settings = JSON.parse(data.toString("utf-8"));
    socket.emit("check_token", Settings.user, function (result) {
        if (result.success) {
            console.log("Logged in...");
            console.log();
            main();
        }
    });
}
socket.on("disconnect", function () {
    console.log("Disconneced! Quitting");
    process.exit(0);
});
function main() {
    socket.emit(args[2], args[3] ? args[3] : new Date(), function (result) {
        print(result);
        process.exit(0);
    });
}
function print(events) {
    events.forEach(function (event) {
        if (event.dogName) {
            var booking = event;
            console.log(booking.dogName, booking.clientName);
        }
        else {
            console.log(event.text);
        }
        console.log("  ", new Date(event.startDate.toString()).toDateString(), " - ", new Date(event.endDate.toString()).toDateString());
        console.log();
    });
}
/* COMMAND LIST
 * add
 * find
 * remove_event
 * remove_dog
 * retrieve_dog
 * edit_dog
 * add_user
 * delete_user
 * change_password
 */
