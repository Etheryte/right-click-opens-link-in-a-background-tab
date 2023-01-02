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

  const onLinkMouseDown = (event) => {
    if (hasModifiersOrIncorrectButton(event)) {
      cleanup();
      return;
    }
    const href = event.currentTarget.href;
    if (isInvalid(href)) {
      cleanup();
      return;
    }

    originalEvent = {
      screenX: event.screenX,
      screenY: event.screenY,
      href: href,
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

    event.preventDefault();
    chrome.runtime.sendMessage({ href: originalEvent.href });
    cleanup();
    return false;
  };

  document.body.addEventListener("mouseup", onBodyMouseUp);
  document.querySelectorAll("a").forEach((element) => {
    addEventListener(element, "mousedown", onLinkMouseDown);
    addEventListener(element, "contextmenu", onLinkContextMenu);
  });

  const observer = new MutationObserver(() => {
    // Simply requery the whole document since it's more expensive to figure out which mutations apply to us
    document.querySelectorAll("a").forEach((element) => {
      addEventListener(element, "mousedown", onLinkMouseDown);
      addEventListener(element, "contextmenu", onLinkContextMenu);
    });
  });
  observer.observe(document.body, {
    subtree: true,
    childList: true,
  });
})();
