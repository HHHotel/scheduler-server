"use strict";
function applyHandlers(socket, io, permissions, database) {
    generalHandlers(socket, permissions, io, database);
    dogHandlers(socket, permissions, io, database);
    userHandlers(socket, permissions, io, database);
}
function generalHandlers(socket, permissions, io, database) {
    handleEvent(socket, 'load', function (date, callback) {
        database.getWeek(date, callback);
    }, permissions, 0);
}
function dogHandlers(socket, permissions, io, database) {
    handleEvent(socket, 'add', function (event) {
        database.add(event, function () {
            io.sockets.emit('update');
        });
    }, permissions, 5);
    handleEvent(socket, 'find', function (searchText, callback) {
        var result = [];
        database.findDogs(searchText, function (res) {
            for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
                var entry = res_1[_i];
                result.push(entry);
            }
            database.findEvents(searchText, function (res) {
                for (var _i = 0, res_2 = res; _i < res_2.length; _i++) {
                    var entry = res_2[_i];
                    result.push(entry);
                }
                callback(result);
            });
        });
    }, permissions, 0);
    handleEvent(socket, 'remove_event', function (id, callback) {
        database.removeEvent(id, callback);
        io.sockets.emit('update');
    }, permissions, 6);
    handleEvent(socket, 'remove_dog', function (id, callback) {
        database.removeDog(id, callback);
        io.sockets.emit('update');
    }, permissions, 6);
    handleEvent(socket, 'retrieve_dog', function (id, callback) {
        database.retrieveDog(id, callback);
    }, permissions, 5);
    handleEvent(socket, 'edit_dog', function (dogProfile) {
        database.editDog(dogProfile.id, 'dog_name', dogProfile.name);
        database.editDog(dogProfile.id, 'client_name', dogProfile.clientName);
        for (var _i = 0, _a = dogProfile.bookings; _i < _a.length; _i++) {
            var booking = _a[_i];
            database.editEvent(booking.eventID, 'event_start', booking.start);
            database.editEvent(booking.eventID, 'event_end', booking.end);
        }
        io.sockets.emit('update');
    }, permissions, 6);
}
function userHandlers(socket, permissions, io, database) {
    handleEvent(socket, 'add_user', function (user, callback) {
        if (permissions < user.permissions) {
            console.error('Permission Level not great enough');
            callback('Permission Level not great enough');
        }
        else {
            database.addUser(user.username, user.password, user.permissionLevel, function (result) {
                callback(result);
            });
        }
    }, permissions, 7);
    handleEvent(socket, 'delete_user', function (username, callback) {
        database.deleteUser(username, function (result) { callback(result); });
    }, permissions, 7);
    handleEvent(socket, 'change_password', function (user, callback) {
        database.changePassword(user.username, user.oldPassword, user.newPassword, function (result) {
            callback(result);
        });
    }, permissions, 0);
}
function handleEvent(socket, eventName, handler, userPermissions, permissionLevel) {
    if (userPermissions >= permissionLevel)
        socket.on(eventName, handler);
}
module.exports = applyHandlers;
