"use strict";

const DEBUG = false;
const DEBUG_PREFIX = 'RCOLIANBT:';
const DATA_PROPERTY = 'eum2f0';
const log = DEBUG ? console.info.bind(console, DEBUG_PREFIX) : () => {};
const err = console.error.bind(console, DEBUG_PREFIX);

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
// background.js

const NAVIGATION_BLOCK_RULE_ID = 100;

// Function to apply the block rule
async function applyBlockRule() {
  const rule = [{
    "id": NAVIGATION_BLOCK_RULE_ID,
    "priority": 100,
    "action": { "type": "block" },
    "condition": {
      "resourceTypes": ["main_frame"],
      "urlFilter": "*" // Block ALL main frame requests when active
    }
  }];

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [NAVIGATION_BLOCK_RULE_ID], 
    addRules: rule
  });
  console.log('Block rule APPLIED for right-click cancellation.');
}

// Function to remove the block rule
async function removeBlockRule() {
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [NAVIGATION_BLOCK_RULE_ID]
  });
  console.log('Block rule REMOVED.');
}

// --- Initial State: Unblocked ---
removeBlockRule(); 
// The block rule is only applied when a right-click is detected.

chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  // Only process top-level navigation attempts
  if (details.frameId !== 0) {
    return;
  }
  
  const tabId = details.tabId;
  
  // 1. IGNORE MANUAL NAVIGATION (URL BAR, BOOKMARKS)
  if (details.sourceFrameId === -1) {
    console.log(`Tab ${tabId}: Manual navigation (URL bar). Allowing.`);
    // Since default state is unblocked, we do nothing.
    return; 
  }
  
  // 2. --- LOGIC FOR INTERACTION-BASED NAVIGATION (Click/JS) ---
  let lastMouseButton = null;

  try {
    // Read the button state saved by the content script
    const results = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => sessionStorage.getItem('lastMouseButton'),
    });
    
    lastMouseButton = results[0]?.result;

    // Clean up the storage immediately
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => sessionStorage.removeItem('lastMouseButton'),
    });

  } catch (error) {
    // Log non-fatal error page interaction
    console.warn(`Click state read failed (frame error likely): ${error.message}`);
  }
  
  // 3. Apply Decision Logic
  if (lastMouseButton === '2') {
    // Right-click detected: Block this single navigation attempt.
    console.log(`Tab ${tabId}: Right-click detected. **APPLYING BLOCK RULE**.`);
    await applyBlockRule();
    
    // NOTE: The navigation is now blocked. We must immediately remove the 
    // rule so that the next navigation attempt (manual or left-click) is allowed.
    setTimeout(removeBlockRule, 50);

  } else {
    // Left-click (0) or no data: Allow navigation.
    console.log(`Tab ${tabId}: Left-click or no data. Allowing navigation.`);
    // Since the default is unblocked, we do nothing.
  }
});