/* eslint semi: ["error", "always"] */
/* global $ Week ServerInterface io */

let server = new ServerInterface();

// On load Functions
$(function () {
  let week = new Week(Date.now());
  let socket = io();

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
    $('.dog-search').hide();
    $('#cover').hide();
  }

  // Search button
  $('#week-jmp').click(function () {
    closeMenu();
    $('#cover').show();
    $('.date-search').show();
  });

  $('#dog-search').click(function () {
    closeMenu();
    clearChildren($('.results-list'));
    $('#cover').show();
    $('.dog-search').show();
  });

  $('.date-search input').keypress(function (e) {
    if (e.keyCode === 13) {
      week = new Week(new Date(this.value));
      this.value = '';
      update();
      closeMenu();
    }
  });

  $('.dog-search input').keypress(function (e) {
    if (e.keyCode === 13) {
      let dogName = this.value;
      this.value = '';
      clearChildren($('.results-list'));
      let resDogs = server.findDog(dogName);
      for (let dog of resDogs) {
        appendDog(dog);
      }
      update();
    }
  });

  function clearChildren ($list) {
    $list.children().each(function () {
      $(this).remove();
    });
  }

  function appendDog (dog) {
    let $dogList = $('.results-list');
    let $dog = $('<div>', {'class': 'result-dog', 'id': dog.ID});
    $dog.html('<h2>' + dog.getName() + '</h2>' + dog.getLastBooking().toString());
    $dogList.append($dog);
  }

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
    server.addEvent(parseField($(this)));
    $('#add-dog').trigger('reset');
    $('#add-dog').hide();
    $('#cover').hide();
    update();
    store();
  });

  // Recive Data from form
  function parseField ($object) {
    var result = {};
    $object.find('select[value!=""], input[value!=""]').each(function () {
      if ($(this).attr('type') === 'date') {
        result.start = $(this).val() + ' PST';
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
    const days = document.querySelectorAll('.dog-list');
    for (let i = 0; i < days.length; i++) {
      let dayTitle = days[i].previousElementSibling;
      dayTitle.textContent = weekDays[week.getDay(i).getDay()] + ' ' + week.getDay(i).getDate();
      clearChildren($(days[i]));

      let dogsInDay = server.getDogsInDay(week.getDay(i));

      for (let d of dogsInDay) {
        let dog = document.createElement('div');
        dog.innerHTML = d.dog.toString(week.getDay(i));
        dog.className = d.status;
        dog.id = d.dog.ID;
        days[i].append(dog);
      }
    }
  }

  function store () {
    socket.emit('store', server.serializeLastDog());
  }

  // Clears Server object
  function clearDogs () {
    server = new ServerInterface();
    update();
  }
});
