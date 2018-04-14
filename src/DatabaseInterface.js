/* eslint no-console: "off" */

class DatabaseInterface {

    constructor (DB_host, DB_user, DB_pass, DB) {
        process.env.TZ = 'GMT+0000';
        this.sql = require('mysql');
        this.dbOptions = {
            host    : DB_host,
            user    : DB_user,
            password: DB_pass,
            database: DB,
            supportBigNumbers: true,
            bigNumberStrings: true
        };
        this.pool = this.sql.createPool(this.dbOptions);
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
    Gets Dog object
    {
        name: "",   Dogs Name
        cName; ""   Client's Last Name
    }
    */

    insertDog (dog, callback) {

        // CREATE TABLE dogs (id BIGINT NOT NULL, dog_name TEXT NOT NULL, client_name TEXT NOT NULL);

        this.DB.query(
            `INSERT INTO dogs (id, dog_name, client_name)
             VALUES (UUID_SHORT(), "` + dog.name + '", "' + dog.cName + '");'
        , callback);
    }

    /*
    Gets Event Object
    {
        type: "",                   Boarding --- Daycare --- (Other Grooming etc.)
        text: "",                   if type === Other
        start: "datetime",          In Sql Format yyyy-mm-dd
        end: "datetime",          In Sql Format yyyy-mm-dd
        id: null || existing dog id
    }
    INSERT INTO events (id, event_start, event_end, event_type, event_text);
    */

    insertEvent (event, callback) {
        let eventID = event.id ? event.id : 'uuid_short()';
        if (!event.end) event.end = event.start;

        this.query(
            `INSERT INTO events
            (id, event_start, event_end, event_type, event_text)
            VALUES
            (` + eventID + ', "' + event.start + '", "' + event.end + '", "' + event.type + '", "' + event.text + '");'
        , callback);

    }

    // removeEvent (id) {
    //     // TODO make a nice way of removing individual events without removing all of them doi
    //     this.query(`
    //         DELETE FROM events
    //         WHERE id = ` + id + `
    //     ;`);
    // }

    /*
        Gets ID, Table, and ColumnName to be Edited
          ID: exsiting dog/event ID
          tableName: table to edit on
          columnName: column to edit on
          value: value to insert
    */

    edit (ID, tableName, columnName, value) {
        this.query(`
            UPDATE ` + tableName + `
            SET ` + columnName + ' = ' + value + `
            WHERE id = ` +  ID
        );
    }

    retreiveDog (ID, callback) {
        this.query(`
            SELECT * FROM dogs
            INNER JOIN events ON dogs.id = events.id
            WHERE dogs.id = "` + ID + '";'
        , callback);
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

    getWeek (date, callback) {
        date = new Date(new Date(date).toDateString());
        const startDate = new Date(date.setDate(date.getDate() - date.getDay()));
        const endDate   = new Date(date.setDate(date.getDate() + 8));

        this.query(`
            SELECT * FROM events
            LEFT JOIN dogs ON dogs.id = events.id
            WHERE (event_start <= "` + endDate.toISOString() + '" AND event_start >= "' + startDate.toISOString() + `") OR
            (event_end <= "` + endDate.toISOString() + '" AND event_end >= "' + startDate.toISOString() + `") OR
            (event_start < "`+ startDate.toISOString() + '" AND event_end > "' + endDate.toISOString() + `");
        `, function (results) {
            // TODO change results into a form for the front end
            // [{event}, {} ...];
            /*
            * event = {
            * type : event.type,
            * text : dogName + cName || event_text,
            * 
            * }
            * */
            let week = [];
            for (let i = 0; i < 7; i++) week[i] = [];

            results.map(function (e) {
                e.event_start = timeZoneShift(new Date(e.event_start));
                e.event_end = timeZoneShift(new Date(e.event_end));

                let endDay = e.event_end.getTime() < endDate.getTime() ? e.event_end.getDay(): 6;
                let startDay = e.event_start.getTime() <= startDate.getTime() ? 0 : e.event_start.getDay();

                for (let i = startDay; i <= endDay; i++) {
                    let type = e.event_type;
                    let time = null; 
                    let text = e.dog_name ? e.dog_name + ' ' + e.client_name : e.event_text;

                    if (type === 'boarding') {
                        if (e.event_start.toDateString() === new Date(new Date(startDate).setDate(startDate.getDate() + i)).toDateString()) {
                            type = 'arriving';
                            time = formatTime(e.event_start);
                        } else if (e.event_end.toDateString() === new Date(new Date(startDate).setDate(startDate.getDate() + i)).toDateString()) {
                            type = 'departing';
                            time = formatTime(e.event_end);
                        }
                    } else {
                        time = formatTime(e.event_start);
                    }

                    text = (time ? '(' + time + ') ' : '') + text;

                    week[i].push({
                        text : text,
                        type : type,
                        id : e.id
                    });
               }
            });

            callback(week);
        });

    }

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
                        callback(results);
                    }
                }
            );

            connection.release();
        });

    }

}

function formatTime(date) {
    let hours = date.getHours();
    let mins = date.getMinutes();

    if (mins < 10) {
        mins = '0' + mins;
    }

    return hours + ':' + mins;
}

function timeZoneShift (date, timeZoneOffset) {
    let nDate = new Date(date);
    timeZoneOffset = timeZoneOffset ? timeZoneOffset : -7;
    nDate.setHours(nDate.getHours() + timeZoneOffset);
    return nDate;
}

// const DB = new DatabaseInterface(
//     'localhost',
//     'matt',
//     'dogsarebest',
//     'HHH_Database'
// );

// DB.retreiveDog('97596790081060869', function (results) {
//     console.log(results);
// });

// DB.findDogs('Blitz', 'Weinstein', function (results) {
//     console.log(results[0]);
// });


module.exports = DatabaseInterface;
