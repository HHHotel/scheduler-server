process.env.TZ = "GMT+0000";

import express = require("express");
const app = express();
import http = require("http");
const server = http.createServer(app);
import socket_io = require("socket.io");
const io = socket_io(server);

import path = require("path");
const port = process.env.PORT || 8080;

server.listen(port, () => console.log("Server running on port " + port) );

app.use(express.static(path.join(__dirname, "landing")));

import DBInterface = require("./HHHDatabaseInterface");
const database = new DBInterface(parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

import {applyHandlers} from "./SocketEvents";

io.on("connection", (socket) => {

  console.log("New connection from " + socket.request.connection.remoteAddress);

  socket.emit("connected");

  socket.on("login", (user, callback) => {
    database.login(user.username, user.password, (result) => {
      socket.emit("update");
      callback(result);
      applyHandlers(socket, io, result.permissions, database);
    });
  });

  socket.on("check_token", (user, callback) => {
    database.getToken(user.username, (result) => {
      if (parseInt(result.token, 10) === user.token) {
        socket.emit("update");
        applyHandlers(socket, io, result.permissions, database);
      }
      callback(result);
    });
  });

});

function parseDatabaseString(databaseUrl) {
  const dbUser = databaseUrl.substring(8, databaseUrl.indexOf(":", 8));
  const dbPass = databaseUrl.substring(databaseUrl.indexOf(":", 8) + 1, databaseUrl.indexOf("@"));
  const dbHost = databaseUrl.substring(databaseUrl.indexOf("@") + 1,
    databaseUrl.indexOf("/", databaseUrl.indexOf("@")));
  const dbName = databaseUrl.substring(databaseUrl.indexOf("/",
    databaseUrl.indexOf("@")) + 1, databaseUrl.indexOf("?"));

  return {
    database: dbName,
    host: dbHost,
    password: dbPass,
    user: dbUser,
  };

}
