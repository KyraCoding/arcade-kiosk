chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!")
  chrome.alarms.create('checkAPI', { periodInMinutes: 5 });
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkAPI") {
    var response = await fetch("https://hackclub.com/api/arcade/shop/")
    if (response.status != 200) {
      console.log("Invalid API response! Quitting...")
      return
    }

    var data = await response.json()
    var old = chrome.storage.local.get("lastFetched").lastFetched
    data.forEach((item) => {
      
    })


    // Finish up
    var parsed = new Map()
    data.forEach((item) => {
      const name = item.name
      delete item.name
      parsed.set(name, item)
    })
    console.log(parsed)
    chrome.storage.local.set({ "lastFetched": JSON.stringify(parsed) })
    chrome.storage.local.set({ "lastFetchedTime": Date.now() })
  }
});
chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId === 'shop-diff-notif') {
    chrome.action.openPopup();
  }
});