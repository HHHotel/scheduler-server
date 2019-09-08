"use strict";
let baseUrl = window.location.protocol + "//"
    + window.location.host

console.log(baseUrl);

window.DEFAULT = {
    CONSTANTS: {
        BOARDING: "boarding",
        ARRIVING: "arriving",
        DEPARTING: "departing",
        USER_CONSTANT: {
            "Viewer": 0,
            "Inputer": 5,
            "Admin": 10,
        },
    },
    VERSION: "0.3.1",
    API: {
        //BASE_URL: "https://hhh-scheduler.herokuapp.com",
        //BASE_URL: "http://172.22.32.248:8080",
        BASE_URL: baseUrl,
    },
};
