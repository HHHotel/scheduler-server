"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
process.env.TZ = "GMT+0000";
var express = require("express");
var app = express();
var http = require("http");
var server = http.createServer(app);
var socket_io = require("socket.io");
var io = socket_io(server);
var path = require("path");
var port = process.env.PORT || 8080;
server.listen(port, function () { return console.log("Server running on port " + port); });
app.use(express.static(path.join(__dirname, "landing")));
var DBInterface = require("./HHHDatabaseInterface");
var database = new DBInterface(parseDatabaseString(process.env.CLEARDB_DATABASE_URL));
var applyHandlers = require("./SocketEvents");
io.on("connection", function (socket) {
    console.log("New connection from " + socket.request.connection.remoteAddress);
    socket.emit("connected");
    socket.on("login", function (user, callback) {
        database.login(user.username, user.password, function (result) {
            socket.emit("update");
            callback(result);
            applyHandlers(socket, io, result.permissions, database);
        });
    });
});
function parseDatabaseString(databaseUrl) {
    var dbUser = databaseUrl.substring(8, databaseUrl.indexOf(":", 8));
    var dbPass = databaseUrl.substring(databaseUrl.indexOf(":", 8) + 1, databaseUrl.indexOf("@"));
    var dbHost = databaseUrl.substring(databaseUrl.indexOf("@") + 1, databaseUrl.indexOf("/", databaseUrl.indexOf("@")));
    var dbName = databaseUrl.substring(databaseUrl.indexOf("/", databaseUrl.indexOf("@")) + 1, databaseUrl.indexOf("?"));
    return {
        database: dbName,
        host: dbHost,
        password: dbPass,
        user: dbUser,
    };
}
