#!/usr/bin/env node

/* tslint:disable:no-console no-empty */

import fs = require("fs");
import os = require("os");
import path = require("path");
import readline = require("readline");
import io = require("socket.io-client");
import {HHHBooking, HHHDog, HHHEvent} from "../src/HHHTypes";
const socket = io("http://localhost:8080");

// console.log("Welcome to the HHH Scheduler CLI");

socket.on("connected", () => { login(); });
let Settings;
const args = process.argv;

function login() {

        const data: Buffer = fs.readFileSync(path.join(os.homedir(), ".hhhscheduler/settings.json"));
        Settings = JSON.parse(data.toString("utf-8"));

        socket.emit("check_token", Settings.user, (result) => {
                if (result) {
                        console.log("Logged in...");
                        console.log();
                        main();
                }
        });
}

socket.on("disconnect", () => {
        console.log("Disconneced! Quitting");
        process.exit(0);
});

function main() {
        socket.emit(args[2], args[3] ? args[3] : new Date(), (result) => {
                print(result);
                process.exit(0);
        });
}

function print(events) {

        events.forEach((event: HHHEvent) => {
                if ((event as HHHBooking).dogName) {
                        const booking: HHHBooking = event as HHHBooking;
                        console.log(booking.dogName, booking.clientName);
                } else {
                        console.log(event.text);
                }

                console.log("  ",
                        new Date(event.startDate.toString()).toDateString(),
                        " - ",
                        new Date(event.endDate.toString()).toDateString());
                console.log();
        });

}
