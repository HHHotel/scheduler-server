window.schedulerDate = new Date(new Date().toLocaleDateString());
window.schedulerDate.setDate(window.schedulerDate.getDate() - window.schedulerDate.getDay() + 1);

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
        body: JSON.stringify(credentials),
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "Version": DEFAULT.VERSION,
        },
    })
        .then((res) => {
            if (res.status === 200) {
                res.json().then((data) => {
                    localStorage.setItem("hhh_username", data.username);
                    localStorage.setItem("hhh_token", data.token);
                    update();
                });
            } else {
                alert("Login Failed");
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
        buildQuery("date", window.schedulerDate.toDateString(),
            "username", localStorage.hhh_username,
            "token", localStorage.hhh_token);

    fetch(url, {
        method: "GET",
        headers: {
            "Version": DEFAULT.VERSION,
        },
    }).then((res) => {
        if (res.status === 200) {
            res.json().then((data) => {
                const fow = window.schedulerDate;

                const events = EventData.loadEventData(window.schedulerDate, data);

                displayWeek(events, fow);
            });
        } else {
            localStorage.removeItem("hhh_token");
            localStorage.removeItem("hhh_user");
            setView();
            //alert("Something went wrong!");
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
    const eventWrapper = document.createElement("div");
    eventWrapper.className = "event-wrapper";
    day.appendChild(dayHeading);
    day.appendChild(eventWrapper);
    for (sEvent of eventsInDay) {
        eventWrapper.appendChild(getEventElement(sEvent));
    }
    parentNode.appendChild(day);
}

/**
 * @param {HHHEvent} event
 * @return {HTMLElement}
 */
function getEventElement(event) {
    const element = document.createElement("pre");
    element.id = event.id;
    element.className = event.type + " event-text";

    const text = event.text;

    element.innerText = text;

    return element;
}
