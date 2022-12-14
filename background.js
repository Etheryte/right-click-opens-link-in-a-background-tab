"use strict";

const getActiveTab = (callback) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    return callback(null, tabs && tabs[0] ? tabs[0] : null);
  });
};

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (!sender.tab.url || !request.href) {
    return;
  }
  getActiveTab((_, tab) => {
    chrome.tabs.create({
      url: request.href,
      // active: false,
      openerTabId: tab?.id,
    });
  });
});
