/* eslint no-console: "off" */

class DatabaseInterface { 

    constructor (DB_host, DB_user, DB_pass, DB) {
        this.sql = require('mysql');
        this.DB = this.sql.createConnection({
            host    : DB_host,
            user    : DB_user,
            password: DB_pass,
            database: DB
        });
    }


    add (event) {
        if (event.type === 'dog') {
            this.insertDog(event);
        } else {
            this.insertEvent(event);
        }
    }

    /*
    Gets Dog object 
    {
        name: "",   Dogs Name
        cName; ""   Client's Last Name
    }
    */

    insertDog (dog) {

        // CREATE TABLE dogs (id BIGINT NOT NULL, dog_name TEXT NOT NULL, client_name TEXT NOT NULL); 

        this.DB.query(
            `INSERT INTO dogs (id, dog_name, client_name) 
             VALUES (UUID_SHORT(), "` + dog.name + '", "' + dog.cName + '");'
        );
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

    insertEvent (event) {
        // TODO Add a value builder so i dont have to deal with writing out these huge strings jeez
        let eventID = event.id ? event.id : 'uuid_short()';

        this.query(
            `INSERT INTO events 
            (id, event_start, event_end, event_type, event_text)
            VALUES 
            (` + eventID + ', "' + event.start + '", "' + event.end + '", "' + event.type + '", "' + event.text + '");'
        );

    }

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

    retreiveEvents (ID, callback) {
        this.query(`
            SELECT * FROM events
            WHERE id = ` + ID + ';'
        , callback);
    }

    findDogs (name, cName, callback) {
        this.query(`
            SELECT * FROM dogs
            WHERE dog_name LIKE "%` + name + `%" AND
            client_name LIKE "%` + cName + `%";
        `, callback);
    }

    getWeek (date, callback) {
        date = new Date(new Date(date).toDateString());
        const startDate = new Date(date.setDate(date.getDate() - date.getDay()));
        const endDate   = new Date(date.setDate(date.getDate() + 7));
        
        this.query(`
            SELECT *, dog_name, client_name FROM events
            WHERE event_start < "` + endDate.toISOString() + `" AND
            event_start > "` + startDate.toISOString() `" JOIN
            dogs ON id = id;
        `, function (results) {
            // TODO change results into a form for the front end
            // [{event}, {} ...];
            callback(results);
        });

    }

    query (queryString, callback) {
        this.DB.query(queryString, 

        function (error, results) {
            if (error) throw error;
            if (results.affectedRows) {
                console.log('Effected ' + results.affectedRows + ' rows');
                console.log('With ' + results.warningCount + ' warnings ' + results.message);
            } else if (results) {
                callback(results);
            }
        });
        this.DB.end();
    }

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


exports.module = DatabaseInterface;