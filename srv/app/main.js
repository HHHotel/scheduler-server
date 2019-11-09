import * as api from "@happyhoundhotel/hounds-ts";
import * as dates from "date-fns";
import {
    setView,
    displayWeek,
} from "./ui";
import {
    HoundsConfig,
    DEFAULT,
} from "@happyhoundhotel/hounds-ts";

window.schedulerDate = new Date(new Date().toLocaleDateString());
window.schedulerDate.setDate(window.schedulerDate.getDate() -
    window.schedulerDate.getDay() + 1);
const BASE_URL = window.location.protocol + "//" + window.location.host;
const API_VERSION = "0.3.3";
const apiConfig = new HoundsConfig({
    apiAuth: {
        username: localStorage.hhh_username,
        token: localStorage.hhh_token,
    },
    apiURL: BASE_URL,
    apiVersion: API_VERSION,
});

/**
 * Save the API credentials to localstorage
 * @param {string} username
 * @param {string} token
 */
function saveCredentials(username, token) {
    localStorage.setItem("hhh_username", username);
    localStorage.setItem("hhh_token", token);
    apiConfig.apiAuth.username = localStorage.hhh_username;
    apiConfig.apiAuth.token = localStorage.hhh_token;
}

window.hhhLogin = () => {
    const loginForm = document.getElementById("login-form");
    const user = new Map();
    for (const el of loginForm.children) {
        if (el.name && el.value) {
            user.set(el.name, el.value);
        }
    }

    api.login(user.get("username"), user.get("password"), BASE_URL)
        .then((res) => {
            saveCredentials(res.username, res.token);
            update();
        });

    return false;
};

/**
 * Update the data in the content view
 */
async function update() {
    try {
        const authValid = await api.checkAuthentication(apiConfig);
        if (!authValid) {
            throw new Error("Authentication not valid");
        }

        const week = await api.getWeek(window.schedulerDate, apiConfig);
        week.forEach((day) => {
            day.forEach((event) => setClosing(event));
            day.sort(api.compareScheduleEvents);
        });

        displayWeek(week, window.schedulerDate);
        setView();
    } catch (err) {
        console.error(err);
        logout();
    }
}

/**
 * Logs out of the API
 */
function logout() {
    localStorage.setItem("hhh_username", "");
    localStorage.setItem("hhh_token", "");
    setView();
}

/**
 * Set the proper default closing hour for the event
 * @param {api.IScheduleEvent} event
 */
function setClosing(event) {
    const openingAm = 8;
    const closingAm = 10;
    const openingPm = 16;
    const closingPm = 18;
    if (dates.compareAsc(event.startDate, event.endDate) === 0) {
        const startHour = event.startDate.getHours();
        if (event.type === DEFAULT.CONSTANTS.DAYCARE) {
            event.endDate.setHours(closingPm);
        } else if (
            isInInterval(startHour, openingAm, closingAm) ||
            isInInterval(startHour, openingPm, closingPm)
        ) {
            event.endDate = new Date(event.startDate);
            const closingHour =
                event.startDate.getHours() < 12 ?
                    closingAm : closingPm;
            event.endDate.setHours(closingHour);
        }
    }
}

/**
 * Returns whether or not x is in interval [a, b] inclusive
 * @param {number} x number to check
 * @param {number} a lower bound
 * @param {number} b upper bound
 * @return {boolean} wheter x is in [a,b]
 */
function isInInterval(x, a, b) {
    if (a === b) {
        return false;
    } else if (a > b) {
        const temp = b;
        b = a;
        a = temp;
    }

    return x >= a && x <= b;
}


/** Advance one week */
function nextWeek() {
    window.schedulerDate.setDate(window.schedulerDate.getDate() + 7);
    update();
};

/** Go back one week */
function prevWeek() {
    window.schedulerDate.setDate(window.schedulerDate.getDate() - 7);
    update();
};

const prevButton = document.querySelector("#prev-week");
const nextButton = document.querySelector("#next-week");
const refreshButton = document.querySelector("#refresh");

prevButton.onclick = prevWeek;
nextButton.onclick = nextWeek;
refreshButton.onclick = update;
window.onload = update;