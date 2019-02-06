/* eslint no-console: off */
import {Socket, Server} from 'socket.io';

function applyHandlers(socket: Socket, io: Server, permissions: number, database) {
  generalHandlers(socket, permissions, io, database);
  dogHandlers(socket, permissions, io, database);
  userHandlers(socket, permissions, io, database);
}

function generalHandlers (socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, 'load', function(date, callback) {
    database.getWeek(date, callback);
  }, permissions, 0);
}

function dogHandlers (socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, 'add', function (event) {
    database.add(event, function () {
      io.sockets.emit('update');
    });
  }, permissions, 5);

  handleEvent(socket, 'find', function (searchText, callback) {
    let result = [];
    database.findDogs(searchText, function (res) {
      for (let entry of res) result.push(entry);
      database.findEvents(searchText, function (res) {
      for (let entry of res) result.push(entry);
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

    for ( let booking of dogProfile.bookings ) {
      database.editEvent(booking.eventID, 'event_start', booking.start);
      database.editEvent(booking.eventID, 'event_end', booking.end);
    }

    io.sockets.emit('update');
  }, permissions, 6);
}

function userHandlers (socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, 'add_user', function (user, callback) {
    if (permissions < user.permissions) {
      console.error('Permission Level not great enough');
      callback('Permission Level not great enough');
    } else {
      database.addUser(user.username, user.password, user.permissionLevel,
        function (result) {
          callback(result);
        }
      );
    }

  }, permissions, 7);

  handleEvent(socket, 'delete_user', function (username, callback) {
    database.deleteUser(username, function (result) { callback(result); } );
  }, permissions, 7);

  handleEvent(socket, 'change_password', function (user, callback) {
    database.changePassword(user.username, user.oldPassword, user.newPassword,
      function(result) {
        callback(result);
      }
    );
  }, permissions, 0);
}

function handleEvent (socket: Socket, eventName: string, handler,  userPermissions: number, permissionLevel: number) {
  if (userPermissions >= permissionLevel) socket.on(eventName, handler);
}

export = applyHandlers;
