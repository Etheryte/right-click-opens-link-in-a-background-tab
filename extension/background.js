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

let id = 0;

chrome.declarativeNetRequest.getDynamicRules().then(oldRules => {
  const oldRuleIds = oldRules.map(rule => rule.id);
  console.log('remove', oldRuleIds);
  chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldRuleIds,
  });
})

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    if (details.type !== "main_frame" || details.method !== "GET") {
        return;
    }
    const url = details.url;
    // console.log(details);
    // chrome.declarativeNetRequest.updateDynamicRules({
    //   addRules: [{
    //     action: {
    //       type: "redirect",
    //       redirect: {
    //         url: 'http://google.com/gen_204'
    //       },
    //     },
    //     condition: {
    //       regexFilter: `^${details.url.replaceAll(".", "\\.")}$`,
    //       "resourceTypes": [
    //         "main_frame"
    //       ]
    //     },
    //     id: ++id,
    //   }],
    // });
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve();
      }, 5000);
    });
  },
  { urls: ["<all_urls>"] },
  []
  // ["blocking"],
);

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
