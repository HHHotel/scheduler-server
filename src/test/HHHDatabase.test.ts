import assert = require("assert");
import HoundsDatabase from "../HHHDatabase";
// eslint-disable-next-line
import * as hlib from "@happyhoundhotel/hounds-ts";
const database = new HoundsDatabase(process.env.CLEARDB_DATABASE_URL);

describe("HHH Database", () => {
    const major: hlib.IHoundAPIDog = {
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
        clientName: "Joseph Johnson",
        id: null,
        name: "Major J ZZZZ",
        activeClient: true,
    };

    describe("#addDog()", () => {
        it("Shouldn't complain", async () => {
            await database.addDog(major);
            const res = await database.find(major.name);
            const dog = res[0] as hlib.IHoundAPIDog;
            assert.equal(major.name, dog.name);
            major.id = dog.id;
        });
    });

    describe("#find()", () => {
        it("Should find Major", async () => {
            const searchText: string = "major";
            const res = await database.find(searchText);
            const dog = res[0] as hlib.IHoundAPIDog;
            assert.deepEqual(dog.id, major.id);
        });

        it("Should find Major from joseph", async () => {
            const searchText: string = "joseph johnson";
            const res = await database.find(searchText);
            const dog = res[0] as hlib.IHoundAPIDog;
            assert.deepEqual(dog.id, major.id);
        });
    });

    describe("#addEvent()", () => {
        it("Shouldn't complain", async () => {
            for (const booking of major.bookings) {
                booking.id = major.id;
                await database.addEvent(booking);
            }
        });
    });

    describe("#addUser()", () => {
        it("Should create a user", async () => {
            const user = {
                password: "testing",
                permissions: 0,
                username: "testing",
            };
            await database.addUser(user);
        });
    });

    describe("#changePassword()", () => {
        it("Should change a password", async () => {
            const user = {
                password: "testing",
                permissions: 0,
                username: "testing",
            };
            await database.changePassword(user.username, user.password, "testingNew");
        });
    });

    describe("#deleteUser()", () => {
        it("Should delete the testing user", () => {
            database.deleteUser("testing");
        });
    });

    describe("#retrieveDog()", () => {
        it("Proper retrieval of Major", async () => {
            const res = await database.retrieveDog(major.id);
            res.bookings.sort((a, b) => a.startDate - b.startDate);
            major.bookings.sort((a, b) => a.startDate - b.startDate);
            major.bookings.map((booking, i) => booking.id = res.bookings[i].id);
            assert.deepEqual(res, major);
        });
    });

    describe("#deleteDog", () => {
        it("Should remove Major and booking", async () => {
            await database.removeDog(major.id);
            const res = await database.find("Major Johnson");
            assert.deepEqual(res.length, 0);
        });
    });

    const groomingEvent: hlib.IHoundAPIEvent = {
        desc: "",
        startDate: new Date("1/23/4567 8:09").valueOf(),
        endDate: new Date("1/23/4567 16:09").valueOf(),
        type: "grooming",
        text: "Blitzen w/4P 123141fsjan-12312j1d34",
        id: "",
    };

    describe("#addEvent", () => {
        it("Should add grooming", async () => {
            await database.addEvent(groomingEvent);

            const res = await database.find(groomingEvent.text);
            res.map((result) => {
                result = result as hlib.IHoundAPIEvent;
                assert.equal(result.startDate, groomingEvent.startDate);
            });
        });
    });

    describe("#getWeek", () => {
        it("should do things", async () => {
            const week = await database.getWeek(new Date("1/23/4567 8:09"));
            assert.equal(week[0].startDate, groomingEvent.startDate);
        });
    });

    describe("#removeEvent", () => {
        it("Should remove grooming", async () => {
            const res = await database.find(groomingEvent.text);
            res.map((result) => {
                result = result as hlib.IHoundAPIEvent;
                if (result.startDate && result.startDate === groomingEvent.startDate) {
                    database.removeEvent(result.id);
                }
            });
        });
    });

    /* TODO
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
