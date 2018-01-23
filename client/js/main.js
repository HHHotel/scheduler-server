/* eslint semi: ["error", "always"] */
/* global EventHandler ServerInterface io $ */

let socket = io();
let server = new ServerInterface(socket);
let eHandler = new EventHandler(server);
$(function () {
  eHandler.attachHandlers();

  socket.on('load', function (data) {
    console.log('LOADING....');
    console.log('DATA: ' + data);
    server.load(data);
    eHandler.update();
  });
});
