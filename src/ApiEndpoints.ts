import { Application } from "express";
import HHHDB = require("./HHHDatabase");
import * as DB from "./HHHDBTypes";
import * as WebSocket from "ws";

function ApplyApiEndpoints(app: Application, wss: WebSocket.Server, database: DB.IDatabase) {
    app.get("/api/week", (req, res) => {
        HHHDB.getWeek(database, req.query.date ? new Date(req.query.date) : new Date(), (week) => {
           res.send(week);
       });
    });

    app.get("/api/dogs/:id", (req, res) => {
        HHHDB.retrieveDog(database, req.params.id, (result) => {
            if (!result) {
                res.writeHead(404, "Not Found", {"content-type" : "text/json"});
                res.end("No dog with that id");
            } else {
                res.send(result);
            }

        });
    });

    app.post("/api/dogs", (req, res) => {
        HHHDB.addDog(database, req.body, () => {
            res.send("Added new Dog");
            wss.clients.forEach((client) => client.send("load"));
        });
    });

    app.put("/api/dogs", (req, res) => {
        HHHDB.editDog(database, req.body.id, "dog_name", req.body.name);
        HHHDB.editDog(database, req.body.id, "client_name", req.body.clientName);

        for (const booking of req.body.bookings ) {
            HHHDB.editEvent(database, booking.id, "event_start", booking.startDate.valueOf() + "");
            HHHDB.editEvent(database, booking.id, "event_end", booking.endDate.valueOf() + "");
        }

        wss.clients.forEach((client) => client.send("load"));
        res.send("Edited Dog");
    });

    /*
     * DELETE /api/dogs/\d\+?option=[force|reactivate]
     *
     * Deactivates a dog from showing up on the schedule
     * remove with option=force CAN'T BE UNDONE
     * undo default with option=reactivate
     * */
    app.delete("/api/dogs/:id", (req, res) => {
        if (req.query.option === "force") {
            HHHDB.removeDog(database, req.params.id, () => endRequest("Deleted dog"));
        } else if (req.query.option === "reactivate") {
            HHHDB.reactivateDog(database, req.params.id, () => endRequest("Reactivated dog"));
        } else {
            HHHDB.deactivateDog(database, req.params.id, () => endRequest("Deactivated dog"));
        }

        /* TODO make something like this for global messages */
        function endRequest(msg) {
            res.send(msg);
            wss.clients.forEach((client) => client.send("load"));
        }
    });

    app.delete("/api/events/:id", (req, res) => {
        HHHDB.removeEvent(database, req.params.id, () => {
            res.send("Deleted Event");
            wss.clients.forEach((client) => client.send("load"));
        });
    });

    app.delete("/api/users/:user", (req, res) => {
        HHHDB.deleteUser(database, req.params.user);
        res.send("Deleted User");
    });

    app.get("/api/find", (req, res) => {
        HHHDB.find(database, req.query.searchText, (matches) => res.send(matches));
    });

    app.post("/api/events", (req, res) => {
        if (!req.body.id) { req.body.id = "0"; }
        HHHDB.addEvent(database, req.body, () => {
            res.send("Added event");
            wss.clients.forEach((client) => client.send("load"));
        });
    });

    app.post("/api/users", (req, res) => {
        if (req.user.permissions > req.body.permissions) {
            HHHDB.addUser(database, req.body.username, req.body.password, req.body.permissions,
                          () => {
                              res.send("Added new User");
                          });
        } else {
            res.send("Insufficent Permissions");
        }
    });

    app.put("/api/user/password", (req, res) => {
        HHHDB.changePassword(database, req.user.username, req.body.oldPassword,
                             req.body.newPassword, (result) => res.send(result));
    });
}

export = ApplyApiEndpoints;
