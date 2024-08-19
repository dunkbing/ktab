import { toggleTheme } from '@lib/toggleTheme';

console.log('content script loaded');

void toggleTheme();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log(message.request);
  // if (message.request == "open-omni") {
  // 	if (isOpen) {
  // 		closeOmni();
  // 	} else {
  // 		openOmni();
  // 	}
  // } else if (message.request == "close-omni") {
  // 	closeOmni();
  // }
});
