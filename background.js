chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!")
  chrome.alarms.create('checkAPI', { periodInMinutes: 0.5 });
});
function formatPlural(num) {
  if (num == 1) {
    return ""
  } else {
    return "s"
  }
}

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

  // Get old data
  var old = chrome.storage.local.get("lastFetched", function (fetched) {
    olddata = fetched.lastFetched
    console.log(Object.keys(olddata))
    console.log(olddata[Object.keys(olddata)[0]])
    olddata[Object.keys(olddata)[0]].stock = 0;
    console.log(olddata[Object.keys(olddata)[0]])

    added = []
    changed = []
    removed = []

    if (Object.keys(olddata).length > 0) {
      Object.keys(parsed).forEach(key => {
        var olditem = olddata[key]
        var newitem = parsed[key]
        if (newitem.stock == null) newitem.stock == Infinity
        if (olditem.stock == null) olditem.stock == Infinity
        if (olditem == undefined) {
          added.push({ name: key, old: olditem, new: newitem })
        } else if (olditem?.stock != newitem?.stock) {
          changed.push({ name: key, old: olditem, new: newitem })
        }
        console.log(`Checking ${key}:\nOld stock: ${olditem.stock == Infinity ? "unlimited" : olditem.stock}\nNew stock: ${newitem.stock == Infinity ? "unlimited" : newitem.stock}`)
      });
    } else {
      console.log("No old data found, skipping!")
    }

    console.log(added)

    // Format
    addedNotif = []
    changedNotif = []
    removedNotif = []

    added.forEach((change) => {
      addedNotif.push({
        title: `${change.name} has been added! (${change.new.hours} ticket${formatPlural(change.new.hours)})`,
        message: ""
      })
    })
    changed.forEach((change) => {
      changedNotif.push({
        title: `${change.name}'s stock has ${change.new.hours > change.old.hours ? "increased" : "decreased"}!`,
        message: ""
      })
    })
    console.log(addedNotif)
    console.log(changedNotif)

    // Notify
    if (addedNotif.length > 0) {
      chrome.notifications.create('shop-diff-notif', {
        type: 'list',
        title: "Shop update :3",
        iconUrl: 'favicon.png',
        message: added.length == 1 ? "A new item has been added!" : "New items have been added!",
        items: addedNotif,
        priority: 2
      });
    }
    if (changedNotif.length > 0) {
      chrome.notifications.create('shop-diff-notif', {
        type: 'list',
        iconUrl: 'favicon.png',
        title: "Shop update :3",
        message: changed.length == 1 ? "A item's stock has changed!" : "Items' stock have changed!",
        items: changedNotif,
        priority: 2
      });
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
    //chrome.action.openPopup();
  }
});

self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'refresh') {
    console.log("Manual refresh initiated!")
    refresh()
  }
})