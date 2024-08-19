import 'webextension-polyfill';
import { exampleThemeStorage } from '@extension/storage';

exampleThemeStorage.get().then(theme => {
  console.log('theme', theme);
});

console.log('background loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

chrome.commands.onCommand.addListener(command => {
  console.log(command);
  if (command === 'open-ktab') {
    getCurrentTab().then(tab => {
      console.log(tab);
      if (!tab) {
        return;
      }
      if (!tab.url?.includes('chrome://') && !tab.url?.includes('chrome.google.com')) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, { request: 'open-ktab' });
        }
      } else {
        // chrome.tabs
        //   .create({
        //     url: './newtab.html',
        //   })
        //   .then(() => {
        //     newtaburl = response.url;
        //     chrome.tabs.remove(response.id);
        //   });
      }
    });
  }
});

const getCurrentTab = async () => {
  const queryOptions = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};
