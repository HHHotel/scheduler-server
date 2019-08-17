window.schedulerDate = new Date();

/**
 * This is the login function
 *
 * @param {JSON} event
 * @example
 *  hhhLogin();
 *
 * @return {boolean} false - to not sumbit the form
 */
window.hhhLogin = (event) => {
    const loginForm = document.getElementById("login-form");
    const user = new Map();
    for (const el of loginForm.children) {
        if (el.name && el.value) {
            user.set(el.name, el.value);
        }
    }

    const credentials = {
        username: user.get("username"),
        password: user.get("password"),
    };

    fetch(DEFAULT.API.BASE_URL + "/login", {
        method: "POST",
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
    })
        .then((res) => {
            if (res.status === 200) {
                res.json().then((data) => {
                    localStorage.setItem("hhh_username", data.username);
                    localStorage.setItem("hhh_token", data.token);
                    update();
                });
            } else {
                alert("Something went wrong!");
            }
        });
    return false;
};

/**
 *
 */
function update() {
    queryWeek();
    setView();
}

/**
*/
function setView() {
    if (localStorage.hhh_token) {
        contentView();
    } else {
        loginView();
    }
}

/**
*/
function loginView() {
    const loginWrapper = document.querySelector(".login-wrapper");
    const contentWrapper = document.querySelector(".content-wrapper");
    loginWrapper.style = "display: visible";
    contentWrapper.style = "display: none";
}

/**
*/
function contentView() {
    const loginWrapper = document.querySelector(".login-wrapper");
    const contentWrapper = document.querySelector(".content-wrapper");
    loginWrapper.style = "display: none";
    contentWrapper.style = "display: visible";
}

window.onload = update;

/**
 * @param {Date} date
 * @return {Date} first day of the week
 */
function getFirstOfWeek(date) {
    return new Date(new Date(new Date(date).
        setDate(date.getDate() - date.getDay())).toDateString());
}

window.nextWeek = () => {
    window.schedulerDate.setDate(window.schedulerDate.getDate() + 7);
    update();
};

window.prevWeek = () => {
    window.schedulerDate.setDate(window.schedulerDate.getDate() - 7);
    update();
};

/**
*/
function queryWeek() {
    const url = DEFAULT.API.BASE_URL + "/api/week?" +
        buildQuery("date", window.schedulerDate,
            "username", localStorage.hhh_username,
            "token", localStorage.hhh_token);

    fetch(url).then((res) => {
        if (res.status === 200) {
            res.json().then((data) => {
                const fow = getFirstOfWeek(window.schedulerDate);
                const low = new Date(getFirstOfWeek(window.schedulerDate)).
                    setDate(fow.getDate() + 6);

                const events = loadEventData(data, fow, low);

                displayWeek(events, fow);
            });
        } else {
            localStorage.removeItem("hhh_token");
            setView();
            alert("Something went wrong!");
        }
    });
}

/**
 * @return {string} http query in url format
 */
function buildQuery() {
    let query = "";
    // eslint-disable-next-line
    for (let i = 0; i < arguments.length; i += 2) {
        // eslint-disable-next-line
        query += "&" + arguments[i] + "=" + arguments[i + 1];
    }
    return query;
}

/**
 *  @param {HHHEvent[]} serverEventResponse
 *  @param {Date} firstDayOfWeek
 *  @param {Date} lastDayOfWeek
 *  @return {[[]]} listing of days with events inside of them
 */
function loadEventData(serverEventResponse, firstDayOfWeek, lastDayOfWeek) {
    const events = [];

    for (let i = 0; i < 7; i++) events[i] = [];

    for (const event of serverEventResponse) {
        event.startDate = new Date(event.startDate);
        event.endDate = new Date(event.endDate);

        const startDay = event.startDate <= firstDayOfWeek ?
            0 : event.startDate.getDay();

        const endDay = event.endDate >= lastDayOfWeek ?
            6 : event.endDate.getDay();


        for (let i = startDay; i <= endDay; i++) {
            const record = {
                text: event.text,
                type: event.type,
                id: event.dogId ? event.dogId : event.eventId,
                date: event.startDate,
            };

            if (event.type === DEFAULT.CONSTANTS.BOARDING &&
                new Date(new Date(firstDayOfWeek).setDate(i)).toDateString() ===
                event.startDate.toDateString()) {
                record.date = event.startDate;
                record.type = DEFAULT.CONSTANTS.ARRIVING;
            } else if (event.type === DEFAULT.CONSTANTS.BOARDING &&
                new Date(new Date(firstDayOfWeek).setDate(i)).toDateString() ===
                event.endDate.toDateString()) {
                record.date = event.endDate;
                record.type = DEFAULT.CONSTANTS.DEPARTING;
            } else if (event.type === DEFAULT.CONSTANTS.BOARDING) {
                record.date = null;
            }

            events[i].push(record);
        }
    }
    return events;
}

/**
 * @param {[[]]} days
 * @param {Date} firstDayOfWeek
 */
function displayWeek(days, firstDayOfWeek) {
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
function displayDay(eventsInDay, parentNode, dayHeadingText) {
    /* eventsInDay.sort((a, b) => {
        return getSorting(a) - getSorting(b);
    });*/

    const day = document.createElement("div");
    day.className = "day-wrapper";
    const dayHeading = document.createElement("h2");
    dayHeading.className = "day-header";
    dayHeading.innerText = dayHeadingText;
    day.appendChild(dayHeading);
    for (sEvent of eventsInDay) {
        day.appendChild(getEventElement(sEvent));
    }
    parentNode.appendChild(day);
}

/**
 * @param {HHHEvent} hhhEvent
 * @return {int} sort order for the event
 */ /*
function getSorting(hhhEvent) {
    if (hhhEvent.type === DEFAULT.CONSTANTS.BOARDING) {
        return 1;
    } else if (hhhEvent.type === DEFAULT.CONSTANTS.DAYCARE) {
        if (hhhEvent.date.getHours() <= 12) {
            return 2;
        } else {
            return 5;
        }
    } else if (hhhEvent.type === DEFAULT.CONSTANTS.ARRIVING) {
        if (hhhEvent.date.getHours() < 12) {
            return 3;
        } else {
            return 6;
        }
    } else if (hhhEvent.type === DEFAULT.CONSTANTS.DEPARTING) {
        if (hhhEvent.date.getHours() < 12) {
            return 4;
        } else {
            return 7;
        }
    } else {
        return 10;
    }
} */


/**
 * @param {HHHEvent} event
 * @return {HTMLElement}
 */
function getEventElement(event) {
    const element = document.createElement("pre");
    element.id = event.id;
    element.className = event.type + " event-text";

    const date = event.date ? new Date(event.date) : null;
    const text = event.text;

    if (date) {
        const hours = date.getHours();

        element.innerText = "(" + hours + getClosing(date) + ") " + text;
    } else {
        element.innerText = text;
    }

    return element;
}

/**
 * @param {Date} date
 * @return {string} closingTime
 */
function getClosing(date) {
    if (date.getHours() != 8 && date.getHours() != 16) {
        return ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes()
            : date.getMinutes());
    } else if (date.getHours() < 12) {
        return "-10";
    } else {
        return "-18";
    }
}
