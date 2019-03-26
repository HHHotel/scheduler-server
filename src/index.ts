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

app.use(express.static(path.join(__dirname, "../landing")));

import HHHDB = require("./HHHDatabase");
const database = HHHDB.createDatabase(HHHDB.parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

import {HHHUser} from "./HHHTypes";
import {applyHandlers} from "./SocketEvents";

io.on("connection", (socket) => {

    console.log("New connection from " + socket.request.connection.remoteAddress);

    socket.emit("connected");

    socket.on("login", (user, callback) => {
        HHHDB.login(database, user.username, user.password, (result) => {
            if (!result) { return; }

            socket.emit("update");
            callback(result);
            applyHandlers(socket, io, result.permissions, database);
        });
    });

    socket.on("check_token", (user, callback) => {
        HHHDB.checkToken(database, user.username, user.token, (result: HHHUser) => {
            if (result) {
                socket.emit("update");
                applyHandlers(socket, io, result.permissions, database);
            }
            callback(result);

        });
    });

});
