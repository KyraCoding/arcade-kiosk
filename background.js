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
  /*
  chrome.notifications.create('shop-diff-notif', {
    type: 'list',
    iconUrl: 'assets/favicon.png',
    title: "Shop update 🎉",
    message: "test",
    items: [{title:"test",message:"test"}],
    priority: 2,
    requireInteraction: true
  });
  */
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
  chrome.storage.local.get("lastFetched", function (fetched) {
    olddata = fetched.lastFetched
    added = []
    stocked = []
    priced = []
    removed = []
    olddata[Object.keys(olddata)[0]].stock = "33"
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
      chrome.storage.local.get("history", function (fetched) {
        data = fetched.history
        if (data == undefined) {
          data = []
        }
        data.unshift({ type: "new", title: change.name, change: `New item! (Cost: ${change.new.hours} ticket${formatPlural(change.new.hours)})` })
        chrome.storage.local.set({ "history": data })
      })
    })
    stocked.forEach((change) => {
      notifs.push({
        title: `${change.name}'s stock: ${change.old.stock} > ${change.new.stock}!`,
        message: ""
      })
      chrome.storage.local.get("history", function (fetched) {
        data = fetched.history
        if (data == undefined) {
          data = []
        }
        data.unshift({ type: change.old.stock > change.new.stock ? "decrease" : "increase", title: change.name, change: `Stock ${change.old.stock > change.new.stock ? "decreased" : "increased"} to ${change.new.stock} (was ${change.old.stock})` })
        chrome.storage.local.set({ "history": data })
      })
    })
    priced.forEach((change) => {
      notifs.push({
        title: `${change.name}'s stock: ${change.old.hours} > ${change.new.hours} tickets!`,
        message: ""
      })
      chrome.storage.local.get("history", function (fetched) {
        data = fetched.history
        if (data == undefined) {
          data = []
        }
        data.unshift({ type: change.old.hours > change.new.hours ? "decrease" : "increase", title: change.name, change: `Price ${change.old.hours > change.new.hours ? "decreased" : "increased"} to ${change.new.hours} (was ${change.old.hours})` })
        chrome.storage.local.set({ "history": data })
      })
    })
    // Notify
    if (notifs.length > 0) {
      console.log(notifs)
      chrome.notifications.create('shop-diff-notif', {
        type: 'list',
        iconUrl: 'assets/favicon.png',
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

// On extension click, clear on click
chrome.notifications.onClicked.addListener(function (id) {
  chrome.notifications.clear(id);
});


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