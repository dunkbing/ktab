import type { Suggestion } from './types';

export const commands = {
  getSuggestions: 'GET_SUGGESTIONS',
  switchTab: 'SWITCH_TAB',
  newTab: 'NEW_TAB',
  clearHistory: 'CLEAR_HISTORY',
  clearCache: 'CLEAR_CACHE',
  clearCookies: 'CLEAR_COOKIES',
  clearLocalStorage: 'CLEAR_LOCAL_STORAGE',
  bookmarkCurrentTab: 'BOOKMARK_CURRENT_TAB',
  removeBookmark: 'REMOVE_BOOKMARK',
  pinCurrentTab: 'PIN_CURRENT_TAB',
  muteCurrentTab: 'MUTE_CURRENT_TAB',
  reloadCurrentTab: 'RELOAD_CURRENT_TAB',
  fullscreenCurrentTab: 'FULLSCREEN_CURRENT_TAB',
  printCurrentTab: 'PRINT_CURRENT_TAB',
  closeCurrentTab: 'CLOSE_CURRENT_TAB',
  duplicateCurrentTab: 'DUPLICATE_CURRENT_TAB',
  openIncognitoWindow: 'OPEN_INCOGNITO_WINDOW',
  clearOtherTabs: 'CLEAR_OTHER_TABS',
};

const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;

export const actions: Suggestion[] = [
  {
    content: commands.bookmarkCurrentTab,
    description: 'Bookmark current tab',
    type: 'action',
    iconUrl: 'Bookmark',
    action: () => chrome.runtime.sendMessage({ type: commands.bookmarkCurrentTab }),
    shortcut: isMac ? '⌘D' : 'Ctrl+D',
  },
  {
    content: commands.removeBookmark,
    description: 'Remove bookmark for current tab',
    type: 'action',
    iconUrl: 'RemoveBookmark',
    action: () => chrome.runtime.sendMessage({ type: commands.removeBookmark }),
  },
  {
    content: commands.pinCurrentTab,
    description: 'Pin/Unpin current tab',
    type: 'action',
    iconUrl: 'Pin',
    action: () => chrome.runtime.sendMessage({ type: commands.pinCurrentTab }),
  },
  {
    content: commands.muteCurrentTab,
    description: 'Mute/Unmute current tab',
    type: 'action',
    iconUrl: 'Mute',
    action: () => chrome.runtime.sendMessage({ type: commands.muteCurrentTab }),
    shortcut: isMac ? '⌥⌘M' : 'Alt+Shift+M',
  },
  {
    content: commands.reloadCurrentTab,
    description: 'Reload current tab',
    type: 'action',
    iconUrl: 'Reload',
    action: () => chrome.runtime.sendMessage({ type: commands.reloadCurrentTab }),
    shortcut: isMac ? '⌘R' : 'Ctrl+R',
  },
  {
    content: commands.fullscreenCurrentTab,
    description: 'Toggle fullscreen for current tab',
    type: 'action',
    iconUrl: 'Fullscreen',
    action: () => chrome.runtime.sendMessage({ type: commands.fullscreenCurrentTab }),
    shortcut: 'F11',
  },
  {
    content: commands.printCurrentTab,
    description: 'Print current tab',
    type: 'action',
    iconUrl: 'Print',
    action: () => chrome.runtime.sendMessage({ type: commands.printCurrentTab }),
    shortcut: isMac ? '⌘P' : 'Ctrl+P',
  },
  {
    content: commands.closeCurrentTab,
    description: 'Close current tab',
    type: 'action',
    iconUrl: 'Close',
    action: () => chrome.runtime.sendMessage({ type: commands.closeCurrentTab }),
    shortcut: isMac ? '⌘W' : 'Ctrl+W',
  },
  {
    content: commands.duplicateCurrentTab,
    description: 'Duplicate current tab',
    type: 'action',
    iconUrl: 'Duplicate',
    action: () => chrome.runtime.sendMessage({ type: commands.duplicateCurrentTab }),
  },
  {
    content: commands.clearOtherTabs,
    description: 'Close all tabs except the current one',
    type: 'action',
    iconUrl: 'CloseOthers',
    action: () => chrome.runtime.sendMessage({ type: commands.clearOtherTabs }),
  },
  {
    content: commands.openIncognitoWindow,
    description: 'Open new incognito window',
    type: 'action',
    iconUrl: 'Incognito',
    action: () => chrome.runtime.sendMessage({ type: commands.openIncognitoWindow }),
    shortcut: isMac ? '⌘⇧N' : 'Ctrl+Shift+N',
  },
  {
    content: commands.clearCache,
    description: 'Clear browser cache',
    type: 'action',
    iconUrl: 'Cache',
    action: () => chrome.runtime.sendMessage({ type: commands.clearCache }),
  },
  {
    content: commands.clearHistory,
    description: 'Clear browsing history',
    type: 'action',
    iconUrl: 'History',
    action: () => chrome.runtime.sendMessage({ type: commands.clearHistory }),
  },
  {
    content: commands.clearCookies,
    description: 'Clear cookies',
    type: 'action',
    iconUrl: 'Cookies',
    action: () => chrome.runtime.sendMessage({ type: commands.clearCookies }),
  },
  {
    content: commands.clearLocalStorage,
    description: 'Clear local storage',
    type: 'action',
    iconUrl: 'LocalStorage',
    action: () => chrome.runtime.sendMessage({ type: commands.clearLocalStorage }),
  },
  {
    content: 'https://docs.new',
    description: 'Create a new Google Docs document',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/docs.png'),
  },
  {
    content: 'https://slides.new',
    description: 'Create a new Google Slides presentation',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/slides.png'),
  },
  {
    content: 'https://sheets.new',
    description: 'Create a new Google Sheets spreadsheet',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/sheets.png'),
  },
  {
    content: 'https://meet.new',
    description: 'Start a new Google Meet',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/meet.png'),
  },
  {
    content: 'https://www.notion.so/new',
    description: 'Create a new Notion page',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/notion.png'),
  },
  {
    content: 'https://github.com/new',
    description: 'Create a new GitHub repository',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/github.svg'),
  },
  {
    content: 'https://text2audio.cc',
    description: 'Text to Speech',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/text2audio.ico'),
  },
  {
    content: 'https://trello.com/create-board',
    description: 'Create new Trello board',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/trello.png'),
  },
  {
    content: 'https://figma.new',
    description: 'Create a new Figma design file',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/figma.png'),
  },
  {
    content: 'https://codepen.io/pen/',
    description: 'Create a new CodePen',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/codepen.ico'),
  },
];
