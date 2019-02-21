import {Pool, PoolConfig} from "mysql";
import {HHHEventDescriptor} from "./HHHEventDescriptor";
import {IHHHBoarding, IHHHEvent} from "./HHHTypes";

class HHHDatabaseInterface {
  private sql: any;
  private bcrypt: any;
  private pool: Pool;

  constructor(options: PoolConfig) {
    this.sql = require("mysql");
    this.bcrypt = require("bcrypt");

    options.supportBigNumbers = true;
    options.bigNumberStrings = true;
    this.pool = this.sql.createPool(options);
  }

  public login(username: string, password: string, callback: ({success, permissions}) => void) {

    const self = this;

    self.query(`
      SELECT * from users
      WHERE users.username = "` + username + '";'
      , (result) => {
      if (result[0]) {
        const user = result[0];
        self.bcrypt.compare(password, user.hashed_password, (err, success) => {
          if (err) { throw err; }
          callback({
            permissions: success ? user.permissions : -1,
            success,
          });
        });
      } else {
        callback({
            permissions: -1,
            success: false,
          });
      }
    });

  }

  public addUser(username, password, permissions, callback) {
    const self = this;

    self.query(`
      SELECT * FROM users WHERE users.username = "` + username + '";',
      (result) => {
        if (result[0]) {
          callback("User already exists");
        } else {
          self.bcrypt.hash(password, 12, (err, hash) => {
            if (err) { throw err; }

            self.query(`
              INSERT INTO users (username, hashed_password, permissions) VALUES
              ("` + username + '","' + hash + '",' + permissions + ");", callback);
          });

        }
      },
    );
  }

  public changePassword(username: string, oldPassword: string, newPassword: string, callback: (a: string) => void) {
    const self = this;

    self.query(`
      SELECT * from users
      WHERE users.username = "` + username + '";'
    , (resultUsers) => {
      if (resultUsers[0]) {
        const user = resultUsers[0];

        self.bcrypt.compare(oldPassword, user.hashed_password, (passwordError, passwordsMatch) => {
          if (passwordError) { throw passwordError; }

          if (passwordsMatch) {
            self.bcrypt.hash(newPassword, 12, (hashingError, hash) => {
              if (hashingError) { throw hashingError; }

              self.query(`
                UPDATE users
                SET hashed_password = "` + hash + `"
                WHERE users.username = "` + username + '";',
                (result) => {
                  if (callback) { callback(result); }
                });
            });

          } else {
            if (callback) { callback("Wrong Password"); }
          }
        });
      } else {
        if (callback) { callback("User not found"); }
      }
    });
  }

  public deleteUser(username, callback) {
    const self = this;

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

  public add(event, callback) {
    if (event.type === "dog") {
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

  public insertDog(dog, callback) {

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

  public insertEvent(event, callback) {
    if (!event.end) { event.end = event.start; }
    if (!event.id) { event.id = 0; }

    this.query(
      `INSERT INTO events
      (id, event_start, event_end, event_type, event_text, event_id)
      VALUES
      (` + event.id + ', "' + event.start + '", "' + event.end + '", "'
      + event.type + '", "' + event.text + '", uuid_short());'

    , callback);

  }

  public removeEvent(eventId, callback) {
    this.query(`
      DELETE FROM events
      WHERE event_id = ` + eventId + `;
    `, callback);
  }

  public removeDog(dogID, callback) {
    this.query("DELETE FROM dogs WHERE dogs.id = " + dogID + ";", () => {
      this.query("DELETE FROM events WHERE events.id = " + dogID + ";", callback);
    });
  }

  /*
    Gets ID, Table, and ColumnName to be Edited
      ID: exsiting dog/event ID
      tableName: table to edit on
      columnName: column to edit on
      value: value to insert
  */

  public editDog(ID, columnName, value, callback) {
    this.query(`
      UPDATE dogs
      SET ` + columnName + ' = "' + value + `"
      WHERE id = ` +  ID + ";"
    , callback);
  }

  public editEvent(eventID, columnName, value, callback) {
    this.query(`
      UPDATE events
      SET ` + columnName + ' = "' + value + `"
      WHERE event_id = ` + eventID + ";"
    , callback);
  }

  public retrieveDog(ID, callback) {
    const self = this;

    self.query(`
      SELECT * FROM dogs
      INNER JOIN events ON dogs.id = events.id
      WHERE dogs.id = "` + ID + '";'
    , (res) => {
      if (res[0]) {
        const dog = {
          bookings: [],
          clientName: res[0].client_name,
          id: res[0].id,
          name: res[0].dog_name,
        };
        for (const entry of res) {
          dog.bookings.push({
          end: new Date(entry.event_end),
          eventID: new Date(entry.event_id),
          start: entry.event_start,
          });
        }
        dog.bookings.reverse();
        callback(dog);
      } else {
        self.query(`
          SELECT * FROM dogs
          WHERE dogs.id = "` + ID + '";'
        , (result) => {
          if (result[0] && result.length === 1) {
            const dog = {
              bookings: [],
              clientName: result[0].client_name,
              id: result[0].id,
              name: result[0].dog_name,
            };
            callback(dog);
          }
        });
      }

     });
  }

  public getEvents(ID, callback) {
    this.query(`
      SELECT * FROM events
      WHERE id = ` + ID + ";"
    , callback);
  }

  public findDogs(searchText, callback) {

    this.query(`
      SELECT * FROM dogs
      WHERE dog_name LIKE "%` + searchText + `%";
    `, callback);
  }

  public findEvents(searchText, callback) {
    this.query(`
    SELECT * from events
    WHERE event_text LIKE "%` + searchText + `%" AND
    event_text <> 'undefined';
    `, callback);
  }

  public getWeek(date: Date, callback: ([]) => void ) {
    date = new Date(new Date(date.valueOf()).toDateString());

    const startDate: Date = new Date(date.setDate(date.getDate() - date.getDay() + 1));
    const endDate: Date   = new Date(date.setDate(date.getDate() + 7));

    this.query(`
      SELECT * FROM events
      LEFT JOIN dogs ON dogs.id = events.id
      WHERE (event_start <= "` + endDate.valueOf() + '" AND event_start >= "' + startDate.valueOf() + `") OR
      (event_end <= "` + endDate.valueOf() + '" AND event_end >= "' + startDate.valueOf() + `") OR
      (event_start < "` + startDate.valueOf() + '" AND event_end > "' + endDate.valueOf() + `");
    `, (results) => {

      const week = formatWeek(results);

      callback(week);
    });

  }

  /*
  SQL pool wrapper to simplify queries
  Gets Sql queryString and a callback function to return the results
  */

  public query(queryString, callback) {

    this.pool.getConnection((connError, connection) => {
      if (connError) { throw connError; }

      connection.query(queryString, (queryError, results) => {
          if (queryError) { throw queryError; }

          if (results.affectedRows) {
            // console.log("Effected " + results.affectedRows + " rows");
            // console.log("With " + results.warningCount + " warnings " + results.message);
            if (callback) { callback(results); }
          } else if (results) {
            if (callback) { callback(results); }
          }
        },
      );

      connection.release();
    });

  }

}

function formatWeek(dbEvents: HHHEventDescriptor[]): any[] {

  const weekEvents: IHHHEvent[] = [];

  dbEvents.map((eventDescriptor: HHHEventDescriptor) => {
    eventDescriptor = new HHHEventDescriptor(eventDescriptor);
    const event: IHHHEvent = eventDescriptor.getHHHEvent();
    weekEvents.push(event);
  });

  return weekEvents;
}

export = HHHDatabaseInterface;
