/* eslint semi: ["error", "always"] */
/* global Dog */

function Server () {
  this.dogs = [];
}

Server.prototype.addDog = function (dogInfo) {
  let dog;
  dog = new Dog(dogInfo[0]);
  dog.addBooking(dogInfo[1], dogInfo[2]);
  dog.ID = dogInfo[3] ? dogInfo[3] : dog.ID;
  this.dogs.push(dog);
};

Server.prototype.getDogsInDay = function (day) {
  let output = [];
  this.dogs.forEach(function (d) {
    if (day.toDateString() === d.getLastBooking().getStart().toDateString()) {
      output.push({dog: d, color: 'arrive'});
    } else if (day.toDateString() === d.getLastBooking().getEnd().toDateString()) {
      output.push({dog: d, color: 'depart'});
    } else if (day.getTime() < d.getLastBooking().getEnd().getTime() && day.getTime() > d.getLastBooking().getStart().getTime()) {
      output.push({dog: d, color: d.getStatus()});
    }
  });
  return output;
};

Server.prototype.serialize = function () {
  let storageString = '';
  this.dogs.forEach(function (dog) {
    let dogString = '!#' + dog.getName() + '##' +
    dog.getLastBooking().getStart().toLocaleString() + '##' +
    dog.getLastBooking().getEnd().toLocaleString() + '##' + dog.ID + '#!';

    storageString += !storageString.includes(dogString) ? dogString : '';
  });
  return storageString;
};

Server.prototype.serializeLastDog = function () {
  let dog = this.dogs[this.dogs.length - 1];
  let dogString = '!#' + dog.getName() + '##' +
  dog.getLastBooking().getStart().toLocaleString() + '##' +
  dog.getLastBooking().getEnd().toLocaleString() + '##' + dog.ID + '#!';
  return dogString;
};

Server.prototype.load = function (servInfo) {
  if (servInfo.indexOf('!#') === 0) {
    servInfo = servInfo.slice(2);
    let info = [];
    while (servInfo.includes('#')) {
      let indexOne = 0;
      let indexTwo = servInfo.indexOf('##');
      let endIndex = servInfo.indexOf('#!');
      if (indexTwo < endIndex && indexTwo > 0) {
        info.push(servInfo.slice(indexOne, indexTwo));
        servInfo = servInfo.slice(indexTwo + 2);
      } else {
        info.push(servInfo.slice(indexOne, endIndex));
        this.addDog(info);
        servInfo = servInfo.slice(endIndex + 4);
        info = [];
      }
    }
  } else {
    console.log('Error loading data from storage');
  }
};
