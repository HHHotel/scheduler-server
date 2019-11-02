import {MysqlError, PoolConfig } from "mysql";
import * as DB from "./HHHDBTypes";
import * as HHH from "./HHHTypes";
import * as API from "./HHHApiTypes";

import bcrypt = require("bcrypt");
import uuidv4 = require("uuid/v4");

const TOKEN_EXPIRE_PERIOD: number = 86400000;

function parseDatabaseString(databaseUrl: string) {
    const dbUser = databaseUrl.substring(8, databaseUrl.indexOf(":", 8));
    const dbPass = databaseUrl.substring(databaseUrl.indexOf(":", 8) + 1, databaseUrl.indexOf("@"));
    const dbHost = databaseUrl.substring(databaseUrl.indexOf("@") + 1,
        databaseUrl.indexOf("/", databaseUrl.indexOf("@")));
    const dbName = databaseUrl.substring(databaseUrl.indexOf("/",
        databaseUrl.indexOf("@")) + 1, databaseUrl.indexOf("?"));

    return {
        database: dbName,
        host: dbHost,
        password: dbPass,
        user: dbUser,
    };

}

// No-OP function
function noop() { return; }

function handleError(err: MysqlError) {
    console.log(err.sqlMessage);
    switch (err.code) {
        case "ER_SYNTAX_ERROR":
            console.error(err);
            break;
        default:
            console.error(err);
            process.exit(1);
    }

}

function createDatabase(opts: PoolConfig): DB.IDatabase {
    opts.supportBigNumbers = true;
    opts.bigNumberStrings = true;

    return { pool: require("mysql").createPool(opts), connOpts: opts };
}

function query(db: DB.IDatabase, qstr: string, callback: (results: any) => void) {
    db.pool.getConnection((connError, connection) => {
        if (connError) { handleError(connError); }

        connection.query(qstr, (queryError: MysqlError, results: any) => {
            if (queryError) { handleError(queryError); }

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

function login(db: DB.IDatabase, username: string, password: string,
               callback: (user: HHH.IHoundUser) => void) {

    if (!username || !password) { callback(null); return; }

    const token = uuidv4();
    const tokenTimestamp = new Date().valueOf();

    // Sets Token
    query(db, `
          UPDATE users
          SET token = "` + token + `", token_timestamp = ` + tokenTimestamp + `
          WHERE username = '` + username + `';`
        , findUser);

    // Get user
    function findUser() {
        query(db, `
                  SELECT * from users
                  WHERE users.username = '` + username + "';"
            , comparePass);
    }

    // Check hash with password
    function comparePass(results: DB.ISQLUser[]) {
        const user = results[0];
        if (!user) { callback(null); return; }

        bcrypt.compare(password, user.hashed_password,
            (err, success) => {
                if (err) { throw err; }
                if (!success) {
                    callback(null);
                } else {
                    callback({
                        id: user.id,
                        permissions: user.permissions,
                        token: user.token,
                        username: user.username,
                    });
                }

            });
    }
}

function addUser(db: DB.IDatabase, username: string, password: string, permissions: number,
                 callback: (res: any) => void) {
    query(db, `
         SELECT * FROM users WHERE users.username = "` + username + '";'
        , insertUser);

    function insertUser(results: DB.ISQLUser[]) {
        if (results[0]) { return null; }
        bcrypt.hash(password, 12, (err, hash) => {
            if (err) { throw err; }

            query(db, `
                         INSERT INTO users (username, hashed_password, permissions) VALUES
                         ("` + username + '","' + hash + '",' + permissions + ");"
                , callback);
        });
    }
}

function changePassword(db: DB.IDatabase, username: string,
                        oldPassword: string, newPassword: string, callback: (answer: string) => void) {
    query(db, `
          SELECT * from users
          WHERE users.username = "` + username + '";'
        , checkPassword);

    function checkPassword(results: DB.ISQLUser[]) {
        if (!results[0]) { callback("User Not Found"); return; }
        const user = results[0];

        bcrypt.compare(oldPassword, user.hashed_password,
            (passwordError, passwordsMatch) => {
                if (passwordError) { throw passwordError; }

                if (passwordsMatch) {
                    storePassword(newPassword);
                } else if (callback) {
                    callback("Wrong Password");
                }
            });
    }

    function storePassword(newPass: string) {
        bcrypt.hash(newPass, 12, (hashingError, hash) => {
            if (hashingError) { throw hashingError; }
            query(db, `
                          UPDATE users
                          SET hashed_password = "` + hash + `"
                          WHERE users.username = "` + username + '";'
                , () => { callback("Success"); } );
        });
    }
}

function deleteUser(db: DB.IDatabase, username: string) {
    query(db, `
          DELETE FROM users
          WHERE users.username = "` + username + '";', noop);
    console.info("Removed user: username=", username);
}

function checkToken(db: DB.IDatabase, username: string, token: string,
                    callback: (user: HHH.IHoundUser) => void) {
    query(db, `
          SELECT username, token, token_timestamp, permissions FROM users
          WHERE users.username = '` + username + `';`
        , (result) => {
            if (result[0]
                && (new Date().valueOf() - result[0].token_timestamp) < TOKEN_EXPIRE_PERIOD
                && token === result[0].token) {
                callback({
                    id: result[0].id,
                    permissions: result[0].permissions,
                    token: result[0].token,
                    username: result[0].username,
                });
            } else {
                callback(null);
            }
        });
}

function addDog(db: DB.IDatabase, dog: API.IHoundApiDog, doneCall: (res: any) => void) {
    query(db, `
          INSERT INTO dogs (id, dog_name, client_name)
          VALUES (UUID_SHORT(), "` + dog.name + '", "' + dog.clientName + '");'
        , doneCall);
}

function addEvent(db: DB.IDatabase, event: API.IHoundApiEvent, doneCall: (res: any) => void) {

    query(db, `
          INSERT INTO events (id, event_start, event_end, event_type, event_text, event_id)
          VALUES (` + event.id + ', "' + event.startDate + '", "' + event.endDate +
        '", "' + event.type + '", "' + event.text + '", UUID_SHORT());'
        , doneCall);
}

function removeEvent(db: DB.IDatabase, eventId: string, doneCall: (res: any) => void) {
    query(db, `
          DELETE FROM events
          WHERE event_id = ` + eventId + `;`
        , doneCall);
    console.info("Removed event: id=", eventId);
}

function removeDog(db: DB.IDatabase, dogID: string, doneCall: (res: any) => void) {
    query(db, "DELETE FROM dogs WHERE dogs.id = " + dogID + ";", noop);
    query(db, "DELETE FROM events WHERE events.id = " + dogID + ";", doneCall);
    console.info("Removed dog: id=", dogID);
}

function editDog(db: DB.IDatabase, id: string, columnName: string, value: string) {
    query(db, `
          UPDATE dogs SET ` + columnName + ' = "' + value + `"
          WHERE id = ` +  id + ";"
        , noop);
}

function editEvent(db: DB.IDatabase, eventId: string, columnName: string, value: string) {
    query(db, `
          UPDATE events SET ` + columnName + ' = "' + value + `"
          WHERE event_id = ` + eventId + ";"
        , noop);
}

function retrieveDog(db: DB.IDatabase, id: string, callback: (dog: API.IHoundApiDog) => void) {
    query(db, `
          SELECT * FROM dogs
          LEFT JOIN events ON dogs.id = events.id
          WHERE dogs.id = "` + id + '";'
        , createDog);

    function createDog(results: DB.ISQLEvent[]) {
        if (!results[0]) {
            callback(null);
            return;
        }

        const dog: API.IHoundApiDog = {
            bookings: [],
            clientName: results[0].client_name,
            id: results[0].id,
            name: results[0].dog_name,
        };

        results.reverse().map((record) => {
            if (record.event_start && record.event_end) {
                const event: API.IHoundApiEvent = {
                    endDate: parseInt(record.event_end, 10),
                    id: record.event_id,
                    startDate: parseInt(record.event_start, 10),
                    text: record.event_text,
                    type: record.event_type,
                };

                dog.bookings.push(event);
            }
        });

        callback(dog);

    }
}

function find(db: DB.IDatabase, searchText: string,
              callback: (matches: Array<API.IHoundApiEvent | API.IHoundApiDog>) => void) {
    query(db, `
          SELECT * FROM dogs
          WHERE dog_name LIKE "%` + searchText + `%"; `
        , findEvents);

    function findEvents(resDogs: DB.ISQLDog[]) {
        query(db, `
                  SELECT * from events WHERE event_text LIKE "%` + searchText + `%" AND
                  id = 0 AND event_text <> 'undefined';`
            , (resEvents) => sendMatches(resDogs, resEvents));
    }

    function sendMatches(resDogs: DB.ISQLDog[], resEvents: DB.ISQLEvent[]) {
        const matches: Array<API.IHoundApiEvent | API.IHoundApiDog> = [];

        resDogs.map((dog: DB.ISQLDog) => {
            matches.push({
                id: dog.id,
                name: dog.dog_name,
                clientName: dog.client_name,
                bookings: [],
            });

        });
        resEvents.map((event: DB.ISQLEvent) => {
            matches.push({
                endDate: parseInt(event.event_end, 10),
                id: event.event_id,
                startDate: parseInt(event.event_start, 10),
                text: event.event_text,
                type: event.event_type,
            });

        });
        callback(matches);
    }
}

function getWeek(db: DB.IDatabase, date: Date, callback: ([]) => void ) {

    // Remove time data
    date = new Date(new Date(date.valueOf()).toDateString());

    // Get One full week with a buffer of one day at the start and the end
    // This week Sunday at 00:00
    const startDate: Date = new Date(date.setDate(date.getDate() - date.getDay()));
    // Next week Tues at 00:00
    const endDate: Date  = new Date(date.setDate(date.getDate() + 9));

    query(db, `
          SELECT * FROM events
          LEFT JOIN dogs ON dogs.id = events.id
          WHERE (event_start < ` + endDate.valueOf() + " AND event_start >= " + startDate.valueOf() + `) OR
          (event_end < ` + endDate.valueOf() + " AND event_end >= " + startDate.valueOf() + `) OR
          (event_start < ` + startDate.valueOf() + " AND event_end > " + endDate.valueOf() + `);
        `, (results) => {

            const week = formatWeek(results);

            if (callback) { callback(week); }
        });

}

function formatWeek(dbEvents: DB.ISQLEvent[]): any[] {

    const weekEvents: API.IHoundApiBooking[] = [];

    dbEvents.map((event) => {
        if (event.event_text === "undefined") { event.event_text = null; }
        weekEvents.push({
            dogId: event.id,
            endDate: parseInt(event.event_end, 10),
            id: event.event_id,
            startDate: parseInt(event.event_start, 10),
            text: event.event_text || event.dog_name,
            type: event.event_type,
        });
    });

    return weekEvents;
}

export = {
    addDog,
    addEvent,
    addUser,
    changePassword,
    checkToken,
    createDatabase,
    deleteUser,
    editDog,
    editEvent,
    find,
    getWeek,
    login,
    parseDatabaseString,
    removeDog,
    removeEvent,
    retrieveDog,
};
