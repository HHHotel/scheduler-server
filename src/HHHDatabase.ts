// eslint-disable-next-line
import {PoolConnection, Pool, MysqlError, PoolConfig} from "mysql";
// eslint-disable-next-line
import * as DB from "./HHHDBTypes";
// eslint-disable-next-line
import * as HHH from "@happyhoundhotel/hounds-ts/dist/src/types/HHHTypes";
// eslint-disable-next-line
import * as API from "@happyhoundhotel/hounds-ts/dist/src/types/HHHApiTypes";

import * as bcrypt from "bcrypt";
import {v4 as uuidv4} from "uuid";

type HoundsFindResult = API.IHoundAPIEvent | API.IHoundAPIDog;

/** Timout period for user authentication tokens */
const TOKEN_EXPIRE_PERIOD: number = 86400000;
/**
 * Parse the database url into options
 * @param {string} databaseUrl url of the form
 *                  mysql://${username}:${password}@${host}/${database}
 * @return {any} database connection options
 */
function parseDatabaseString(databaseUrl: string): any {
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

/**
 * Handle mysql syntax errors without dying
 * @param {MysqlError} err to handle
 * @return {boolean} if the error is not internal
 * */
function handleError(err: MysqlError): boolean {
    switch (err.code) {
    case "ER_SYNTAX_ERROR":
        console.error(err);
        return false;
    case "ER_DUP_ENTRY":
        return true;
    default:
        console.error(err);
        process.exit(1);
    }
}

/**
 * Object to persist database information in
 * */
export default class HoundsDatabase {
    private pool: Pool;

    /**
     * @param {string} dbUrl url to connect to
     * @param {PoolConfig} opts to pass to mysql
     * */
    constructor(dbUrl: string, opts?: PoolConfig) {
        opts = {
            ...opts,
            ...parseDatabaseString(dbUrl),
        };
        opts.supportBigNumbers = true;
        opts.bigNumberStrings = true;
        this.pool = require("mysql").createPool(opts);
    }

    /**
     * @param {string} qstr query string
     * @param {Array<string|number>?} qarray array of values to insert into query string on ?s
     * @return {Promise<any[]>}
     * TODO logging
     */
    query(qstr: string, qarray?: Array<string|number>): Promise<any[]> {
        return new Promise((resolve, reject) => {
            this.pool.getConnection((cerr: MysqlError, connection: PoolConnection) => {
                if (cerr) {
                    if (handleError(cerr)) {
                        reject(cerr);
                    }
                }

                const handleQuery = (qerr: MysqlError | null, results: any) => {
                    if (qerr) {
                        if (handleError(qerr)) {
                            reject(qerr);
                        }
                    }
                    resolve(results);
                };

                connection.query(qstr, qarray, handleQuery);
                connection.release();
            });
        });
    }

    /**
     * @param {string} username
     * @return {DB.ISQLUser}
     * */
    private async getUser(username: string): Promise<DB.ISQLUser> {
        return (await this.query("SELECT * from users WHERE users.username = ?;", [username]))[0];
    }

    /**
     * @param {string} username
     * @param {string} password
     * */
    async login(username: string, password: string): Promise<HHH.IHoundUser> {
        return new Promise(async (resolve, reject) => {
            if (!username || !password) {
                reject(new Error("Username or Password not specified"));
                return;
            }

            const user = await this.getUser(username);
            if (!user) {
                reject(new Error("User does not exist"));
                return;
            }

            bcrypt.compare(password, user.hashed_password, async (err, success) => {
                if (err) {
                    reject(err);
                    return;
                }

                if (!success) {
                    reject(new Error("Wrong password"));
                } else {
                    const token = uuidv4();
                    const tokenTimestamp = new Date().valueOf();
                    await this.query(
                        "UPDATE users SET token = ?, token_timestamp = ? WHERE username = ?;",
                        [token, tokenTimestamp, username],
                    );
                    resolve({
                        id: parseInt(user.id, 10),
                        permissions: user.permissions,
                        token: token,
                        username: user.username,
                    });
                }
            });
        });
    }

    /** Adds a new user to the database */
    async addUser({username, password, permissions}): Promise<void> {
        return new Promise(async (resolve, reject) => {
            if (await this.getUser(username)) {
                reject(new Error("User already exists"));
            }

            bcrypt.hash(password, 12, (err, hash) => {
                if (err) {
                    throw err;
                }

                this.query(`INSERT INTO users (username, hashed_password, permissions)
                           VALUES (?,?,?);`, [username, hash, permissions])
                    .then(() => resolve())
                    .catch((err) => reject(err));
            });
        });
    }

    /**
     * @param {string} username
     * @param {string} oldPass
     * @param {string} newPass
     * */
    async changePassword(username: string, oldPass: string, newPass: string): Promise<void> {
        const user = await this.getUser(username);
        if (!user) {
            throw new Error("User Not Found");
        }

        const storePassword = (newPass: string) => {
            bcrypt.hash(newPass, 12, (hashingError, hash) => {
                if (hashingError) {
                    throw hashingError;
                }
                this.query("UPDATE users SET hashed_password = ?  WHERE users.username = ?;",
                    [hash, username]);
            });
        };

        bcrypt.compare(oldPass, user.hashed_password, (passwordError, passwordsMatch) => {
            if (passwordError) {
                throw passwordError;
            }

            if (passwordsMatch) {
                storePassword(newPass);
            } else {
                throw new Error("Wrong Password");
            }
        });
    }

    /**
     * @param {string} username
     * */
    async deleteUser(username: string) {
        return this.query("DELETE FROM users WHERE users.username = ?;", [username]);
    }

    /**
     * @param {string} username
     * @param {string} token
     * */
    async checkToken(username: string, token: string): Promise<HHH.IHoundUser> {
        const user = await this.getUser(username);
        if (!user) {
            throw new Error("User does not exist");
        }
        if (new Date().valueOf() - user.token_timestamp > TOKEN_EXPIRE_PERIOD) {
            throw new Error("Token out of date");
        }
        if (token !== user.token) {
            throw new Error("Wrong token");
        }

        return {
            id: parseInt(user.id, 10),
            permissions: user.permissions,
            token: user.token,
            username: user.username,
        };
    }

    /**
     * @param {API.IHoundAPIDog} dog
     * */
    async addDog(dog: API.IHoundAPIDog): Promise<void> {
        const qrys = `INSERT INTO dogs (id, dog_name, client_name, active_client) VALUES 
                   (UUID_SHORT(), ?, ?, ?);`;

        return new Promise((resolve, reject) => {
            this.query(qrys, [dog.name, dog.clientName, dog.activeClient ? 1 : 0])
                .then(() => resolve())
                .then((err) => reject(err));
        });
    }

    /**
     * @param {API.IHoundAPIEvent} event
     *
     * */
    async addEvent(event: API.IHoundAPIEvent): Promise<void> {
        // We only need to set the dog_id column if it is passed to us
        const cols = `(start, end, type, text, event_id ${event.id ? ", dog_id" : ""})`;
        const vals = `(?,     ?,   ?,    ?,    uuid_short() ${event.id ? ",?" : ""})`;
        const subs = [event.startDate, event.endDate, event.type, event.text, event.id];
        this.query(`INSERT INTO events ${cols} VALUES ${vals};`, subs);
    }

    /**
     * @param {string} eventId
     * */
    async removeEvent(eventId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.query("DELETE FROM events WHERE event_id = ?;", [eventId])
                .then(() => resolve())
                .then((err) => reject(err));
        });
    }

    /**
     * @param {string} dogId
     * */
    async removeDog(dogId: string) {
        this.query("DELETE FROM dogs where dogs.id = ?;", [dogId]);
        return this.query("DELETE FROM events where events.dog_id = ?;", [dogId]);
    }

    /**
     * @param {string} dogId
     * */
    async deactivateDog(dogId: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.query("UPDATE dogs set active_client = 0 where dogs.id = ?;", [dogId])
                .then(() => resolve)
                .catch((err) => reject(err));
        });
    }

    /**
     * @param {string} dogId
     * */
    async reactivateDog(dogId: string) {
        return new Promise((resolve, reject) => {
            this.query("UPDATE dogs set active_client = 1 where dogs.id = ?;", [dogId])
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    /**
     * @param {string} id
     * @param {string} columnName
     * @param {string} value
     * */
    async editDog(id: string, columnName: string, value: string) {
        return new Promise((resolve, reject) => {
            this.query(`UPDATE dogs SET ${this.pool.escapeId(columnName)} = ? WHERE id = ?;`,
                [value, id])
                .then(() => resolve())
                .catch((err) => reject(err));
        });
    }

    /**
     * @param {string} id
     * @param {string} columnName
     * @param {string} value
     * */
    async editEvent(id: string, columnName: string, value: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.query(
                `UPDATE events SET ${this.pool.escapeId(columnName)} = ? WHERE event_id = ?;`,
                [value, id],
            ).then(() => resolve()).catch((err) => reject(err));
        });
    }

    /**
     * @param {string} id
     * */
    async retrieveDog(id: string): Promise<API.IHoundAPIDog> {
        const results = await this.query(
            "SELECT * FROM dogs LEFT JOIN events ON dogs.id = events.dog_id WHERE dogs.id = ?;",
            [id],
        );
        if (!results[0]) {
            throw new Error("Dog does not exist");
        }
        const dog: API.IHoundAPIDog = {
            bookings: [],
            clientName: results[0].client_name,
            id: results[0].id,
            name: results[0].dog_name,
            activeClient: results[0].active_client !== 0,
        };
        results.map((record) => {
            if (record.start && record.end) {
                const event: API.IHoundAPIEvent = {
                    endDate: parseInt(record.end, 10),
                    id: record.event_id,
                    startDate: parseInt(record.start, 10),
                    text: record.text,
                    type: record.type,
                    desc: "",
                };
                dog.bookings.push(event);
            }
        });
        return dog;
    }


    /**
     * @param {string} searchText
     * @return {Promise<Array<HoundsFindResult>>}
     * */
    async find(searchText: string): Promise<Array<HoundsFindResult>> {
        const resDogs = await this.query(
            "SELECT * FROM dogs WHERE dog_name LIKE ? or client_name like ?;",
            [`%${searchText}%`, `%${searchText}%`],
        );
        const resEvents = await this.query(
            "SELECT * from events WHERE dog_id IS NULL;"
            , [`%${searchText}%`],
        );

        const results = [];
        resDogs.forEach((dog) => results.push({
            activeClient: dog.active_client !== 0,
            id: dog.id,
            name: dog.dog_name,
            clientName: dog.client_name,
            bookings: [],
        }));
        resEvents.forEach((event) => results.push({
            desc: "",
            endDate: parseInt(event.end, 10),
            id: event.event_id,
            startDate: parseInt(event.start, 10),
            text: event.text,
            type: event.type,
        }));

        return results;
    }

    /**
     * @param {Date} date
     * */
    async getWeek(date: Date): Promise<API.IHoundAPIBooking[]> {
        // Remove time data
        date = new Date(new Date(date.valueOf()).toDateString());

        // Get One full week with a buffer of one day at the start and the end
        // This week Sunday at 00:00
        const startDate: Date = new Date(date.setDate(date.getDate() - date.getDay()));
        // Next week Tues at 00:00
        const endDate: Date = new Date(date.setDate(date.getDate() + 9));

        const s = startDate.valueOf();
        const e = endDate.valueOf();

        const resWeek = await this.query(`SELECT * FROM events
              LEFT JOIN dogs ON dogs.id = events.dog_id
              WHERE (
                  dogs.active_client = 1 OR
                  events.dog_id = 0 OR
                  events.dog_id IS NULL
              ) AND
              (
                start BETWEEN ? AND ? OR
                end BETWEEN ? AND ? OR
                start <= ? AND end >= ?
              );`, [s, e, s, e, s, e]);

        return formatWeek(resWeek);
    }
}

/**
 * @param {DB.ISQLEvent[]} dbEvents
 * @return {HHH.IScheduleEvent[]}
 * */
function formatWeek(dbEvents: DB.ISQLEvent[]): API.IHoundAPIBooking[] {
    const weekEvents: API.IHoundAPIBooking[] = [];

    dbEvents.map((event) => {
        if (event.text === "undefined") {
            event.text = null;
        }
        weekEvents.push({
            desc: "",
            dogId: event.id,
            endDate: parseInt(event.end, 10),
            startDate: parseInt(event.start, 10),
            id: event.event_id,
            text: event.text || event.dog_name,
            type: event.type,
        });
    });

    return weekEvents;
}
