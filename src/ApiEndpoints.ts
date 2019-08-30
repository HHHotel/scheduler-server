import { Application } from "express";
import HHHDB = require("./HHHDatabase");
import * as HHH from "./HHHTypes";

function ApplyApiEndpoints(app: Application, database: HHH.Database) {
    app.get("/api/week", (req, res) => {
       HHHDB.getWeek(database, req.query.date ? new Date(req.query.date) : new Date(), (week) => {
           res.send(week);
       });
    });

    app.get("/api/dogs/:id", (req, res) => {
        HHHDB.retrieveDog(database, req.params.id, (result) => {
            res.send(result);
        });
    });

    app.post("/api/dogs", (req, res) => {
        HHHDB.addDog(database, req.body, () => {
            res.send("Added new Dog");
        });
    });

    app.put("/api/dogs", (req, res) => {
        HHHDB.editDog(database, req.body.id, "dog_name", req.body.name);
        HHHDB.editDog(database, req.body.id, "client_name", req.body.clientName);

        for (const booking of req.body.bookings ) {
            HHHDB.editEvent(database, booking.id, "event_start", booking.startDate.valueOf() + "");
            HHHDB.editEvent(database, booking.id, "event_end", booking.endDate.valueOf() + "");
        }

        res.send("Edited Dog");
    });

    app.delete("/api/dogs/:id", (req, res) => {
        HHHDB.removeDog(database, req.params.id, () => res.send("Deleted dog"));
    });

    app.delete("/api/events/:id", (req, res) => {
        HHHDB.removeEvent(database, req.params.id, () => res.send("Deleted Event"));
    });

    app.delete("/api/users/:user", (req, res) => {
        HHHDB.deleteUser(database, req.params.user);
        res.send("Deleted User");
    });

    app.get("/api/find", (req, res) => {
        HHHDB.find(database, req.query.searchText, (matches) => res.send(matches));
    });

    app.post("/api/events", (req, res) => {
        HHHDB.addEvent(database, req.body, () => res.send("Added event"));
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
