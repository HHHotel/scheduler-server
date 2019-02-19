"use strict";
var DatabaseInterface = /** @class */ (function () {
    function DatabaseInterface(options) {
        process.env.TZ = 'UTC';
        this.sql = require('mysql');
        this.bcrypt = require('bcrypt');
        options.supportBigNumbers = true;
        options.bigNumberStrings = true;
        this.pool = this.sql.createPool(options);
    }
    DatabaseInterface.prototype.login = function (username, password, callback) {
        var self = this;
        self.query("\n      SELECT * from users\n      WHERE users.username = \"" + username + '";', function (result) {
            if (result[0]) {
                var user_1 = result[0];
                self.bcrypt.compare(password, user_1.hashed_password, function (err, result) {
                    if (err)
                        throw err;
                    callback({
                        success: result,
                        permissions: user_1.permissions
                    });
                });
            }
            else {
                callback({ success: false });
            }
        });
    };
    DatabaseInterface.prototype.addUser = function (username, password, permissions, callback) {
        // TODO : Check if the user already exists and block
        var self = this;
        self.bcrypt.hash(password, 12, function (err, hash) {
            if (err)
                throw err;
            self.query("\n        INSERT INTO users (username, hashed_password, permissions) VALUES\n        (\"" + username + '","' + hash + '",' + permissions + ');', function (result) {
                if (callback)
                    callback(result);
            });
        });
    };
    DatabaseInterface.prototype.changePassword = function (username, oldPassword, newPassword, callback) {
        var self = this;
        self.query("\n      SELECT * from users\n      WHERE users.username = \"" + username + '";', function (result) {
            if (result[0]) {
                var user = result[0];
                self.bcrypt.compare(oldPassword, user.hashed_password, function (err, result) {
                    if (err)
                        throw err;
                    if (result) {
                        self.bcrypt.hash(newPassword, 12, function (err, hash) {
                            self.query("\n                UPDATE users\n                SET hashed_password = \"" + hash + "\"\n                WHERE users.username = \"" + username + '";', function (result) {
                                console.log(result);
                                if (callback)
                                    callback(result);
                            });
                        });
                    }
                    else {
                        if (callback)
                            callback('Wrong Password');
                    }
                });
            }
            else {
                if (callback)
                    callback('User not found');
            }
        });
    };
    DatabaseInterface.prototype.deleteUser = function (username, callback) {
        var self = this;
        self.query("\n      DELETE FROM users\n      WHERE users.username = \"" + username + '";', callback);
    };
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
    DatabaseInterface.prototype.add = function (event, callback) {
        if (event.type === 'dog') {
            this.insertDog(event, callback);
        }
        else {
            this.insertEvent(event, callback);
        }
    };
    /*
    Gets Dog object
    {
      name: "",   Dogs Name
      cName; ""   Client's Last Name
    }
    */
    DatabaseInterface.prototype.insertDog = function (dog, callback) {
        // CREATE TABLE dogs (id BIGINT NOT NULL, dog_name TEXT NOT NULL, client_name TEXT NOT NULL);
        this.query("INSERT INTO dogs (id, dog_name, client_name)\n       VALUES (UUID_SHORT(), \"" + dog.name + '", "' + dog.cName + '");', callback);
    };
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
    DatabaseInterface.prototype.insertEvent = function (event, callback) {
        if (!event.end)
            event.end = event.start;
        this.query("INSERT INTO events\n      (id, event_start, event_end, event_type, event_text, event_id)\n      VALUES\n      (\"" + event.id + '", "' + event.start + '", "' + event.end + '", "' + event.type + '", "' + event.text + '", uuid_short());', callback);
    };
    DatabaseInterface.prototype.removeEvent = function (eventId, callback) {
        this.query("\n      DELETE FROM events\n      WHERE event_id = " + eventId + ";\n    ", callback);
    };
    DatabaseInterface.prototype.removeDog = function (dogID, callback) {
        var _this = this;
        this.query('DELETE FROM dogs WHERE dogs.id = ' + dogID + ';', function () {
            _this.query('DELETE FROM events WHERE events.id = ' + dogID + ';', callback);
        });
    };
    /*
      Gets ID, Table, and ColumnName to be Edited
        ID: exsiting dog/event ID
        tableName: table to edit on
        columnName: column to edit on
        value: value to insert
    */
    DatabaseInterface.prototype.editDog = function (ID, columnName, value, callback) {
        this.query("\n      UPDATE dogs\n      SET " + columnName + ' = "' + value + "\"\n      WHERE id = " + ID + ';', callback);
    };
    DatabaseInterface.prototype.editEvent = function (eventID, columnName, value, callback) {
        this.query("\n      UPDATE events\n      SET " + columnName + ' = "' + value + "\"\n      WHERE event_id = " + eventID + ';', callback);
    };
    DatabaseInterface.prototype.retrieveDog = function (ID, callback) {
        var self = this;
        self.query("\n      SELECT * FROM dogs\n      INNER JOIN events ON dogs.id = events.id\n      WHERE dogs.id = \"" + ID + '";', function (res) {
            if (res[0]) {
                var dog = {
                    name: res[0].dog_name,
                    clientName: res[0].client_name,
                    id: res[0].id,
                    bookings: []
                };
                for (var _i = 0, res_1 = res; _i < res_1.length; _i++) {
                    var entry = res_1[_i];
                    dog.bookings.push({
                        start: entry.event_start,
                        end: entry.event_end,
                        eventID: entry.event_id
                    });
                }
                dog.bookings.reverse();
                callback(dog);
            }
            else {
                self.query("\n          SELECT * FROM dogs\n          WHERE dogs.id = \"" + ID + '";', function (result) {
                    if (result[0] && result.length === 1) {
                        var dog = {
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
    };
    DatabaseInterface.prototype.getEvents = function (ID, callback) {
        this.query("\n      SELECT * FROM events\n      WHERE id = " + ID + ';', callback);
    };
    DatabaseInterface.prototype.findDogs = function (searchText, callback) {
        this.query("\n      SELECT * FROM dogs\n      WHERE dog_name LIKE \"%" + searchText + "%\";\n    ", callback);
    };
    DatabaseInterface.prototype.findEvents = function (searchText, callback) {
        this.query("\n    SELECT * from events\n    WHERE event_text LIKE \"%" + searchText + "%\" AND\n    event_text <> 'undefined';\n    ", callback);
    };
    DatabaseInterface.prototype.getWeek = function (date, callback) {
        date = new Date(new Date(date).toDateString());
        var startDate = new Date(date.setDate(date.getDate() - date.getDay() + 1));
        var endDate = new Date(date.setDate(date.getDate() + 7));
        this.query("\n      SELECT * FROM events\n      LEFT JOIN dogs ON dogs.id = events.id\n      WHERE (event_start <= \"" + endDate.toISOString() + '" AND event_start >= "' + startDate.toISOString() + "\") OR\n      (event_end <= \"" + endDate.toISOString() + '" AND event_end >= "' + startDate.toISOString() + "\") OR\n      (event_start < \"" + startDate.toISOString() + '" AND event_end > "' + endDate.toISOString() + "\");\n    ", function (results) {
            var week = [];
            for (var i = 0; i < 7; i++)
                week[i] = [];
            results.map(function (e) {
                e.event_start = new Date(e.event_start);
                e.event_end = new Date(e.event_end);
                // Set start and end days for boarding inside current week
                var endDay = e.event_end.getTime() < endDate.getTime() ? e.event_end.getDay() - 1 : 6;
                var startDay = e.event_start.getTime() <= startDate.getTime() ? 0 : e.event_start.getDay() - 1;
                // Loop from start of boarding to the end of the boarding
                for (var i = startDay; i <= endDay; i++) {
                    // Cache type and text
                    var type = e.event_type;
                    var date_1 = null;
                    var text = e.dog_name ? e.dog_name + ' ' + e.client_name : e.event_text;
                    if (type === 'boarding') {
                        // Get loop day in string form MM-DD-YYYY
                        var currentDayString = new Date(new Date(startDate.getSeconds()).setDate(startDate.getDate() + i)).toDateString();
                        // Set type to arriving or departing
                        if (e.event_start.toDateString() === currentDayString) {
                            type = 'arriving';
                            date_1 = e.event_start;
                        }
                        else if (e.event_end.toDateString() === currentDayString) {
                            type = 'departing';
                            date_1 = e.event_end;
                        }
                    }
                    else {
                        date_1 = e.event_start;
                    }
                    week[i].push({
                        text: text,
                        date: date_1,
                        type: type,
                        id: e.id
                    });
                }
            });
            // Callback with the week
            callback(week);
        });
    };
    /*
    SQL pool wrapper to simplify queries
    Gets Sql queryString and a callback function to return the results
    */
    DatabaseInterface.prototype.query = function (queryString, callback) {
        this.pool.getConnection(function (error, connection) {
            if (error)
                throw error;
            connection.query(queryString, function (error, results) {
                if (error)
                    throw error;
                if (results.affectedRows) {
                    console.log('Effected ' + results.affectedRows + ' rows');
                    console.log('With ' + results.warningCount + ' warnings ' + results.message);
                    if (callback)
                        callback(results);
                }
                else if (results) {
                    if (callback)
                        callback(results);
                }
            });
            connection.release();
        });
    };
    return DatabaseInterface;
}());
module.exports = DatabaseInterface;
