import assert = require("assert");
import HHHDB = require("../HHHDatabase");
import { DEFAULT, IHoundDog, IHoundAPIDog, IHoundAPIEvent } from "@happyhoundhotel/hounds-ts";
const database = HHHDB.createDatabase(HHHDB.parseDatabaseString(process.env.CLEARDB_DATABASE_URL));

describe("HHH Database", () => {

    const major: IHoundAPIDog = {
        bookings: [
            {
                desc: "",
                endDate: new Date("2-22-19 4:00 PM").valueOf(),
                id: null,
                startDate: new Date("2-17-19 8:00 AM").valueOf(),
                text: "",
                type: "boarding",
            },
            {
                desc: "",
                endDate: new Date("2-22-19 4:00 PM").valueOf(),
                id: null,
                startDate: new Date("2-22-19 8:00 AM").valueOf(),
                text: "",
                type: "daycare",
            },

        ],
        clientName: "Johnson",
        id: null,
        name: "Major",
        activeClient: true,
    };

    // describe("#addDog()", () => { it("Shouldn't complain", (done) => {
    //         HHHDB.addDog(database, major,
    //             (results) => {
    //                 assert.deepEqual(results.warningCount, 0);
    //                 done();
    //             });
    //     });
    // });

    // describe("#find()", () => {
    //     it("Should find Major", (done) => {
    //         const searchText: string = "Major";
    //         HHHDB.find(database, searchText,
    //             (results) => {
    //                 const dog: IHoundAPIDog = results[0] as IHoundAPIDog;
    //                 assert.deepEqual(dog.name + " " + dog.clientName, "Major Johnson");
    //                 major.id = dog.id;
    //                 done();
    //             });
    //     });
    // });

    // describe("#addEvent()", () => {
    //     it("Shouldn't complain", (done) => {
    //         let eventNum = major.bookings.length;
    //         for (const booking of major.bookings) {
    //             booking.id = major.id;

    //             HHHDB.addEvent(database, booking,
    //                 (results) => {
    //                     assert.deepEqual(results.warningCount, 0);
    //                     if (--eventNum === 0) { done(); }
    //                 });
    //         }
    //     });
    // });

    // describe("#addUser()", () => {
    //     it("Should create a user", (done) => {
    //         const user = {
    //             password: "testing",
    //             permissions: 0,
    //             username: "testing",
    //         };
    //         HHHDB.addUser(database, user.username, user.password, user.permissions, () => done());
    //     });
    // });

    // describe("#changePassword()", () => {
    //     it("Should change a password", (done) => {
    //         const user = {
    //             password: "testing",
    //             permissions: 0,
    //             username: "testing",
    //         };
    //         HHHDB.changePassword(database, user.username, user.password, "testingNew",
    //             (res) => {
    //                 assert.equal(res, "Success");
    //                 done();
    //             });
    //     });
    // });

    // describe("#deleteUser()", () => {
    //     it("Should delete the testing user", (done) => {
    //         HHHDB.deleteUser(database, "testing");
    //         done();
    //     });
    // });

    // describe("#retrieveDog()", () => {
    //     it("Proper retrieval of Major", (done) => {
    //         HHHDB.retrieveDog(database, major.id, (res: IHoundAPIDog) => {
    //             res.bookings.sort((a, b) => a.startDate - b.startDate);
    //             major.bookings.sort((a, b) => a.startDate - b.startDate);
    //             major.bookings.map((booking, i) => { booking.id = res.bookings[i].id; });
    //             assert.deepEqual(res, major);
    //             done();
    //         });

    //     });
    // });

    // describe("#deleteDog", () => {
    //     it("Should remove Major and booking", (done) => {
    //         HHHDB.removeDog(database, major.id, () => {
    //             HHHDB.find(database, "Major Johnson", (res) => {
    //                 assert.deepEqual(res.length, 0);
    //                 done();
    //             });
    //         });
    //     });
    // });

    const groomingEvent: IHoundAPIEvent = {
        desc: "",
        startDate: new Date("1/23/4567 8:09").valueOf(),
        endDate: new Date("1/23/4567 16:09").valueOf(),
        type: "grooming",
        text: "Blitzen w/4P",
        id: "",
    };

    describe("#addEvent", () => {
        it("Should add grooming", (done) => {
            HHHDB.addEvent(database, groomingEvent, null);

            HHHDB.find(database, groomingEvent.text, (res) => {
                res.map((result) => {
                    result = result as IHoundAPIEvent;
                    if (result.startDate && result.startDate === groomingEvent.startDate) {
                        done();
                    }
                });
            });

        });
    });

    describe("#getWeek", () => {
        it("should do things", (done) => {
            HHHDB.getWeek(database, new Date("1/23/4567 8:09"), (week) => {
                assert.equal(week[0].startDate, groomingEvent.startDate);
                done();
            });
        });
    });

    describe("#removeEvent", () => {
        it("Should remove grooming", (done) => {
            HHHDB.find(database, groomingEvent.text, (res) => {
                res.map((result) => {
                    result = result as IHoundAPIEvent;
                    if (result.startDate && result.startDate === groomingEvent.startDate) {
                        remove(result.id);
                    }
                });

                done();

                function remove(id) {
                    HHHDB.removeEvent(database, id, null);
                }
            });
        });
    });

    /* TODO
       describe("#removeEvent", () => {
       });
       describe("#editDog", () => {
       });
       describe("#editEvent", () => {
       });
       describe("#checkToken", () => {
       });
       MORE FIND THINGS describe("#find", () => {
       });
       describe("#deactivateDog", () => {
       });
       describe("#reactivateDog", () => {
       });
     */
});
