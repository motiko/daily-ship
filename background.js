let optionsTabId = ""

function openOptionsTab() {
  if(optionsTabId){
    chrome.tabs.get(optionsTabId, (tab) => {
      if(tab) chrome.tabs.update(tab.id, {active: true})
      chrome.windows.getCurrent({}, (currentWindow) => {
        if(tab.windowId != currentWindow.id){
          chrome.windows.update(tab.windowId, {focused: true})
        }
      })
    })
  }
  else{
    chrome.tabs.create({'url': chrome.extension.getURL('popup.html'),
      'selected': true}, (tab) => optionsTabId = tab.id);
  }
}

chrome.browserAction.onClicked.addListener(openOptionsTab)

chrome.tabs.onRemoved.addListener((tabId, changeInfo, tab) => {
  if(optionsTabId == tabId)
    optionsTabId = ""
})
