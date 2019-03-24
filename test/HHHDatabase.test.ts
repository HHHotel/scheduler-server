import assert = require("assert");
import HHHDB = require("../src/HHHDatabase");
import {HHHDog} from "../src/HHHTypes";
const database = HHHDB.createDatabase(HHHDB.parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

describe("HHH Database", () => {

    const major: HHHDog = {
        bookings: [
            {
                endDate: new Date("2-22-19 4:00 PM"),
                id: null,
                startDate: new Date("2-17-19 8:00 AM"),
                text: "",
                type: "boarding",
            },
            {
                endDate: new Date("2-22-19 4:00 PM"),
                id: null,
                startDate: new Date("2-22-19 8:00 AM"),
                text: "",
                type: "daycare",
            },

        ],
        clientName: "Johnson",
        id: null,
        name: "Major",
    };

    describe("#addDog()", () => {
        it("Shouldn't complain", (done) => {
            HHHDB.addDog(database, major,
                (results) => {
                    assert.deepEqual(results.warningCount, 0);
                    done();
                });
        });
    });

    describe("#find()", () => {
        it("Should find Major", (done) => {
            const searchText: string = "Major";
            HHHDB.find(database, searchText,
                (results) => {
                    assert.deepEqual(results[0].text, "Major Johnson");
                    major.id = results[0].dogId;
                    done();
                });
        });
    });

    describe("#addEvent()", () => {
        it("Shouldn't complain", (done) => {
            let eventNum = major.bookings.length;
            for (const booking of major.bookings) {
                booking.id = major.id;
                HHHDB.addEvent(database, booking,
                    (results) => {
                        assert.deepEqual(results.warningCount, 0);
                        if (--eventNum === 0) { done(); }
                    });
            }
        });
    });

    describe("#addUser()", () => {
        it("Should create a user", (done) => {
            const user = {
                password: "testing",
                permissions: 0,
                username: "testing",
            };
            HHHDB.addUser(database, user.username, user.password, user.permissions, () => done() );
        });
    });

    describe("#changePassword()", () => {
        it("Should change a password", (done) => {
            const user = {
                password: "testing",
                permissions: 0,
                username: "testing",
            };
            HHHDB.changePassword(database, user.username, user.password, "testingNew",
                (res) => {
                    assert.equal(res, "Success");
                    done();
            });
        });
    });

    describe("#deleteUser()", () => {
        it("Should delete the testing user", (done) => {
            HHHDB.deleteUser(database, "testing");
            done();
        });
    });

    describe("#retrieveDog()", () => {
        it("Proper retrieval of Major", (done) => {
            HHHDB.retrieveDog(database, major.id, (res: HHHDog) => {
                res.bookings.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf() );
                major.bookings.sort((a, b) => a.startDate.valueOf() - b.startDate.valueOf() );
                major.bookings.map((booking, i) => { booking.id = res.bookings[i].id; });
                assert.deepEqual(res, major);
                done();
            });

        });
    });

    describe("#deleteDog", () => {
        it("Should remove Major and booking", (done) => {
            HHHDB.removeDog(database, major.id, () => {
                HHHDB.find(database, "Major Johnson", (res) => {
                    assert.deepEqual(res.length, 0);
                    done();
                });
            });
        });
    });

    /*
     * TODO:
    * addEvent -- Plain event
    * editDog
    * editEvent
    * getWeek
    * */
});
