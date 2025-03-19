"use strict";

const DEBUG_PREFIX = 'RCOLIANBT:';
const DATA_PROPERTY = 's123jkdvk';
const log = console.info.bind(console, DEBUG_PREFIX);

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

  let originalEvent = undefined;
  // See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  const targetButton = 2; // Right click
  const maxAllowedMoveDistance = 1; // px

  const hasModifiersOrIncorrectButton = (event) =>
    // If any modifiers are used, let the browser do whatever the native thing is
    event.altKey ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.button !== targetButton;

  function processElements(elements, x, y, allLinks, processed = new Set()) {
    elements.forEach(element => {
      if (processed.has(element)) return;
      processed.add(element);
      
      if (element.tagName.toLowerCase() === 'a' && !isInvalid(element.href)) {
        allLinks.add(element);
      }
      
      if (element.shadowRoot) {
        const shadowElements = element.shadowRoot.elementsFromPoint(x, y);
        processElements(shadowElements, x, y, allLinks, processed);
      }
    });
  }
  
  // Some pages hide links in shadow roots etc, try and retrieve those if all else fails
  function getAllLinksAtCoordinates(x, y) {
    const allLinks = new Set();
    const processed = new Set();
    
    const mainElements = document.elementsFromPoint(x, y);
    processElements(mainElements, x, y, allLinks, processed);
    
    return allLinks;
  }
  
  const getNearestLink = (event) => {
    // If the event fired on the link itself
    if (event.target.tagName === 'a' && !isInvalid(a.href)) {
      return event.target;
    }

    // If there's a link close by in the tree
    const closest = event.target.closest('a');
    if (closest && !isInvalid(closest.href)) {
      return closest;
    }

    // All else fails, try and find a link by coordinates
    const atCoordinates = getAllLinksAtCoordinates(event.clientX, event.clientY);
    if (atCoordinates.size === 1) {
      return atCoordinates.values().next().value;
    }
    return undefined;
  }

  const isInvalid = (href) => {
    if (!href) {
      return true;
    }
    // If we're dealing with a Js-bound link or similar, do nothing
    return href.startsWith("javascript:") || href === "#";
  };

  const cleanup = () => {
    originalEvent = undefined;
  };

  const onBodyMouseDown = (event) => {
    log('onBodyMouseDown');
    const target = getNearestLink(event);
    log(target);

    if (!target || hasModifiersOrIncorrectButton(event)) {
      cleanup();
      return;
    }

    originalEvent = {
      screenX: event.screenX,
      screenY: event.screenY,
      [DATA_PROPERTY]: target.href,
    };
    log(originalEvent);

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onBodyContextMenu = (event) => {
    log('onBodyContextMenu');
    if (hasModifiersOrIncorrectButton(event) || !originalEvent) {
      cleanup();
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const onBodyMouseUp = (event) => {
    log('onBodyMouseUp');
    if (hasModifiersOrIncorrectButton(event) || !originalEvent) {
      cleanup();
      return;
    }

    // If the user moved the mouse away, don't follow the link
    if (
      Math.abs(event.screenX - originalEvent.screenX) >
        maxAllowedMoveDistance ||
      Math.abs(event.screenY - originalEvent.screenY) > maxAllowedMoveDistance
    ) {
      cleanup();
      return;
    }

    currentBrowser.runtime.sendMessage({ [DATA_PROPERTY]: originalEvent[DATA_PROPERTY] });
    /**
     * Bugfix: The order of "contextmenu" firing differs on macOS and Windows, on macOS it fires before the body mouseup event, on Windows it fires after.
     * We delay cleanup so the original event is persisted on both cases.
     */
    setTimeout(() => {
      cleanup();
    }, 0);

    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  document.body.addEventListener("mousedown", onBodyMouseDown);
  document.body.addEventListener("contextmenu", onBodyContextMenu);
  document.body.addEventListener("mouseup", onBodyMouseUp);
})();
