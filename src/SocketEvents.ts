import {Server, Socket} from "socket.io";
import {Database,
    HHHBooking, HHHDog, HHHEvent,
    HHHSQLDog, HHHSQLEvent, HHHSQLUser,
    HHHUser, SchedulerEvent} from "./HHHTypes";

import HHHDB = require("./HHHDatabase");

export function applyHandlers(socket: Socket, io: Server, permissions: number, db: Database) {
    generalHandlers(socket, permissions, io, db);
    dogHandlers(socket, permissions, io, db);
    userHandlers(socket, permissions, io, db);
}

function generalHandlers(socket: Socket, permissions: number, io: Server, db: Database) {
    handleEvent(socket, "load", (date, callback) => {
        HHHDB.getWeek(db, date, callback);
    }, permissions, 0);
}

function dogHandlers(socket: Socket, permissions: number, io: Server, db) {

    handleEvent(socket, "add_dog", (event) => {
        HHHDB.addDog(db, event, () => { io.sockets.emit("update"); });
    }, permissions, 5);

    handleEvent(socket, "add_event", (event) => {
        HHHDB.addEvent(db, event, () => { io.sockets.emit("update"); });
    }, permissions, 5);

    handleEvent(socket, "find", (searchText, callback) => {
        HHHDB.find(db, searchText, callback);
    }, permissions, 0);

    handleEvent(socket, "remove_event", (id, callback) => {
        HHHDB.removeEvent(db, id, () => { io.sockets.emit("update"); });
    }, permissions, 6);

    handleEvent(socket, "remove_dog", (id, callback) => {
        HHHDB.removeDog(db, id, () => { io.sockets.emit("update"); });
    }, permissions, 6);

    handleEvent(socket, "retrieve_dog", (id, callback) => {
        HHHDB.retrieveDog(db, id, callback);
    }, permissions, 5);

    handleEvent(socket, "edit_dog", (dogProfile: HHHDog) => {
        HHHDB.editDog(db, dogProfile.id, "dog_name", dogProfile.name);
        HHHDB.editDog(db, dogProfile.id, "client_name", dogProfile.clientName);

        for (const booking of dogProfile.bookings ) {
            HHHDB.editEvent(db, booking.id, "event_start", booking.startDate.valueOf() + "");
            HHHDB.editEvent(db, booking.id, "event_end", booking.endDate.valueOf() + "");
        }

        io.sockets.emit("update");
    }, permissions, 6);
}

function userHandlers(socket: Socket, permissions: number, io: Server, db) {

    handleEvent(socket, "add_user", (user, callback) => {
        if (permissions < user.permissions) {
            callback("Permission Level not great enough");
        } else {
            HHHDB.addUser(db, user.username, user.password, user.permissionLevel, () => callback("Success"));
        }

    }, permissions, 7);

    handleEvent(socket, "delete_user", (username, callback) => {
        HHHDB.deleteUser(db, username);
    }, permissions, 7);

    handleEvent(socket, "change_password", (user, callback) => {
        HHHDB.changePassword(db, user.username, user.oldPassword, user.newPassword,
            (result) => { if (result) { callback(result); } });
    }, permissions, 0);
}

function handleEvent(socket: Socket, eventName: string, handler,  userPermissions: number, permissionLevel: number) {
    if (userPermissions >= permissionLevel) { socket.on(eventName, handler); }
}
