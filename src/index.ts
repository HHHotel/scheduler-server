process.env.TZ = "GMT+0000";

import cors = require("cors");
import helmet = require("helmet");
import express = require("express");
import path = require("path");
import semver = require("semver");
import WebSocket = require("ws");
import http = require("http");

const DEFAULTS = {
    VERSION: "0.3.4", // > 0.3.3 to run currrent
};
const PORT = process.env.PORT || 8080;

const app = express();
app.disable("etag").disable("x-powered-by");
const server = http.createServer(app);
const wss = new WebSocket.Server({server});

wss.on("connection", (ws) => {
    ws.on("message", (msg) => {
        const message = JSON.parse(msg.toString());
        switch (message.name) {
        case "ping":
            ws.send(JSON.stringify({name: "pong"}));
        }
    });
});

server.listen(PORT);

app.use(helmet());
app.use(cors()); // allow cors
app.use(express.static(path.join(__dirname, "../srv"))); // serve static web frontend
import bodyParser = require("body-parser");
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
    extended: true,
}));

import HoundsDatabase from "./HHHDatabase";
const database = new HoundsDatabase(process.env.CLEARDB_DATABASE_URL);

app.use("/api", (req, res, next) => {
    if (req.headers.version && semver.gt(req.headers.version as string, DEFAULTS.VERSION)) {
        next();
    } else {
        res.writeHead(412, "Out of date version", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "API Version is incompatible"}));
    }
});

app.use("/api", async (req, res, next) => {
    try {
        const user = await database.checkToken(req.query.username, req.query.token);
        req.user = user;
        next();
    } catch (err) {
        res.writeHead(401, "Bad Token", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "Bad Token/User"}));
    }
});

app.use("/api/users", (req, res, next) => {
    if (req.user.permissions > 6) { // restrict modifying users to >6 perms
        next();
    } else {
        console.error("Unauthorized User Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "Required Permissions were not met"}));
    }
});

app.use("/api/*", (req, res, next) => {
    if (req.method !== "DELETE" || req.user.permissions > 5) { // Restrict deleting to >5 perms
        next();
    } else {
        console.log("Unauthorized DELETE Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "Required Permissions were not met"}));
    }
});

app.use("/api/events|/api/dogs", (req, res, next) => {
    if (req.user.permissions > 4) { // restrict adding/viewing dogs >4 perms
        next();
    } else {
        console.log("Unauthorized Access by", req.user.username);
        res.writeHead(401, "Insufficent privileges", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "Required Permissions were not met"}));
    }
});

/*
 * Responds to a POST request containing the username and password with the token to be used
 * in all subsequent communications with the api
 * */
app.post("/login", async (req, res) => {
    try {
        if (req.query.token) {
            console.info("Checking token... user:", req.query.username);
            const auth = await database.checkToken(req.query.username, req.query.token);
            res.json(auth);
        } else if (req.body.username && req.body.password) {
            console.info("Logging in... user:", req.body.username);
            const auth = await database.login(req.body.username, req.body.password);
            res.json(auth);
        } else {
            res.writeHead(
                400,
                "No token or login credentials provided",
                {"content-type": "text/json"},
            );
            res.end(JSON.stringify({message: "Wrong credentials"}));
        }
    } catch (err) {
        console.error(err);
        res.writeHead(403, "Bad User Password combination", {"content-type": "text/json"});
        res.end(JSON.stringify({message: "Wrong credentials"}));
    }
});

/* Include all the methods for dealing with endpoints for the API */
import applyApiEndpoints from "./ApiEndpoints";
applyApiEndpoints(app, wss, database);
