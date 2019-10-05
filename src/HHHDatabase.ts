import {MysqlError, PoolConfig} from "mysql";
import {Database, HHHDog, HHHEvent, HHHSQLDog, HHHSQLEvent, HHHSQLUser, HHHUser, SchedulerEvent} from "./HHHTypes";

import bcrypt = require("bcrypt");

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
function noop() { return true; }

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

function createDatabase(opts: PoolConfig): Database {
    opts.supportBigNumbers = true;
    opts.bigNumberStrings = true;

    return { pool: require("mysql").createPool(opts), connOpts: opts };
}

function query(db: Database, qstr: string, callback: (results: any[]) => void) {
    db.pool.getConnection((connError, connection) => {
        if (connError) { handleError(connError); }

        connection.query(qstr, (queryError, results) => {
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

function login(db: Database, username: string, password: string,
    callback: (user: HHHUser) => void) {

    if (!username || !password) { callback(null); return; }

    // TODO More resilient token generation
    const token = Math.round(Math.random() * 1000000);
    const tokenTimestamp = new Date().valueOf();

    // Sets Token
    query(db, `
          UPDATE users
          SET token = ` + token + `, token_timestamp = ` + tokenTimestamp + `
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
    function comparePass(results: HHHSQLUser[]) {
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

function addUser(db: Database, username: string, password: string, permissions: number,
    callback: (res: unknown) => void) {
    query(db, `
         SELECT * FROM users WHERE users.username = "` + username + '";'
        , insertUser);

    function insertUser(results: HHHSQLUser[]) {
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

function changePassword(db: Database, username: string,
    oldPassword: string, newPassword: string, callback: (answer: string) => void) {
    query(db, `
          SELECT * from users
          WHERE users.username = "` + username + '";'
        , checkPassword);

    function checkPassword(results: HHHSQLUser[]) {
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

function deleteUser(db: Database, username: string) {
    query(db, `
          DELETE FROM users
          WHERE users.username = "` + username + '";', noop);
    console.info("Removed user: username=", username);
}

function checkToken(db: Database, username: string, token: number,
    callback: (user: HHHUser) => void) {
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

function addDog(db: Database, dog: HHHDog, doneCall: (res: unknown) => void) {
    query(db, `
          INSERT INTO dogs (id, dog_name, client_name)
          VALUES (UUID_SHORT(), "` + dog.name + '", "' + dog.clientName + '");'
        , doneCall);
}

function addEvent(db: Database, event: HHHSQLEvent, doneCall: (res: unknown) => void) {
    if (!event.id) { event.id = "0"; }

    query(db, `
          INSERT INTO events (id, event_start, event_end, event_type, event_text, event_id)
          VALUES (` + event.id + ', "' + event.event_start + '", "' + event.event_end +
        '", "' + event.event_type + '", "' + event.event_text + '", UUID_SHORT());'
        , doneCall);
}

function removeEvent(db: Database, eventId: string, doneCall: (res: unknown) => void) {
    query(db, `
          DELETE FROM events
          WHERE event_id = ` + eventId + `;`
        , doneCall);
    console.info("Removed event: id=", eventId);
}

function removeDog(db: Database, dogID: string, doneCall: (res: unknown) => void) {
    query(db, "DELETE FROM dogs WHERE dogs.id = " + dogID + ";", noop);
    query(db, "DELETE FROM events WHERE events.id = " + dogID + ";", doneCall);
    console.info("Removed dog: id=", dogID);
}

function editDog(db: Database, id: string, columnName: string, value: string) {
    query(db, `
          UPDATE dogs SET ` + columnName + ' = "' + value + `"
          WHERE id = ` +  id + ";"
        , noop);
}

function editEvent(db: Database, eventId: string, columnName: string, value: string) {
    query(db, `
          UPDATE events SET ` + columnName + ' = "' + value + `"
          WHERE event_id = ` + eventId + ";"
        , noop);
}

function retrieveDog(db: Database, id: string, callback: (dog: HHHDog) => void) {
    query(db, `
          SELECT * FROM dogs
          LEFT JOIN events ON dogs.id = events.id
          WHERE dogs.id = "` + id + '";'
        , createDog);

    function createDog(results: HHHSQLEvent[]) {
        if (!results[0]) { return; }

        const dog: HHHDog = {
            bookings: [],
            clientName: results[0].client_name,
            id: results[0].id,
            name: results[0].dog_name,
        };

        results.reverse().map((record) => {
            if (record.event_start && record.event_end) {
                const event: HHHEvent = {
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

function find(db: Database, searchText: string, callback: (matches: SchedulerEvent[]) => void) {
    query(db, `
          SELECT * FROM dogs
          WHERE dog_name LIKE "%` + searchText + `%"; `
        , findEvents);

    function findEvents(resDogs: HHHSQLDog[]) {
        query(db, `
                  SELECT * from events WHERE event_text LIKE "%` + searchText + `%" AND
                  id = 0 AND event_text <> 'undefined';`
            , (resEvents) => sendMatches(resDogs, resEvents));
    }

    function sendMatches(resDogs: HHHSQLDog[], resEvents: HHHSQLEvent[]) {
        const matches: SchedulerEvent[] = [];

        resDogs.map((dog: HHHSQLDog) => {
            matches.push({
                desc: null /* dog.dog_breed */,
                dogId: dog.id,
                endDate: null,
                id: "-1",
                startDate: null,
                text: dog.dog_name,
                type: "dog",
            });

        });
        resEvents.map((event: HHHSQLEvent) => {
            matches.push({
                desc: null /* event.dog_breed */,
                dogId: event.id,
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

function getWeek(db: Database, date: Date, callback: ([]) => void ) {

    // Remove time data
    date = new Date(new Date(date.valueOf()).toDateString());

    // This week start date at 00:00
    const startDate: Date = new Date(date.setDate(date.getDate() - date.getDay()));
    // Next week start date at 00:00
    const endDate: Date   = new Date(date.setDate(date.getDate() + 7));

    query(db, `
          SELECT * FROM events
          LEFT JOIN dogs ON dogs.id = events.id
          WHERE (event_start < "` + endDate.valueOf() + '" AND event_start >= "' + startDate.valueOf() + `") OR
          (event_end < "` + endDate.valueOf() + '" AND event_end >= "' + startDate.valueOf() + `") OR
          (event_start < "` + startDate.valueOf() + '" AND event_end > "' + endDate.valueOf() + `");
        `, (results) => {

            const week = formatWeek(results);

            if (callback) { callback(week); }
        });

}

function formatWeek(dbEvents: HHHSQLEvent[]): any[] {

    const weekEvents: SchedulerEvent[] = [];

    dbEvents.map((event) => {
        if (event.event_text === "undefined") { event.event_text = null; }
        weekEvents.push({
            desc: null,
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
