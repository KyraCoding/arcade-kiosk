function formatPlural(num) {
    if (num == 1) {
        return ""
    } else {
        return "s"
    }
}
async function updateLastChecked() {
    chrome.action.setBadgeText({ text: '' });
    var data = (await chrome.storage.local.get("lastFetchedTime")).lastFetchedTime
    if (!data) {
        document.getElementById("lastChecked").innerHTML = `A check is scheduled to occur soon...`
    } else {
        document.getElementById("lastChecked").innerHTML = `Last checked ${Math.floor((Date.now() - data) / (1000 * 60))} minute${formatPlural(Math.floor((Date.now() - data) / (1000 * 60)))} ago...`
    }
}
async function viewHistory() {
    var historyList = document.getElementById("historyList")
    var data = (await chrome.storage.local.get("history")).history
    if (data?.length > 0) {
        while (historyList.firstChild) {
            historyList.removeChild(historyList.firstChild);
        }
        data.forEach((item) => {
            var itemWrapper = document.createElement("div");
            itemWrapper.className = "flex flex-col cursor-pointer text-white h-fit w-full rounded p-3 shadow-2xl"
            if (item.type == "new") {
                itemWrapper.classList.add("bg-sky-500")
            } else if (item.type == "decrease") {
                itemWrapper.classList.add("bg-rose-500")
            } else if (item.type == "increase") {
                itemWrapper.classList.add("bg-emerald-500")
            }
            var itemTitle = document.createElement("p");
            itemTitle.className = "flex text-2xl truncate"
            itemTitle.innerHTML = item.title;
            var itemChange = document.createElement("p");
            itemChange.className = "flex text-lg truncate"
            itemChange.innerHTML = item.change;

            itemWrapper.appendChild(itemTitle)
            itemWrapper.appendChild(itemChange)
            historyList.appendChild(itemWrapper)
        })
    }
}
async function viewSettings() {
    var settingsList = document.getElementById("settingsList")
    var data = (await chrome.storage.local.get("lastFetched")).lastFetched
    if (data != undefined) {
        while (settingsList.firstChild) {
            settingsList.removeChild(settingsList.firstChild);
        }
        for (var i = 0; i < Object.keys(data).length; i++) {
            let item = Object.keys(data)[i]
            let priorSettings = (await chrome.storage.local.get(item))[item]
            if (priorSettings == undefined) {
                priorSettings = true
            }
            var option = document.createElement("p");
            if (priorSettings) {
                option.className = "flex p-2 text-xl bg-emerald-500 rounded cursor-pointer shadow-2xl transition duration-300 hover:bg-emerald-400"
            } else {
                option.className = "flex p-2 text-xl bg-rose-500 rounded cursor-pointer shadow-2xl transition duration-300 hover:bg-rose-400"
            }
            option.innerHTML = item
            option.dataset.item = item
            settingsList.appendChild(option)
            option.addEventListener("click", function () {
                toggleSettings(item)
            })
        }
    }
}
async function toggleSettings(item, forceState) {
    let priorSettings = (await chrome.storage.local.get(item))[item]
    priorSettings = forceState ?? !priorSettings
    var element = document.querySelector(`[data-item="${item}"]`);
    if (priorSettings) {
        element.className = "flex p-2 text-xl bg-emerald-500 rounded cursor-pointer shadow-2xl transition duration-300 hover:bg-emerald-400"
    } else {
        element.className = "flex p-2 text-xl bg-rose-500 rounded cursor-pointer shadow-2xl transition duration-300 hover:bg-rose-400"
    }
    await chrome.storage.local.set({ [item]: priorSettings })
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
        viewHistory()
    } else if (page == "settings") {
        document.getElementById("home").classList.add("hidden")
        document.getElementById("homeImg").src = "assets/home.svg"
        document.getElementById("history").classList.add("hidden")
        document.getElementById("historyImg").src = "assets/history.svg"
        viewSettings()
    }
    document.getElementById(page).classList.remove("hidden")
    currentPage = page
    document.getElementById(page + "Img").src = `assets/${page}-fill.svg`
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

document.getElementById("switchHome").addEventListener("click", function () {
    changePages("home")
})
document.getElementById("switchHistory").addEventListener("click", function () {
    changePages("history")
})
document.getElementById("switchSettings").addEventListener("click", function () {
    changePages("settings")
})
document.getElementById("clearHistory").addEventListener("click", function () {
    chrome.storage.local.remove("history")
    var historyList = document.getElementById("historyList")
    while (historyList.firstChild) {
        historyList.removeChild(historyList.firstChild);
    }
    var empty = document.createElement("h1")
    empty.className = "flex justify-center text-4xl"
    empty.innerHTML = "Nothing yet!"
    historyList.appendChild(empty)
})
document.getElementById("toggleAllOn").addEventListener("click", function () {
    const elements = document.querySelectorAll('[data-item]');
    elements.forEach(toggle => {
        toggleSettings(toggle.dataset.item, true)
    })
})
document.getElementById("toggleAllOff").addEventListener("click", function () {
    const elements = document.querySelectorAll('[data-item]');
    elements.forEach(toggle => {
        toggleSettings(toggle.dataset.item, false)
    })
})