"use strict";

(() => {
  let originalEvent = undefined;
  // See https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
  const targetButton = 2; // Right click
  const maxAllowedMoveDistance = 1; // px

  const addEventListenerOnce = (element, event, listener) => {
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

  const getNearestLink = (event) => {
    return event.target.tagName === 'a' ? event.target : event.target.closest('a');
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

  const onLinkMouseDown = (event) => {
    console.log(event);
    const target = getNearestLink(event);
    console.log(target);

    if (!target || hasModifiersOrIncorrectButton(event)) {
      cleanup();
      return;
    }
    const href = target.href;
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
    console.log(event);
    const target = getNearestLink(event);
    console.log(target);

    if (!target || hasModifiersOrIncorrectButton(event) || !originalEvent) {
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

    /**
     * Bugfix: The order of "contextmenu" firing differs on macOS and Windows, on macOS it fires before the body mouseup event, on Windows it fires after.
     * We delay cleanup so the original event is persisted on both cases.
     */
    setTimeout(() => {
      cleanup();
    }, 0);
    return false;
  };

  document.body.addEventListener("mouseup", onBodyMouseUp);
  document.body.addEventListener("mousedown", onLinkMouseDown);
  document.body.addEventListener("contextmenu", onLinkContextMenu);

  // // TODO: Instead of this, listen on body and check if target element has a link parent
  // document.querySelectorAll("a").forEach((element) => {
  //   addEventListenerOnce(element, "mousedown", onLinkMouseDown);
  //   addEventListenerOnce(element, "contextmenu", onLinkContextMenu);
  // });

  // const observer = new MutationObserver(() => {
  //   // Simply requery the whole document so we don't have to figure out which mutations apply to us
  //   document.querySelectorAll("a").forEach((element) => {
  //     addEventListenerOnce(element, "mousedown", onLinkMouseDown);
  //     addEventListenerOnce(element, "contextmenu", onLinkContextMenu);
  //   });
  // });
  // observer.observe(document.body, {
  //   subtree: true,
  //   childList: true,
  // });
})();
