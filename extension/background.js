"use strict";

const MAX_RETRY = 25;

const timeout = async (delayMs) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delayMs);
  });
};

const createTab = async (params) => {
  for (let _ of Array(MAX_RETRY)) {
    try {
      const newTab = await chrome.tabs.create(params);
      if (newTab) {
        return newTab;
      }
    } catch (error) {
      console.error(error);
      console.log(chrome.runtime.lastError);
      await timeout(100);
    }
  }
};

/**
 * When multiple tabs are created, ensure they're offset and placed after one another.
 * Whenever the user switches tabs, tracking is reset.
 */
let createdTabCount = 0;
chrome.tabs.onActivated.addListener(async () => {
  createdTabCount = 0;
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (!sender.tab?.url || !request.href) {
    return;
  }

  const senderTabId = sender.tab?.id;
  const senderTabIndex = sender.tab?.index;
  const index =
    typeof senderTabIndex === "undefined"
      ? undefined
      : senderTabIndex + 1 + createdTabCount;
  await createTab({
    url: request.href,
    active: false,
    openerTabId: senderTabId,
    index: index,
  });
  createdTabCount = createdTabCount + 1;
});
