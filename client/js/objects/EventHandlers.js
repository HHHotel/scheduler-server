/* eslint semi: ["error", "always"] */
/* eslint padded-blocks: ["error", { "classes": "always" }] */
/* global $ Week */

// On load Functions
// eslint-disable-next-line no-unused-vars
class EventHandler {

  constructor (serv) {
    this.server = serv;
    this.week = new Week(Date.now());
  }

  update () {
    let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday'];
    $('#dates').text(this.week.toString());
    const days = document.querySelectorAll('.dog-list');
    for (let i = 0; i < days.length; i++) {
      let dayTitle = days[i].previousElementSibling;
      dayTitle.textContent = weekDays[this.week.getDay(i).getDay()] + ' ' + this.week.getDay(i).getDate();
      clearChildren($(days[i]));

      let eventsInDay = this.server.getEventsInDay(this.week.getDay(i));

      for (let event of eventsInDay) {
        if (event) {
          let e = $('<div></div>').text(event.text);
          $(e).addClass(event.color);
          $(e).attr('id', event.id);
          $(days[i]).append($(e));
        }
      }
    }
  }

  attachHandlers () {
    let self = this;

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

    // Advance One week
    $('#right').click(function () {
      self.week.nextWeek();
      self.update();
    });

    // Decrement One week
    $('#left').click(function () {
      self.week.prevWeek();
      self.update();
    });

    // Menu animation
    $('.scheduler').click(function (e) {
      if (e.target.id === 'cover') {
        closeMenu();
      } else if (e.target.id === 'hb-menu') {
        openMenu();
      }
    });

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
        self.week = new Week(new Date(this.value));
        this.value = '';
        self.update();
        closeMenu();
      }
    });

    $('.dog-search input').keypress(function (e) {
      if (e.keyCode === 13) {
        let dogName = this.value;
        this.value = '';
        clearChildren($('.results-list'));
        let resDogs = self.server.findEvents(dogName);
        for (let dog of resDogs) {
          appendDog(dog);
        }
        self.update();
      }
    });

    $('.results-list').on('click', '.result-event button', function () {
      let $event = $(this).parent();
      self.server.remove($event.attr('id'));
      self.update();
    });

    $('.close-add-dog').each(function () {
      this.addEventListener('click', function () {
        $('#add-dog').fadeOut();
        $('#add-new-dog').fadeOut();
        $('#add-new-event').fadeOut();
      });
    });

    let angle = 0;
    $('.add-button').click(function () {
      $('.add-list').toggle();
      animateRotate(angle += 135);
    });

    function animateRotate (angle) {
      // caching the object for performance reasons
      var $elem = $('.add-button > svg');

      // we use a pseudo object for the animation
      // (starts from `0` to `angle`), you can name it as you want
      $({deg: 0}).animate({deg: angle}, {
        duration: 200,
        step: function (now) {
          // in the step-callback (that is fired each step of the animation),
          // you can use the `now` paramter which contains the current
          // animation-position (`0` up to `angle`)
          $elem.css({
            transform: 'rotate(' + now + 'deg)'
          });
        }
      });
    }

    $('.add-list').click(function (e) {
      let target = e.target;

      if (target.id === 'new-dog') {
        $('#add-new-dog').fadeIn();
      } else if (target.id === 'new-booking') {
        $('#add-dog').fadeIn();
      } else if (target.id === 'other-event') {
        $('#add-new-event').fadeIn();
      }
    });

    $('#add-new-event').submit(function (e) {
      e.preventDefault();
      self.server.newEvent(parseEventField($(this)));
      $('#add-new-event').trigger('reset');
      $('#add-new-event').hide();
      self.update();
      self.server.store();
    });

    $('#add-new-dog').submit(function (e) {
      e.preventDefault();
      self.server.newEvent(parseDogField($(this)));
      $('#add-new-dog').trigger('reset');
      $('#add-new-dog').hide();
      self.update();
      self.server.store();
    });

    // Add Event on submit function
    $('#add-dog').submit(function (e) {
      e.preventDefault();
      self.server.addEvent(parseDogField($(this)));
      $('#add-dog').trigger('reset');
      $('#add-dog').hide();
      self.update();
      self.server.store();
    });

    $('.daycare-button').click(function () {
      $('#add-dog').trigger('reset');
      $('.boarding-dates').hide();
      $('.daycare-date').show();
    });

    $('.boarding-button').click(function () {
      $('#add-dog').trigger('reset');
      $('.boarding-dates').show();
      $('.daycare-date').hide();
    });
  }

}

function openMenu () {
  let offset = 300;
  $('.scheduler').animate({left: offset}, 250);
  $('.toolbar').animate({left: offset}, 250);
  $('.side-menu').animate({left: 0}, 250);
  $('#cover').show();
}

function clearChildren ($list) {
  $list.children().each(function () {
    $(this).remove();
  });
}

function appendDog (dog) {
  let $dogList = $('.results-list');
  let $dog = $('<div>', {'class': 'result-event', 'id': dog.ID});
  $dog.html('<h2>' + dog.getText() + '</h2>' + (dog.getDate() ? dog.getDate().toDateString() : ''));
  $dog.append('<button style = "width: 30%; height: 100%; float: right;">Remove</button>');
  $dogList.append($dog);
}

function closeMenu () {
  let offset = 300;
  $('.scheduler').animate({left: 0}, 250);
  $('.toolbar').animate({left: 0}, 250);
  $('.side-menu').animate({left: -1 * offset}, 250);
  $('.date-search').hide();
  $('.dog-search').hide();
  $('#cover').hide();
}

// Recive Data from form
// To-Do change to a different parsing functions
function parseDogField ($object) {
  var result = '{';
  $object.find('select[value!=""], input[value!=""]').each(function () {
    result += '"' + $(this).attr('name') + '":"' + $(this).val() + '",';
  });
  result = result.slice(0, result.length - 1) + '}';
  result = JSON.parse(result);
  result.start += result.timeStart;
  result.end += result.timeEnd;
  return {obj: result, type: 'Dog'};
}

function parseEventField ($object) {
  var result = '{';
  $object.find('select[value!=""], input[value!=""]').each(function () {
    result += '"' + $(this).attr('name') + '":"' + $(this).val() + '",';
  });
  result = result.slice(0, result.length - 1) + '}';
  result = JSON.parse(result);
  result.date += ' ' + result.time + ' PST';
  result.type = 'general';
  return {obj: result, type: 'event'};
}
