function formatPlural(num) {
    if (num == 1) {
        return ""
    } else {
        return "s"
    }
}
async function updateLastChecked() {
    chrome.storage.local.get("lastFetchedTime", function (data) {
        console.log("Value is " + data.lastFetchedTime);
        if (!data.lastFetchedTime) {
            document.getElementById("lastChecked").innerHTML = `A check is scheduled to occur soon...`
        } else {
            document.getElementById("lastChecked").innerHTML = `Last checked ${Math.floor((Date.now()-data.lastFetchedTime)/(1000 * 60))} minute${formatPlural(data.lastFetchedTime)} ago...`
        }

    })
}
updateLastChecked()