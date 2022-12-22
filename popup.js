"use strict";

const PLACEHOLDER = "<YOUR PAGE URL HERE>";

// Source: ~/Repositories/right-click-opens-link-in-a-new-background-tab-public/.github/ISSUE_TEMPLATE/broken-link.md
const ISSUE_TEMPLATE = `**What's the URL of the page?**

URL of the page: ${PLACEHOLDER}

**Is it a public page?**

If the page is not public I can't help you with your issue. I can't debug what I can't access, sorry.  
To check the checkbox, put an \`x\` between the brackets below: \`[ ]\` -> \`[x]\`

 - [ ] Yes, it is a public page

**Where is the link on that page?**

Please insert either a screenshot or a description of where the link is to help me find it:  
`;

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const url = tabs?.[0]?.url ?? "";
  const reportLink = document.getElementById("reportLink");
  if (!reportLink) {
    return;
  }
  reportLink.href = reportLink.href + `&body=${encodeURIComponent(ISSUE_TEMPLATE.replace(PLACEHOLDER, url))}`;
});
