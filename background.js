// Run on extention reload/install
chrome.runtime.onInstalled.addListener(async () => {
  console.log("Installed!")
  chrome.alarms.create('checkAPI', { periodInMinutes: 5 });
});

// Utility function to handle plurality
function formatPlural(num) {
  if (num == 1) {
    return ""
  } else {
    return "s"
  }
}

// Main function. Checks for shop inventory changes
async function refresh() {
  // Fetch
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
    added = []
    stocked = []
    priced = []
    removed = []

    if (Object.keys(olddata).length > 0) {
      Object.keys(parsed).forEach(key => {
        var olditem = olddata[key]
        var newitem = parsed[key]

        // Handle "unlimited" items
        if (newitem.stock == null) newitem.stock = Infinity
        if (olditem.stock == null) olditem.stock = Infinity

        // If it's a new item (yay!)
        if (olditem == undefined) {
          added.push({ name: key, old: olditem, new: newitem })

          // If stock changes (ono)
        } else if (olditem.stock != newitem.stock) {
          stocked.push({ name: key, old: olditem, new: newitem })

          // If ticket prices change (ono)
        } else if (olditem.hours != newitem.hours) {
          priced.push({ name: key, old: olditem, new: newitem })
        }
      });
    } else {
      // Usually on first run, we dont wanna flood notifs
      console.log("No old data found, skipping!")
    }


    // Format
    var notifs = []

    added.forEach((change) => {
      notifs.push({
        title: `${change.name} has been added! (${change.new.hours} ticket${formatPlural(change.new.hours)})`,
        message: ""
      })
    })
    stocked.forEach((change) => {
      notifs.push({
        title: `${change.name}'s stock: ${change.old.stock} > ${change.new.stock}!`,
        message: ""
      })
    })
    priced.forEach((change) => {
      notifs.push({
        title: `${change.name}'s stock: ${change.old.hours} > ${change.new.hours} tickets!`,
        message: ""
      })
    })
    // Notify
    if (notifs.length > 0) {
      console.log(notifs)
      chrome.notifications.create('shop-diff-notif', {
        type: 'list',
        iconUrl: 'favicon.png',
        title: "Shop update 🎉",
        message: priced.length == 1 ? "A item has changed!" : "Items have changed!",
        items: notifs,
        priority: 2,
        requireInteraction: true
      });
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#00AFB3' });
    }
    // Finish up
    chrome.storage.local.set({ "lastFetched": parsed })
    chrome.storage.local.set({ "lastFetchedTime": Date.now() })
    self.clients.matchAll({ includeUncontrolled: true, type: 'window' }).then(clients => {
      clients.forEach(client => {
        client.postMessage({
          type: 'refresh'
        });
      });
    });
  })
}

// Activates on set interval
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkAPI") {
    refresh()
  }
});

// Communication between popup and service worker
self.addEventListener('message', function (event) {
  if (event.data && event.data.type === 'refresh') {
    console.log("Manual refresh initiated!")
    refresh()
  }
})