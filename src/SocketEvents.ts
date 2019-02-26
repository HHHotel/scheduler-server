import {Server, Socket} from "socket.io";

export function applyHandlers(socket: Socket, io: Server, permissions: number, database) {
  generalHandlers(socket, permissions, io, database);
  dogHandlers(socket, permissions, io, database);
  userHandlers(socket, permissions, io, database);
}

function generalHandlers(socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, "load", (date, callback) => {
    database.getWeek(date, callback);
  }, permissions, 0);
}

function dogHandlers(socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, "add_dog", (event) => {
    database.addDog(event, () => {
      io.sockets.emit("update");
    });
  }, permissions, 5);

  handleEvent(socket, "add_event", (event) => {
    database.addEvent(event, () => {
      io.sockets.emit("update");
    });
  }, permissions, 5);

  handleEvent(socket, "find", (searchText, callback) => {
    const result = [];
    database.find(searchText, callback);
  }, permissions, 0);

  handleEvent(socket, "remove_event", (id, callback) => {
    database.removeEvent(id, callback);
    io.sockets.emit("update");
  }, permissions, 6);

  handleEvent(socket, "remove_dog", (id, callback) => {
    database.removeDog(id, callback);
    io.sockets.emit("update");
  }, permissions, 6);

  handleEvent(socket, "retrieve_dog", (id, callback) => {
    database.retrieveDog(id, callback);
  }, permissions, 5);

  handleEvent(socket, "edit_dog", (dogProfile) => {
    database.editDog(dogProfile.id, "dog_name", dogProfile.name);
    database.editDog(dogProfile.id, "client_name", dogProfile.clientName);

    for ( const booking of dogProfile.bookings ) {
      database.editEvent(booking.eventID, "event_start", booking.start);
      database.editEvent(booking.eventID, "event_end", booking.end);
    }

    io.sockets.emit("update");
  }, permissions, 6);
}

function userHandlers(socket: Socket, permissions: number, io: Server, database) {
  handleEvent(socket, "add_user", (user, callback) => {
    if (permissions < user.permissions) {
      callback("Permission Level not great enough");
    } else {
      database.addUser(user.username, user.password, user.permissionLevel,
        (result) => {
          callback(result);
        },
      );
    }

  }, permissions, 7);

  handleEvent(socket, "delete_user", (username, callback) => {
    database.deleteUser(username, (result) => { callback(result); } );
  }, permissions, 7);

  handleEvent(socket, "change_password", (user, callback) => {
    database.changePassword(user.username, user.oldPassword, user.newPassword,
      (result) => {
        callback(result);
      },
    );
  }, permissions, 0);
}

function handleEvent(socket: Socket, eventName: string, handler,  userPermissions: number, permissionLevel: number) {
  if (userPermissions >= permissionLevel) { socket.on(eventName, handler); }
}
