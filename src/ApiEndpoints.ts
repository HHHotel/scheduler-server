// eslint-disable-next-line
import {Application} from "express";
// eslint-disable-next-line
import HoundsDatabase from "./HHHDatabase";
import * as WebSocket from "ws";

/**
 * Sends a message to all connected Websockets
 * @param {string} name of event to send
 * @param {WebSocket.Server} wss
 * @param {any?} data
 * */
function websocketBroadcast(name: string, wss: WebSocket.Server, data?: any) {
    wss.clients.forEach( (client) => {
        if (client.readyState !== WebSocket.OPEN) {
            return;
        }

        if (!data) {
            client.send(JSON.stringify({name}));
        } else {
            client.send(JSON.stringify({name, data}));
        }
    });
}

/**
 * @param {Application} app Expressjs application to apply endpoint behavior to
 * @param {WebSocket.Server} wss WebSocket server to send messages on
 * @param {HoundsDatabase} database
 * */
function applyApiEndpoints(app: Application, wss: WebSocket.Server, database: HoundsDatabase) {
    app.get("/api/week", async (req, res) => {
        const d = req.query.date ? new Date(req.query.date) : new Date();
        try {
            res.send(await database.getWeek(d));
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error retrieving the requested week", error: err}));
        }
    });

    app.get("/api/dogs/:id", async (req, res) => {
        try {
            const dog = await database.retrieveDog(req.params.id);
            res.send(dog);
        } catch (err) {
            res.writeHead(404, "Not Found", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "No dog with that id"}));
        }
    });

    app.post("/api/dogs", async (req, res) => {
        try {
            database.addDog(req.body);
            res.send("Added new Dog");
            websocketBroadcast("load", wss);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error adding dog", error: err}));
        }
    });

    app.put("/api/dogs", async (req, res) => {
        try {
            database.editDog(req.body.id, "dog_name", req.body.name);
            database.editDog(req.body.id, "client_name", req.body.clientName);

            const handles = [];
            for (const booking of req.body.bookings ) {
                handles.concat(
                    database.editEvent(booking.id, "event_start", booking.startDate.valueOf()),
                    database.editEvent(booking.id, "event_end", booking.endDate.valueOf()),
                );
            }

            await Promise.all(handles);
            websocketBroadcast("load", wss);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error adding Dog", error: err}));
        }
    });

    /*
     * DELETE /api/dogs/\d\+?option=[force|reactivate]
     *
     * Deactivates a dog from showing up on the schedule
     * remove with option=force CAN'T BE UNDONE
     * undo default with option=reactivate
     * */
    app.delete("/api/dogs/:id", async (req, res) => {
        try {
            switch (req.query.option.toLowerCase()) {
            case "force":
                await database.removeDog(req.params.id);
                res.send({message: "Deleted dog"});
            case "reactivate":
                await database.reactivateDog(req.params.id);
                res.send({message: "Reactivated dog"});
            default:
                await database.deactivateDog(req.params.id);
                res.send({message: "Deactivated dog"});
            }
            websocketBroadcast("load", wss);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error altering dog records", error: err}));
        }
    });

    app.delete("/api/events/:id", async (req, res) => {
        try {
            await database.removeEvent(req.params.id);
            res.send({message: "Deleted Event"});
            websocketBroadcast("load", wss);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error removing event", error: err}));
        }
    });

    app.delete("/api/users/:user", async (req, res) => {
        try {
            await database.deleteUser(req.params.user);
            res.send("Deleted User");
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error removing user", error: err}));
        }
    });

    app.get("/api/find", async (req, res) => {
        try {
            const matches = await database.find(req.query.searchText);
            res.send(matches);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error adding dog", error: err}));
        }
    });

    app.post("/api/events", async (req, res) => {
        try {
            await database.addEvent(req.body);
            res.send("Added event");
            websocketBroadcast("load", wss);
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error adding dog", error: err}));
        }
    });

    app.post("/api/users", async (req, res) => {
        if (req.user.permissions < req.body.permissions) {
            res.writeHead(412, "Permissions not great enough", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Insufficent permissions"}));
            return;
        }
        try {
            await database.addUser(req.body);
            res.send("Added new User");
        } catch (err) {
            console.error(err);
            res.writeHead(500, "Server Error", {"content-type": "text/json"});
            res.end(JSON.stringify({message: "Error adding user", error: err}));
        }
    });

    app.put("/api/user/password", async (req, res) => {
        try {
            await database.changePassword(
                req.user.username,
                req.body.oldPassword,
                req.body.newPassword,
            );
            res.send({message: "Changed password"});
        } catch (err) {
            res.end(JSON.stringify({message: "Can't change password", error: err}));
        }
    });
}

export default applyApiEndpoints;
