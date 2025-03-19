"use strict";

const DEBUG_PREFIX = 'RCOLIANBT:';
const DATA_PROPERTY = 's123jkdvk';
const log = console.info.bind(console, DEBUG_PREFIX);

let currentBrowser;
if ('browser' in globalThis) {
  currentBrowser = globalThis['browser'];
} else if ('chrome' in globalThis) {
  currentBrowser = globalThis['chrome'];
} else if ('safari' in globalThis) {
  currentBrowser = globalThis['safari'];
} else {
  throw new RangeError('No supported browser found');
}

const MAX_RETRY = 25;

const timeout = async (delayMs) => {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delayMs);
  });
};

const createTab = async (params) => {
  for (let _ of Array(MAX_RETRY)) {
    log('try', _, params);
    try {
      const newTab = await currentBrowser.tabs.create(params);
      if (newTab) {
        return newTab;
      }
    } catch (error) {
      console.error(error);
      log(currentBrowser.runtime.lastError);
      await timeout(100);
    }
  }
};

/**
 * When multiple tabs are created, ensure they're offset and placed after one another.
 * Whenever the user switches tabs, tracking is reset.
 */
let createdTabCount = 0;
const onActivated = async () => {
  createdTabCount = 0;
};

const onMessage = async (request, sender) => {
  log('received link', request[DATA_PROPERTY]);
  if (!sender.tab?.url || !request[DATA_PROPERTY]) {
    return true;
  }

  const senderTabId = sender.tab?.id;
  const senderTabIndex = sender.tab?.index;
  const index =
    typeof senderTabIndex === "undefined"
      ? undefined
      : senderTabIndex + 1 + createdTabCount;
  await createTab({
    url: request[DATA_PROPERTY],
    active: false,
    openerTabId: senderTabId,
    index: index,
  });
  createdTabCount = createdTabCount + 1;
};

currentBrowser.runtime.onMessage.removeListener(onMessage);
currentBrowser.tabs.onActivated.removeListener(onActivated);
currentBrowser.runtime.onMessage.addListener(onMessage);
currentBrowser.tabs.onActivated.addListener(onActivated);
