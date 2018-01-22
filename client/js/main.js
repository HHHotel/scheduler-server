/* eslint semi: ["error", "always"] */
/* global EventHandler ServerInterface io */

let socket = io();
let server = new ServerInterface(socket);
let eHandler = new EventHandler(server);
eHandler.attachHandlers();

socket.on('load', function (data) {
  server.load(data);
  eHandler.update();
});
