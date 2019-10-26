"use strict";
let baseUrl = window.location.protocol + "//"
    + window.location.host

window.DEFAULT = {
    CONSTANTS: {
        ARRIVING: "arriving",
        DEPARTING: "departing",
        BOARDING: "boarding",
        DAYCARE: "daycare",
        DOG: "dog",
        EVENT_TYPES: [
            "arriving",
            "departing",
            "daycare",
            "grooming",
            "visit",
            "foster",
            "eval",
            "general",
        ],
        USER_CONSTANT: {
            ["Viewer"]: 1,
            ["Inputer"]: 5,
            ["Admin"]: 10,
        },
    },
    VERSION: "0.3.2",
    API: {
        BASE_URL: baseUrl,
    },

};