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
updateLastChecked()
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
navigator.serviceWorker.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'refresh') {
        document.getElementById("refreshText").innerHTML = "Refresh!"
        document.getElementById("refresh").classList.add('bg-arcade-sub')
        document.getElementById("refresh").classList.remove('pointer-events-none')
        document.getElementById("refresh").classList.remove('bg-arcade-loading')
        document.getElementById("refresh").classList.remove('opacity-50')
        updateLastChecked()
    }
});