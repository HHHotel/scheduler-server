const prevButton = document.querySelector("#prev-week");
const nextButton = document.querySelector("#next-week");
const refreshButton = document.querySelector("#refresh");

prevButton.onclick = window.prevWeek;
nextButton.onclick = window.nextWeek;
refreshButton.onclick = window.update;
