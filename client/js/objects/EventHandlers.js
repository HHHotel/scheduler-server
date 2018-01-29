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
    // Declare the possible week days
    let weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thurday', 'Friday', 'Saturday'];
    // Update the title bar
    $('#dates').text(this.week.toString());
    // Query the dog list elements from the document to append dogs
    const days = document.querySelectorAll('.dog-list');

    // Iterate over the dog lists
    for (let i = 0; i < days.length; i++) {
      // Set the title to a week day name
      let dayTitle = days[i].previousElementSibling;
      dayTitle.textContent = weekDays[this.week.getDay(i).getDay()] + ' ' + this.week.getDay(i).getDate();

      // Clear all the dogs in the current list
      clearChildren($(days[i]));

      // Ask the server for the evnts in the current day
      let eventsInDay = this.server.getEventsInDay(this.week.getDay(i));

      // Iterate over the events in the current day
      for (let event of eventsInDay) {
        // If the event exists
        if (event) {
          // Delcare a new html element with the event text
          let e = $('<div></div>').text(event.text);

          // Set the class name of the new el to the events color
          $(e).addClass(event.color);

          // Add the event's id to the html el
          $(e).attr('id', event.id);

          // Apeend the created el to the current day
          $(days[i]).append($(e));
        }
      }
    }
  }

  attachHandlers () {
    let self = this;

    // Advance One week
    $('#right').click(function () {
      // Set the current week object to the next Week
      self.week.nextWeek();
      // Update the dates and days on the html doc
      self.update();
    });

    // Decrement One week
    $('#left').click(function () {
      // Set the current week object to the previous week
      self.week.prevWeek();
      // Update the dates and days on the html doc
      self.update();
    });

    // Menu animation
    $('.scheduler').click(function (e) {
      // If the click on the app is on cover
      if (e.target.id === 'cover') {
        closeMenu();
      } else if (e.target.id === 'hb-menu') { // Open menu if the click is on the menu icon
        openMenu();
      }
    });

    // Search week menu option
    $('#week-jmp').click(function () {
      closeMenu();
      // Show the page cover and date search input
      $('#cover').show();
      $('.date-search').show();
    });

    $('#dog-search').click(function () {
      closeMenu();
      // Clear any remaining events in the result list
      clearChildren($('.results-list'));

      // Show the page cover and event search input
      $('#cover').show();
      $('.dog-search').show();
    });

    $('.date-search input').keypress(function (e) {
      // Listen for ENTER key event
      if (e.keyCode === 13) {
        // Advance week to the input value
        self.week = new Week(new Date(this.value));

        // Clear the value update the app and close
        this.value = '';
        self.update();
        closeMenu();
      }
    });

    $('.dog-search input').keypress(function (e) {
      // Listen for ENTER
      if (e.keyCode === 13) {
        // Store the input value
        let dogName = this.value;
        this.value = '';

        // Clear the results
        clearChildren($('.results-list'));

        // Ask the server for events with specified name
        let resDogs = self.server.findEvents(dogName);

        // Iterate over the response
        for (let dog of resDogs) {
          // Add each dog to the result list
          appendDog(dog);
        }

        // Update the app
        self.update();
      }
    });

    // Find and add an event listener to the butttons inside of the result list
    $('.results-list').on('click', '.result-event button', function () {
      // Get the event result who is the parent of the button
      let $event = $(this).parent();

      // Tell the server to remove the event with the specified ID
      self.server.remove($event.attr('id'));

      // Remove the entry from the result list
      $(this).parent().remove();

      // Update the app
      self.update();
    });

    // Add an event listener to all close buttons on the forms
    $('.close-add-dog').each(function () {
      this.addEventListener('click', function () {
        // Fade all event forms out of view
        $('#add-dog').fadeOut();
        $('#add-new-dog').fadeOut();
        $('#add-new-event').fadeOut();
      });
    });

    // Declare a variable to save the angle of rotation
    let angle = 0;
    $('.add-button').click(function () {
      // Toggle the event type list from view
      $('.add-list').toggle();
      // Call the animation function to rotate the add button
      // 135 deg to toggle from 45 deg rotated and straight up while adding an overspin
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

    // Event Form List click listener
    $('.add-list').click(function (e) {
      // Declare target el
      let target = e.target;

      if (target.id === 'new-dog') { // If new dog event show
        $('#add-new-dog').fadeIn();
      } else if (target.id === 'new-booking') { // elif existing dog event show
        $('#add-dog').fadeIn();
      } else if (target.id === 'other-event') { // elif other type of event show
        $('#add-new-event').fadeIn();
      }
    });

    $('#add-new-event').submit(function (e) {
      // Prevent the default form submit behavior
      e.preventDefault();
      // Parse the form as an Event
      self.server.newEvent(parseEventField($(this)));

      // Reset the form and hide it
      // Update the app and store the event to the server
      formOnSubmit($(this));
    });

    $('#add-new-dog').submit(function (e) {
      e.preventDefault();
      // Parse the form as a Dog
      self.server.addEvent(parseDogField($(this)));
      formOnSubmit($(this));
    });

    // Add Event on submit function
    $('#add-dog').submit(function (e) {
      e.preventDefault();
      // Parse the form as a Dog
      self.server.addEvent(parseDogField($(this)));
      formOnSubmit($(this));
    });

    // Reset the form and hide it
    // Update the app and store the event to the server
    function formOnSubmit ($form) {
      $form.trigger('reset');
      $form.hide();
      self.update();
      self.server.store();
    }

    // Swap to adding a daycare booking
    $('.daycare-button').click(function () {
      // Reset the form
      $('#add-dog').trigger('reset');
      // Hide boarding inputs
      $('.boarding-dates').hide();
      // Show the daycare inputs
      $('.daycare-date').show();
    });

    // Swap to boarding booking
    $('.boarding-button').click(function () {
      $('#add-dog').trigger('reset');
      // Show the boarding inputs hide the daycare ones
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
  // Obtain an object from the form
  let result = parseForm($object);

  // Append the time fields onto both the start date and end date
  result.start += result.timeStart;
  result.end += result.timeEnd;

  // Return the result as a server object with type of Dog
  return {obj: result, type: 'Dog'};
}

function parseEventField ($object) {
  // Obtain an object from the form
  let result = parseForm($object);

  // Append the time to the date field
  result.date += ' ' + result.time + ' PST';

  // Set the color to general
  result.type = 'general';

  // return the result as a server object
  return {obj: result, type: 'SEvent'};
}

function parseForm ($object) {
  // Declare the Json string to write form data
  let result = '{';
  // Find inputs who's values are not undefined
  $object.find('select[value!=""], input[value!=""]').each(function () {
    // Iterate over each item adding the name of input with the value to
    // the JSON string
    result += '"' + $(this).attr('name') + '":"' + $(this).val() + '",';
  });

  // Remove the ending comma from the JSON string and add an ending brace
  result = result.slice(0, result.length - 1) + '}';

  // Parse the JSON string into an object and return it
  return JSON.parse(result);
}
