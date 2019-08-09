process.env.TZ = "GMT+0000";

import express = require("express");
const app = express();
import http = require("http");
const server = http.createServer(app);

import path = require("path");
const port = process.env.PORT || 8080;

server.listen(port, () => console.log("Server running on port " + port) );

app.use(express.static(path.join(__dirname, "../landing")));
import bodyParser = require("body-parser");
app.use(bodyParser.json());       // to support JSON-encoded bodies

app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
    extended: true,
}));

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

app.use("/api/users", (req, res, next) => { // Limit permissions for changing users
    if (req.user.permissions > 6) {
        next();
    } else {
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

app.use("/api/*/delete", (req, res, next) => {
    if (req.user.permissions > 5) {
        next();
    } else {
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

app.use("/api/events|/api/dogs", (req, res, next) => {
    if (req.user.permissions > 4) {
        next();
    } else {
        res.writeHead(401, "Insufficent privileges", {"content-type" : "text/plain"});
        res.end("Required Permissions were not met");
    }
});

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
    if (req.body.token) {
        HHHDB.checkToken(database, req.body.username, req.body.token, respondToLogin);
    } else {
        HHHDB.login(database, req.body.username, req.body.password, respondToLogin);
    }

    function respondToLogin(result) {
        if (result) {
            res.send(result);
        } else {
            res.writeHead(403, "Bad User Password combination", {"content-type" : "text/plain"});
            res.end("Wrong credentials");
        }
    }

});

/* Include all the methods for dealing with endpoints for the API */
import ApplyApiEndpoints = require("./ApiEndpoints");
ApplyApiEndpoints(app, database);
