"use strict";

(() => {
  window.__rcolianbt__ = window.__rcolianbt__ ?? false;
  if (window.__rcolianbt__) {
    return;
  }
  window.__rcolianbt__ = true;

  const MAX_RETRY = 25;

  const timeout = async (delayMs) => {
    return new Promise((resolve) => {
      setTimeout(() => resolve(), delayMs);
    });
  };

  const createTab = async (params) => {
    for (let _ of Array(MAX_RETRY)) {
      try {
        const newTab = await browser.tabs.create(params);
        if (newTab) {
          return newTab;
        }
      } catch (error) {
        console.error(error);
        console.log(browser.runtime.lastError);
        await timeout(100);
      }
    }
  };

  /**
   * When multiple tabs are created, ensure they're offset and placed after one another.
   * Whenever the user switches tabs, tracking is reset.
   */
  let createdTabCount = 0;
  browser.tabs.onActivated.addListener(async () => {
    createdTabCount = 0;
  });

  browser.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
    if (!sender.tab?.url || !request.urlToOpen) {
      return;
    }

    const senderTabId = sender.tab?.id;
    const senderTabIndex = sender.tab?.index;
    const index =
      typeof senderTabIndex === "undefined"
        ? undefined
        : senderTabIndex + 1 + createdTabCount;
    await createTab({
      url: request.urlToOpen,
      active: false,
      openerTabId: senderTabId,
      index: index,
    });
    createdTabCount = createdTabCount + 1;
  });

})();
