/* eslint no-console: "off" */
import {Pool, PoolConfig} from 'mysql';
import {HHHEvent, HHHBoarding} from './HHHTypes';
import {HHHEventDescriptor} from './HHHEventDescriptor';
  

class HHHDatabaseInterface {
  sql: any;
  bcrypt: any;
  pool: Pool;

 constructor (options: PoolConfig) {
   process.env.TZ = 'UTC';
   this.sql = require('mysql');
   this.bcrypt = require('bcrypt');

   options.supportBigNumbers = true;
   options.bigNumberStrings = true;
   this.pool = this.sql.createPool(options);
  }

  login (username, password, callback) {

    let self = this;

    self.query(`
      SELECT * from users
      WHERE users.username = "` + username + '";'
    , function (result) {
      if (result[0]) {
        let user = result[0];
        self.bcrypt.compare(password, user.hashed_password, function (err, result) {
          if (err) throw err;
          callback({
            success: result,
            permissions: user.permissions
          });
        });
      } else {
        callback({success: false});
      }
    });


  }

  addUser (username, password, permissions, callback) {
    // TODO : Check if the user already exists and block
    let self = this;

    self.query(`
      SELECT * FROM users WHERE users.username = "` + username + '";',
      function (result) {
        if (result) {
          callback("User already exists");
          return;
        }
      });

    self.bcrypt.hash(password, 12, function (err, hash) {
      if (err) throw err;

      self.query(`
        INSERT INTO users (username, hashed_password, permissions) VALUES
        ("` + username + '","' + hash + '",' + permissions + ');', function (result) {
          if (callback) callback(result);
        });
    });

  }

  changePassword (username, oldPassword, newPassword, callback) {
    let self = this;

    self.query(`
      SELECT * from users
      WHERE users.username = "` + username + '";'
    , function (result) {
      if (result[0]) {
        let user = result[0];

        self.bcrypt.compare(oldPassword, user.hashed_password, function (err, result) {
          if (err) throw err;
          if (result) {
            self.bcrypt.hash(newPassword, 12, function (err, hash) {
              self.query(`
                UPDATE users
                SET hashed_password = "` + hash + `"
                WHERE users.username = "` + username + '";',
                function (result) {
                  if (callback) callback(result);
                });
            });

          } else {
            if (callback) callback('Wrong Password');
          }
        });
      } else {
        if (callback) callback('User not found');
      }
    });
  }

  deleteUser (username, callback) {
    let self = this;

    self.query(`
      DELETE FROM users
      WHERE users.username = "` + username + '";', callback);
  }

  /*
    event : {
      type: String,
      dogName: String*,
      clientName: String*,
      start: datetime*,
      end: datetime*,
      text: String*,
      id: int**
    }

    * = nreq
    ** = only if adding an event for a dog

  */


  add (event, callback) {
    if (event.type === 'dog') {
      this.insertDog(event, callback);
    } else {
      this.insertEvent(event, callback);
    }
  }

  /*
  Gets HHHDog object
  {
    name: "",   Dogs Name
    clientName; ""   Client's Last Name
  }
  */

  insertDog (dog, callback) {

    // CREATE TABLE dogs (id BIGINT NOT NULL, dog_name TEXT NOT NULL, client_name TEXT NOT NULL);

    this.query(
      `INSERT INTO dogs (id, dog_name, client_name)
       VALUES (UUID_SHORT(), "` + dog.name + '", "' + dog.cName + '");'
    , callback);
  }

  /*
  Gets Event Object
  {
    type: "",           Boarding --- Daycare --- (Other Grooming etc.)
    text: "",           if type === Other
    start: "datetime",      In Sql Format yyyy-mm-dd
    end: "datetime",      In Sql Format yyyy-mm-dd
    id: null || existing dog id
  }
  INSERT INTO events (id, event_start, event_end, event_type, event_text);
  */

  insertEvent (event, callback) {
    if (!event.end) event.end = event.start;

    this.query(
      `INSERT INTO events
      (id, event_start, event_end, event_type, event_text, event_id)
      VALUES
      ("` + event.id + '", "' + event.start + '", "' + event.end + '", "' + event.type + '", "' + event.text + '", uuid_short());'
    , callback);

  }

  removeEvent (eventId, callback) {
    this.query(`
      DELETE FROM events
      WHERE event_id = ` + eventId + `;
    `, callback);
  }

  removeDog (dogID, callback) {
    this.query('DELETE FROM dogs WHERE dogs.id = ' + dogID + ';', () => {
      this.query('DELETE FROM events WHERE events.id = ' + dogID + ';', callback);
    });
  }

  /*
    Gets ID, Table, and ColumnName to be Edited
      ID: exsiting dog/event ID
      tableName: table to edit on
      columnName: column to edit on
      value: value to insert
  */

  editDog (ID, columnName, value, callback) {
    this.query(`
      UPDATE dogs
      SET ` + columnName + ' = "' + value + `"
      WHERE id = ` +  ID + ';'
    , callback);
  }

  editEvent (eventID, columnName, value, callback) {
    this.query(`
      UPDATE events
      SET ` + columnName + ' = "' + value + `"
      WHERE event_id = ` + eventID + ';'
    , callback);
  }

  retrieveDog (ID, callback) {
    let self = this;

    self.query(`
      SELECT * FROM dogs
      INNER JOIN events ON dogs.id = events.id
      WHERE dogs.id = "` + ID + '";'
    , function (res) {
      if (res[0]) {
        let dog = {
          name: res[0].dog_name,
          clientName: res[0].client_name,
          id: res[0].id,
          bookings: []
        };
        for (let entry of res) {
          dog.bookings.push({
          start: entry.event_start,
          end: new Date(entry.event_end),
          eventID: new Date(entry.event_id)
          });
        }
        dog.bookings.reverse();
        callback(dog);
      } else {
        self.query(`
          SELECT * FROM dogs
          WHERE dogs.id = "` + ID + '";'
        , function (result) {
          if (result[0] && result.length === 1) {
            let dog = {
              name: result[0].dog_name,
              clientName: result[0].client_name,
              id: result[0].id,
              bookings: []
            };
            callback(dog);
          }
        });
      }

     });
  }

  getEvents (ID, callback) {
    this.query(`
      SELECT * FROM events
      WHERE id = ` + ID + ';'
    , callback);
  }

  findDogs (searchText, callback) {

    this.query(`
      SELECT * FROM dogs
      WHERE dog_name LIKE "%` + searchText + `%";
    `, callback);
  }

  findEvents (searchText, callback) {
    this.query(`
    SELECT * from events
    WHERE event_text LIKE "%` + searchText + `%" AND
    event_text <> 'undefined';
    `, callback);
  }

  getWeek (date: Date, callback: Function) {
    date = new Date(new Date(date.valueOf()).toDateString());

    const startDate: Date = new Date(date.setDate(date.getDate() - date.getDay() + 1));
    const endDate: Date   = new Date(date.setDate(date.getDate() + 7));

    this.query(`
      SELECT * FROM events
      LEFT JOIN dogs ON dogs.id = events.id
      WHERE (event_start <= "` + endDate.valueOf() + '" AND event_start >= "' + startDate.valueOf() + `") OR
      (event_end <= "` + endDate.valueOf() + '" AND event_end >= "' + startDate.valueOf() + `") OR
      (event_start < "`+ startDate.valueOf() + '" AND event_end > "' + endDate.valueOf() + `");
    `, function (results) {

      let week = formatWeek(results);

      callback(week);
    });

  }

  /*
  SQL pool wrapper to simplify queries
  Gets Sql queryString and a callback function to return the results
  */

  query (queryString, callback) {

    this.pool.getConnection(function (error, connection) {
      if (error) throw error;

      connection.query(queryString,

        function (error, results) {
          if (error) throw error;

          if (results.affectedRows) {
            console.log('Effected ' + results.affectedRows + ' rows');
            console.log('With ' + results.warningCount + ' warnings ' + results.message);
            if (callback) callback(results);
          } else if (results) {
            if (callback) callback(results);
          }
        }
      );

      connection.release();
    });

  }

}

function formatWeek(dbEvents: Array<HHHEventDescriptor>): Array<any> {

  let weekEvents: Array<HHHEvent> = [];

  dbEvents.map(function (eventDescriptor: HHHEventDescriptor) {
    console.log(eventDescriptor);
    eventDescriptor = new HHHEventDescriptor(eventDescriptor);
    let event: HHHEvent = eventDescriptor.getHHHEvent();
    console.log(event);
    weekEvents.push(event);
  });

  return weekEvents;
}

export = HHHDatabaseInterface;
