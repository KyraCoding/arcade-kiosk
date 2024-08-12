function formatPlural(num) {
    if (num == 1) {
        return ""
    } else {
        return "s"
    }
}
async function updateLastChecked() {
    chrome.action.setBadgeText({ text: '' });
    chrome.storage.local.get("lastFetchedTime", function (data) {
        console.log("Value is " + data.lastFetchedTime);
        if (!data.lastFetchedTime) {
            document.getElementById("lastChecked").innerHTML = `A check is scheduled to occur soon...`
        } else {
            document.getElementById("lastChecked").innerHTML = `Last checked ${Math.floor((Date.now() - data.lastFetchedTime) / (1000 * 60))} minute${formatPlural(Math.floor((Date.now() - data.lastFetchedTime) / (1000 * 60)))} ago...`
        }

    })
}
var currentPage;
function changePages(page) {
    if (page == "home") {
        document.getElementById("history").classList.add("hidden")
        document.getElementById("historyImg").src = "assets/history.svg"
        document.getElementById("settings").classList.add("hidden")
        document.getElementById("settingsImg").src = "assets/settings.svg"
    } else if (page == "history") {
        document.getElementById("home").classList.add("hidden")
        document.getElementById("homeImg").src = "assets/home.svg"
        document.getElementById("settings").classList.add("hidden")
        document.getElementById("settingsImg").src = "assets/settings.svg"
    } else if (page == "settings") {
        document.getElementById("home").classList.add("hidden")
        document.getElementById("homeImg").src = "assets/home.svg"
        document.getElementById("history").classList.add("hidden")
        document.getElementById("historyImg").src = "assets/history.svg"
    }
    document.getElementById(page).classList.remove("hidden")
    currentPage = page
    document.getElementById(page+"Img").src = `assets/${page}-fill.svg`
}

// Run on load
var currentPage = "home"
updateLastChecked()
changePages("home")

// Event listeners
document.getElementById("refresh").addEventListener("click", function () {
    console.log("Starting manual refresh...")
    if (navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({
            type: 'refresh'
        });
    }
    document.getElementById("refreshText").innerHTML = "Fetching..."
    document.getElementById("refresh").classList.remove('bg-arcade-sub')
    document.getElementById("refresh").classList.add('pointer-events-none')
    document.getElementById("refresh").classList.add('bg-arcade-loading')
    document.getElementById("refresh").classList.add('opacity-50')
})
navigator.serviceWorker.addEventListener('message', function (event) {
    if (event.data && event.data.type === 'refresh') {
        document.getElementById("refreshText").innerHTML = "Refresh!"
        document.getElementById("refresh").classList.add('bg-arcade-sub')
        document.getElementById("refresh").classList.remove('pointer-events-none')
        document.getElementById("refresh").classList.remove('bg-arcade-loading')
        document.getElementById("refresh").classList.remove('opacity-50')
        updateLastChecked()
    }
});

document.getElementById("switchHome").addEventListener("click", function() {
    changePages("home")
})
document.getElementById("switchHistory").addEventListener("click", function() {
    changePages("history")
})
document.getElementById("switchSettings").addEventListener("click", function() {
    changePages("settings")
})