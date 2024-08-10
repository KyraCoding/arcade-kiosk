chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!")
  chrome.alarms.create('checkAPI', { periodInMinutes: 0.5 });
});

async function refresh() {
  console.log("Time to fetch!")
  var response = await fetch("https://hackclub.com/api/arcade/shop/")
  if (response.status != 200) {
    console.log("Invalid API response! Quitting...")
    return
  }

  var data = await response.json()

  // Parse
  var parsed = {}
  data.forEach((item) => {
    const name = item.name
    delete item.name
    parsed[name] = item
  })
  console.log(parsed)

  // Get old data
  var old = chrome.storage.local.get("lastFetched", function (fetched) {
    olddata = fetched.lastFetched
    console.log(olddata)
    if (Object.keys(olddata).length > 0) {
      Object.keys(olddata).forEach(key => {
        var olditem = olddata[key]
        var newitem = parsed[key]
        if (olditem == undefined) {
          chrome.notifications.create('shop-diff-notif', {
            type: 'basic',
            iconUrl: newitem?.imageURL ?? olditem?.imageURL ?? 'favicon.png',
            title: 'New item in shop!',
            message: `${key} has just been added!`,
            priority: 2
          });
        } else if (newitem == undefined) {
          chrome.notifications.create('shop-diff-notif', {
            type: 'basic',
            iconUrl: newitem?.imageURL ?? olditem?.imageURL ?? 'favicon.png',
            title: 'An item has been removed :(',
            message: `${key} was removed...`,
            priority: 2
          });
        } else if (olditem.stock != newitem.stock) {
          chrome.notifications.create('shop-diff-notif', {
            type: 'basic',
            iconUrl: newitem?.imageURL ?? olditem?.imageURL ?? 'favicon.png',
            title: `${key}'s stock has changed!`,
            message: `${key}'s stock has changed, from ${olditem.stock} to ${newitem.stock}`,
            priority: 2
          });
        }
        console.log(`Checking: ${key}:\nOld stock: ${olditem.stock}\nNew stock: ${newitem.stock}`)
      });
    } else {
      console.log("No old data found, skipping!")
    }

    // Finish up
    chrome.storage.local.set({ "lastFetched": parsed })
    chrome.storage.local.set({ "lastFetchedTime": Date.now() })
  })
}
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkAPI") {
    refresh()
  }
});
chrome.notifications.onClicked.addListener(notificationId => {
  if (notificationId === 'shop-diff-notif') {
    chrome.action.openPopup();
  }
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'refresh') {
    console.log("Manual refresh initiated!")
    refresh()
  }
})