process.env.TZ = "GMT+0000";

import cors = require("cors");
import express = require("express");
import path = require("path");
import semver = require("semver");
import WebSocket = require("ws");
import http = require("http");

const DEFAULTS = {
    VERSION: "0.3.3", // > 0.3.3 to run currrent
};
const PORT = process.env.PORT || 8080;

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

server.listen(PORT);

// MIDDLEWARE
app.use(cors());

app.use(express.static(path.join(__dirname, "../srv")));
import bodyParser = require("body-parser");
app.use(bodyParser.json());       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true,
}));

app.use("/api", (req, res, next) => {
    if (req.headers.version && semver.gt(req.headers.version as string, DEFAULTS.VERSION)) {
        next();
    } else {
        res.writeHead(412, "Out of date version", {"content-type" : "text/plain"});
        res.end("API Version is incompatible");
    }
});

app.use("/api", (req, res, next) => {
    HHHDB.checkToken(database, req.query.username, req.query.token, (user) => {
        if (user) {
            req.user = user;
            next();
        } else {
            res.writeHead(401, "Bad Token", {"content-type" : "text/plain"});
            res.end("Bad Token/User");
        }
    });
});

app.use("/api/users", (req, res, next) => {
    if (req.user.permissions > 6) { // restrict modifying users to >6 perms
        next();
    } else {
        console.log("Unauthorized User Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

app.use("/api/*", (req, res, next) => {
    if (req.method !== "DELETE" || req.user.permissions > 5) { // Restrict deleting to >5 perms
        next();
    } else {
        console.log("Unauthorized DELETE Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

app.use("/api/events|/api/dogs", (req, res, next) => {
    if (req.user.permissions > 4) { // restrict adding/viewing dogs >4 perms
        next();
    } else {
        console.log("Unauthorized Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

// END MIDDLEWARE

import HHHDB = require("./HHHDatabase"); // Interface with all logic for database
const database = HHHDB.createDatabase(HHHDB.parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

/*
 * EXPECTS:
 * req.body = {
 *  username: string,
 *  password: string,
 * } or
 * req.body = {
 *  username: string,
 *  token: string,
 * }
 * RESPONDS:
 * {
 *  username: string,
 *  token:  number,
 *  permissions: number,
 * } or
 * Login Failed
 *
 * Responds to a POST request containing the username and password with the token to be used
 * in all subsequent communications with the api
 * */
app.post("/login", (req, res) => {
    if (req.query.token) {
        HHHDB.checkToken(database, req.query.username, req.query.token, respondToLogin);
    } else {
        HHHDB.login(database, req.body.username, req.body.password, respondToLogin);
    }

    function respondToLogin(result: any) {
        if (result) {
            if (req.body.password) {
                console.log("Logged in", req.body.username);
            }
            res.send(result);
        } else {
            res.writeHead(403, "Bad User Password combination", {"content-type" : "text/plain"});
            res.end("Wrong credentials");
        }
    }

});

/* Include all the methods for dealing with endpoints for the API */
import ApplyApiEndpoints = require("./ApiEndpoints");
ApplyApiEndpoints(app, wss, database);
