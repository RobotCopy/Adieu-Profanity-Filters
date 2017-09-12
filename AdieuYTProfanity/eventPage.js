// Open options page if extension icon is clicked
chrome.browserAction.setBadgeBackgroundColor({color: "#446644"});
chrome.browserAction.onClicked.addListener(function() {chrome.runtime.openOptionsPage();});

// Actions for extension install or upgrade
chrome.runtime.onInstalled.addListener(function(details){
  if (details.reason == "install"){
    chrome.runtime.openOptionsPage();
  } else if (details.reason == "update") {
    // var thisVersion = chrome.runtime.getManifest().version;
    // console.log("Updated from " + details.previousVersion + " to " + thisVersion + "!");
  }
});

chrome.tabs.onUpdated.addListener(function(tabId, change, tab) {
    if (change.status == "complete") {
        updatePageAction(tabId);
    }
});

function updatePageAction(tabId){
	chrome.tabs.sendMessage(tabId, {is_content_script: true}, function(response) {
		if(response){
			if (response.is_content_script)
			chrome.pageAction.show(tabId);
		}
	});
};

//Look for Intimation from Content Script for rerun of Injection
chrome.extension.onMessage.addListener(function (request, sender, callback) {
	chrome.browserAction.setBadgeText({text: request.counter, tabId: sender.tab.id});
	if(request.color && request.color!="none"){
		chrome.browserAction.setIcon({ 
			path:{
				16:"icons/icon16_"+request.color+".png",
				48:"icons/icon48_"+request.color+".png"
			},
			tabId: sender.tab.id
		});
	}
});
