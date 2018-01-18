/* eslint semi: ["error", "always"] */
/* global $ Week Server io */
/* eslint-disable no-unused-vars */

// On load Functions
$(function () {
  let week = new Week(Date.now());
  let socket = io();
  let server = new Server();

  socket.on('load', function (data) {
    clearDogs();
    server.load(data);
    update();
  });

  update();

  // Toggle Full Screen
  $('#title').click(function toggleFullScreen () {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen = docEl.requestFullscreen || docEl.mozRequestFullScreen || docEl.webkitRequestFullScreen || docEl.msRequestFullscreen;
    var cancelFullScreen = doc.exitFullscreen || doc.mozCancelFullScreen || doc.webkitExitFullscreen || doc.msExitFullscreen;

    if (!doc.fullscreenElement && !doc.mozFullScreenElement && !doc.webkitFullscreenElement && !doc.msFullscreenElement) {
      requestFullScreen.call(docEl);
    } else {
      cancelFullScreen.call(doc);
    }
  });

  // Delete Dogs Function
  $('.week').click(function (e) {
    let target = e.target;
    if (target.id) {
      socket.emit('remove', target.id);
      update();
    }
  });

  // Advance One week
  $('#right').click(function () {
    week.nextWeek();
    update();
  });

  // Decrement One week
  $('#left').click(function () {
    week.prevWeek();
    update();
  });

  let offset = 300;

  // Menu animation
  $('.scheduler').click(function (e) {
    if (e.target.id === 'cover') {
      closeMenu();
    } else if (e.target.id === 'hb-menu') {
      openMenu();
    }
  });

  function openMenu () {
    $('.scheduler').animate({left: offset}, 250);
    $('.toolbar').animate({left: offset}, 250);
    $('.side-menu').animate({left: 0}, 250);
    $('#cover').show();
  }

  function closeMenu () {
    $('.scheduler').animate({left: 0}, 250);
    $('.toolbar').animate({left: 0}, 250);
    $('.side-menu').animate({left: -1 * offset}, 250);
    $('.date-search').hide();
    $('#cover').hide();
  }

  // Search button
  $('#week-jmp').click(function () {
    closeMenu();
    $('#cover').show();
    $('.date-search').show();
  });

  $('.date-search input').keypress(function (e) {
    if (e.keyCode === 13) {
      week = new Week(new Date(this.value));
      this.value = '';
      update();
      closeMenu();
    }
  });

  // Add Button
  $('#add-button').click(function () {
    $('#add-dog').fadeIn();
  });

  // Exit Dog form
  $('#close-add-dog').click(function () {
    $('#add-dog').fadeOut();
  });

  // Add Dog on submit function
  $('form').submit(function (e) {
    e.preventDefault();
    server.addDog(parseField($(this)));
    $('#add-dog').trigger('reset');
    $('#add-dog').hide();
    $('#cover').hide();
    update();
    store();
  });

  // Recive Data from form
  function parseField ($object) {
    var result = [];
    $object.find('select[value!=""], input[value!=""]').each(function () {
      if ($(this).attr('type') === 'date') {
        result.push($(this).val() + ' PST');
      } else if ($(this).attr('type') === 'radio' && $(this).prop('checked')) {
        result[result.length - 1] += $(this).val();
      } else if ($(this).attr('type') !== 'radio') {
        result.push($(this).val());
      }
    });
    return result;
  }

  // Update the data displayed
  function update () {
    let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday'];
    $('#dates').text(week.toString());
    const days = document.querySelectorAll('.dogList');
    for (let i = 0; i < days.length; i++) {
      let dayTitle = days[i].previousElementSibling;
      dayTitle.textContent = weekDays[week.getDay(i).getDay()] + ' \n ' + week.getDay(i).getDate();
      while (days[i].firstChild) {
        days[i].removeChild(days[i].firstChild);
      }

      let dogsInDay = server.getDogsInDay(week.getDay(i));

      dogsInDay.forEach(function (d) {
        let dog = document.createElement('div');
        dog.innerHTML = d.dog.toString(week.getDay(i));
        dog.className = d.status;
        dog.id = d.dog.ID;
        days[i].append(dog);
      });
    }
  }

  function store () {
    socket.emit('store', server.serializeLastDog());
  }

  // Clears localStorage and Server object
  function clearDogs () {
    server = new Server();
    update();
  }
});
