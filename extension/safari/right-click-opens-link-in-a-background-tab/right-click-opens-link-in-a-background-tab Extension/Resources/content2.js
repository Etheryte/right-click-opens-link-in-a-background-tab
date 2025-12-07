"use strict";

const DEBUG = false;
const DEBUG_PREFIX = 'RCOLIANBT:';
const DATA_PROPERTY = 'eum2f0';
const log = DEBUG ? console.info.bind(console, DEBUG_PREFIX) : () => {};
const err = console.error.bind(console, DEBUG_PREFIX);

(() => {
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

  // currentBrowser.runtime.sendMessage({ [DATA_PROPERTY]: originalEvent[DATA_PROPERTY] });

  // content.js

  function recordLastMouseButton(event) {
    // 0: Left button, 2: Right button
    const mouseButton = event.button; 
    
    // Only record clicks that involve the main two buttons for navigation
    if (mouseButton === 0 || mouseButton === 2) {
      // Store the button state in the tab's session storage.
      // This value is accessible immediately by the background worker.
      sessionStorage.setItem('lastMouseButton', mouseButton);
    }
  }

  // Listen for the mousedown event on the entire document in the capture phase.
  // This executes before any site-specific JS handles the click.
  document.addEventListener('mousedown', recordLastMouseButton, true);
})();
