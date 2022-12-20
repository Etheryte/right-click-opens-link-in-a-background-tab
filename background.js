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

const getActiveTab = async () => {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs?.[0];
};

/**
 * When multiple tabs are created, ensure they're offset and placed after one another.
 * Whenever the user switches tabs, tracking is reset.
 */
let createdTabCount = 0;

chrome.tabs.onActivated.addListener(async () => {
  createdTabCount = 0;
  console.log("reset tab count");
});

chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
  if (!sender.tab.url || !request.href) {
    return;
  }

  // const senderTabId = sender.tab?.id;
  const activeTab = await getActiveTab();
  const activeTabIndex = activeTab?.index;
  const index =
    typeof activeTabIndex === "undefined"
      ? undefined
      : activeTabIndex + 1 + createdTabCount;
  const newTab = await createTab({
    url: request.href,
    active: false,
    openerTabId: activeTab?.id,
    index: index,
  });
  createdTabCount = createdTabCount + 1;
  // console.log(newTab);
});
