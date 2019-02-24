#!/usr/bin/env node
"use strict";
exports.__esModule = true;
var readline = require("readline");
var io = require("socket.io-client");
var socket = io("http://localhost:8080");
var r1 = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});
console.log("Welcome to the HHH Scheduler CLI");
var loginToken = null;
socket.on("connected", function () { login(); });
function login() {
    r1.question("Username: ", function (username) {
        r1.question("Password: ", function (password) {
            var user = {
                password: password,
                username: username
            };
            socket.emit("login", user, function (result) {
                if (result.success) {
                    console.log("Logged in: ", result.token);
                    loginToken = result.token;
                }
                else {
                    login();
                }
            });
            r1.close();
        });
    });
}
function prompt() {
    r1.question("-> ", function (command) {
        if (command !== "q") {
            var args = command.split(" ")[0];
            socket.emit(command, args, function (result) { console.log(result); });
            prompt();
        }
        else {
            socket.disconnect();
            process.exit(0);
        }
    });
}
prompt();
socket.on("disconnect", function () {
});
socket.on("update", function (result) {
    console.log(result);
});
socket.on("load", function (result) {
    console.log(result);
});
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
