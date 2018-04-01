/* eslint no-console: off */

function handleSocket(socket, clients) {

  console.log('New connection id : ' + socket.id);

  socket.user = {

    date: new Date(),
    ID: socket.id

  };

  clients.push(socket);
  clients.update();

  socket.on('week.change', function (data) {

    socket.user.date = new Date(data);
    clients.update();

  });
 
  socket.on('//events.new', function (data, ack) {

    try {

      //events.addEvent(data);
      ack('Added ' + data);
      console.log('Added new event ' + JSON.stringify(data));

      clients.update();

    } catch (e) {

      ack('Error adding event: ' + e.message);

    }

  });

  socket.on('//events.new.booking', function (data, ack) {

    try {

      let id = data.id;
      let booking = {
        start: data.start,
        end: data.end,
        date: data.date
      };

      //events.addBooking(id, booking);
      clients.update();
      ack('Added booking to id: ' + id);
      console.log('Added Booking: ');
      console.log(booking);

    } catch (e) {

      ack('Error Adding booking: ' + e.message);

    }

  });

  socket.on('//events.find', function () {

    let resEvents = //events.findAll(eventText);
    socket.emit('//events.find.response', resEvents);

  });

  socket.on('//events.remove', function (evtID, ack) {

    try {

      //events.remove(evtID);
      ack('Removed id: ' + evtID);

      console.log('Removed id: ' + evtID);

      clients.update();

    } catch (e) {

      ack('Error removing: ' + e.message);

    }

  });

  socket.on('disconnect', function () {

    console.log('id : ' + socket.id + ' disconnected');
    clients.remove(socket.id);

  });

}

module.exports = handleSocket;