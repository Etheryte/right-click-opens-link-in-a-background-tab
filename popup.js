"use strict";

const PLACEHOLDER = "%5BYOUR+PAGE+URL+HERE%5D";

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs?.[0]?.url;
  if (!url) {
    return;
  }
  const encodedUrl = encodeURIComponent(url);
  const reportLink = document.getElementById("reportLink");
  if (!reportLink) {
    return;
  }
  reportLink.href = reportLink.href.replace(PLACEHOLDER, encodedUrl);
});
