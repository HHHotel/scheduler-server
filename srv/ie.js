if (msieversion()) {
    console.log("removed");
    this.window.location.href = encodeURIComponent("ie.html");
}

function msieversion() {
    var ua = window.navigator.userAgent;
    var msie = ua.indexOf("MSIE ");

    return msie > 0 || !!navigator.userAgent.match(/Trident.*rv\:11\./)  // If Internet Explorer, return version number
}
