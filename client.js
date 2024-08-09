async function delay(ms) {
    // return await for better async stack trace support in case of errors.
    return await new Promise(resolve => setTimeout(resolve, ms));
}
async function checkForUpdates() {
    console.log("Fetching!")
    var response = await fetch("https://hackclub.com/api/arcade/shop/")
    var data = await response.json()
    //document.getElementById("data").innerHTML = JSON.stringify(data)
    await delay(10000)
    await checkForUpdates()
}
checkForUpdates()
