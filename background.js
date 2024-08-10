chrome.runtime.onInstalled.addListener(async () => {
    console.log("Installed!")
    chrome.alarms.create('checkAPI', { periodInMinutes: 0.5 });
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "checkAPI") {
      var data = await (await fetch("https://hackclub.com/api/arcade/shop/")).json()
      console.log(data)
  }
});