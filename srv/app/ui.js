import {
    getTimePrepend,
} from "@happyhoundhotel/hounds-ts";

/**
 * Checks the LocalStorage for the API token and sets the view accordingly
 */
export function setView() {
    if (localStorage.hhh_token) {
        contentView();
    } else {
        loginView();
    }
}

/**
 * Sets the view to the login page
 */
export function loginView() {
    const loginWrapper = document.querySelector(".login-wrapper");
    const contentWrapper = document.querySelector(".content-wrapper");
    loginWrapper.style = "display: visible";
    contentWrapper.style = "display: none";
}

/**
 * Sets the view to the content page
 */
export function contentView() {
    const loginWrapper = document.querySelector(".login-wrapper");
    const contentWrapper = document.querySelector(".content-wrapper");
    loginWrapper.style = "display: none";
    contentWrapper.style = "display: visible";
}

/**
 * @param {[[]]} days
 * @param {Date} firstDayOfWeek
 */
export function displayWeek(days, firstDayOfWeek) {
    const weekWrapper = document.querySelector(".week-wrapper");
    while (weekWrapper.hasChildNodes()) {
        weekWrapper.removeChild(weekWrapper.childNodes[0]);
    }

    for (let i = 0; i < days.length; i++) {
        const dayDate =
            new Date(new Date(firstDayOfWeek)
                .setDate(firstDayOfWeek.getDate() + i));
        displayDay(days[i], weekWrapper, dayDate.toDateString());
    }
}

/**
 * @param {[]} eventsInDay - Events to add to this day
 * @param {HTMLElement} parentNode - parent node to add the day to
 * @param {string} dayHeadingText
 */
export function displayDay(eventsInDay, parentNode, dayHeadingText) {
    const day = document.createElement("div");
    day.className = "day-wrapper";
    const dayHeading = document.createElement("h2");
    dayHeading.className = "day-header";
    dayHeading.innerText = dayHeadingText;
    const eventWrapper = document.createElement("div");
    eventWrapper.className = "event-wrapper";
    day.appendChild(dayHeading);
    day.appendChild(eventWrapper);
    for (const sEvent of eventsInDay) {
        eventWrapper.appendChild(getEventElement(sEvent));
    }
    parentNode.appendChild(day);
}

/**
 * @param {HHHEvent} event
 * @return {HTMLElement}
 */
export function getEventElement(event) {
    const element = document.createElement("div");
    element.id = event.id;
    element.className = event.type + " event-text";

    const text = event.text;
    element.innerText = getTimePrepend(event) + " " + text;

    return element;
}
