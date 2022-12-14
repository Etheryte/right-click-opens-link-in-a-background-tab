"use strict";

(() => {
  let originalEvent = undefined;
  // See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  const targetButton = 2; // Right click
  const maxAllowedMoveDistance = 1; // px

  const addEventListener = (element, event, listener) => {
    element.removeEventListener(event, listener);
    element.addEventListener(event, listener);
  };

  const hasModifiersOrIncorrectButton = (event) =>
    // If any modifiers are used, let the browser do whatever the native thing is
    event.altKey ||
    event.shiftKey ||
    event.ctrlKey ||
    event.metaKey ||
    event.button !== targetButton;

  const cleanup = () => {
    originalEvent = undefined;
  };

  const onLinkMouseDown = (event) => {
    if (hasModifiersOrIncorrectButton(event)) {
      cleanup();
      return;
    }
    originalEvent = {
      screenX: event.screenX,
      screenY: event.screenY,
      currentTarget: event.currentTarget,
    };
  };

  const onLinkContextMenu = (event) => {
    if (hasModifiersOrIncorrectButton(event) || !originalEvent) {
      cleanup();
      return;
    }
    event.preventDefault();
    return false;
  };

  const onBodyMouseUp = (event) => {
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

    if (originalEvent.currentTarget.href) {
      event.preventDefault();
      chrome.runtime.sendMessage({ href: originalEvent.currentTarget.href });
      cleanup();
      return false;
    }

    cleanup();
    return;
  };

  document.body.addEventListener("mouseup", onBodyMouseUp);
  Array.from(document.querySelectorAll("a")).forEach((element) => {
    addEventListener(element, "mousedown", onLinkMouseDown);
    addEventListener(element, "contextmenu", onLinkContextMenu);
  });
  // TODO: Add MutationObserver
})();
