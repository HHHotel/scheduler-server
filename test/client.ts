#!/usr/bin/env node

/* tslint:disable:no-console no-empty */
import readline = require("readline");
import io = require("socket.io-client");
const socket = io("http://localhost:8080");

const r1 = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

console.log("Welcome to the HHH Scheduler CLI");

let loginToken: number = null;

socket.on("connected", () => { login(); });

function login() {
  r1.question("Username: ", (username) => {
    r1.question("Password: ", (password) => {
      const user = {
        password,
        username,
      };
      socket.emit("login", user, (result) => {
        if (result.success) {
          console.log("Logged in: ", result.token);
          loginToken = result.token;
        } else {
          login();
        }
      });
      r1.close();
    });
  });
}

function prompt() {
  r1.question("-> ", (command) => {
    if (command !== "q") {
      const args = command.split(" ")[0];
      socket.emit(command, args, (result) => {console.log(result); });
      prompt();
    } else {
      socket.disconnect();
      process.exit(0);
    }
  });
}

prompt();

socket.on("disconnect", () => {
});

socket.on("update", (result) => {
  console.log(result);
});

socket.on("load", (result) => {
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
