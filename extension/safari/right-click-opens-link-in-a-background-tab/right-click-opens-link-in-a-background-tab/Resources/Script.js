//
//  Script.js
//  right-click-opens-link-in-a-background-tab
//
//  Created by eth on 2025-03-22.
//


function show(enabled) {
    if (typeof enabled === "boolean") {
        document.body.classList.toggle(`state-on`, enabled);
        document.body.classList.toggle(`state-off`, !enabled);
    } else {
        document.body.classList.remove(`state-on`);
        document.body.classList.remove(`state-off`);
    }
}

document.querySelector("button.open-preferences").addEventListener("click", () => webkit.messageHandlers.controller.postMessage("open-preferences"));
document.querySelector("button.close-app").addEventListener("click", () => webkit.messageHandlers.controller.postMessage("close-app"));
