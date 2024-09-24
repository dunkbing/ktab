import 'webextension-polyfill';
import { commands, actions } from '@extension/shared/lib/constants';
import type { Suggestion } from '@extension/shared/lib/types';

console.log('KTab background loaded');

chrome.action.onClicked.addListener(tab => {
  if (tab.id) {
    chrome.tabs.sendMessage(tab.id, { request: 'toggle-ktab' });
  }
});

chrome.commands.onCommand.addListener(async command => {
  if (command === 'toggle-ktab') {
    const tab = await getCurrentTab();
    console.log(tab);
    if (!tab) {
      return;
    }
    if (!tab.url?.includes('chrome://') && !tab.url?.includes('chrome.google.com')) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { request: command });
      }
    }
  }
});

const getCurrentTab = async () => {
  const queryOptions: chrome.tabs.QueryInfo = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

const searchActions = (input: string): Suggestion[] => {
  input = input.toLowerCase();
  return actions.filter(
    action => action.description.toLowerCase().includes(input) || action.content.toLowerCase().includes(input),
  );
};

const fetchGoogleSuggestions = async (input: string, limit: number = 5): Promise<Suggestion[]> => {
  try {
    const response = await fetch(
      `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(input)}`,
    );
    const data: [string, string[]] = await response.json();
    const results: Suggestion[] = data[1].slice(0, limit).map(suggestion => ({
      content: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
      description: `Search Google for: ${suggestion}`,
      type: 'search',
    }));
    results.unshift({
      content: `https://www.google.com/search?q=${encodeURIComponent(input)}`,
      description: `Search Google for: ${input}`,
      type: 'search',
    });
    return results;
  } catch (error) {
    console.error('Error fetching Google suggestions:', error);
    return [];
  }
};

const fetchFavicon = async (url: string): Promise<string> => {
  try {
    const response = await fetch(`https://s2.googleusercontent.com/s2/favicons?domain=${url}`);
    if (response.ok) {
      return response.url;
    }
  } catch (error) {
    console.error('Error fetching favicon:', error);
  }
  return chrome.runtime.getURL('/assets/default-favicon.png');
};

const searchHistory = async (input: string, maxResults = 5): Promise<Suggestion[]> => {
  return new Promise(resolve => {
    chrome.history.search({ text: input, maxResults }, async historyItems => {
      const suggestions = await Promise.all(
        historyItems.map(async item => ({
          content: item.url!,
          description: `History: ${item.title}`,
          type: 'history' as const,
          iconUrl: await fetchFavicon(item.url!),
        })),
      );
      resolve(suggestions);
    });
  });
};

const searchBookmarks = async (input: string, maxResults = 5): Promise<Suggestion[]> => {
  return new Promise(resolve => {
    chrome.bookmarks.search(input, async bookmarkItems => {
      const suggestions = await Promise.all(
        bookmarkItems.slice(0, maxResults).map(async item => ({
          content: item.url!,
          description: `Bookmark: ${item.title}`,
          type: 'bookmark' as const,
          iconUrl: await fetchFavicon(item.url!),
        })),
      );
      resolve(suggestions);
    });
  });
};

const searchTabs = async (input: string): Promise<Suggestion[]> => {
  return new Promise(resolve => {
    chrome.tabs.query({}, async tabs => {
      const matchingTabs = tabs.filter(tab => tab.title && tab.title.toLowerCase().includes(input.toLowerCase()));
      const suggestions = await Promise.all(
        matchingTabs.map(async tab => ({
          content: tab.url!,
          description: `Tab: ${tab.title}`,
          iconUrl: tab.favIconUrl || (await fetchFavicon(tab.url!)),
          type: 'tab' as const,
          tabId: tab.id,
        })),
      );
      resolve(suggestions);
    });
  });
};

function isWebsite(input: string): boolean {
  const cleanInput = input.replace(/^(https?:\/\/)/, '');
  const websiteRegex = /^([\w-]+\.)+[\w-]{2,}(\/.*)?$/;
  return websiteRegex.test(cleanInput);
}

async function getWebsiteSuggestion(input: string): Promise<Suggestion> {
  const url = input.startsWith('http://') || input.startsWith('https://') ? input : `https://${input}`;

  return {
    content: url,
    description: `Go to ${input}`,
    type: 'website',
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === commands.getSuggestions && request.input) {
    const input = request.input as string;
    const prefix = request.prefix as string | undefined;

    let resultsCount = 0;
    const maxResults = 30;

    const sendPartialResults = (suggestions: Suggestion[]) => {
      chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
        if (tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { type: 'PARTIAL_SUGGESTIONS', suggestions });
        }
      });
    };

    (async () => {
      if (prefix === 'history') {
        const suggestions = await searchHistory(input, maxResults);
        sendPartialResults(suggestions);
        return;
      } else if (prefix === 'bookmark') {
        const suggestions = await searchBookmarks(input, maxResults);
        sendPartialResults(suggestions);
        return;
      } else if (prefix === 'tab') {
        const suggestions = await searchTabs(input);
        sendPartialResults(suggestions);
        return;
      } else if (prefix === 'action') {
        const suggestions = searchActions(input);
        sendPartialResults(suggestions);
        return;
      }

      if (isWebsite(input)) {
        const websiteSuggestion = await getWebsiteSuggestion(input);
        sendPartialResults([websiteSuggestion]);
        resultsCount++;
      }

      const sendResults = (suggestions: Suggestion[]) => {
        if (resultsCount < maxResults) {
          const newSuggestions = suggestions.slice(0, maxResults - resultsCount);
          sendPartialResults(newSuggestions);
          resultsCount += newSuggestions.length;
        }
      };

      searchTabs(input).then(sendResults);
      fetchGoogleSuggestions(input).then(sendResults);
      Promise.resolve(searchActions(input)).then(sendResults);
    })();

    sendResponse({ processing: true });
    return true;
  } else if (request.type === commands.switchTab) {
    const tabId = request.tabId as number;
    if (tabId) {
      chrome.tabs.update(tabId, { active: true });
    }
  } else if (request.type === commands.newTab) {
    const url = request.url as string;
    chrome.tabs.create({ url }, function (tab) {
      console.log('New tab created with id: ' + tab.id);
    });
  } else if (request.type === commands.clearHistory) {
    chrome.history.deleteAll(() => {
      console.log('Browsing history cleared');
    });
  } else if (request.type === commands.clearOtherTabs) {
    chrome.tabs.query({ currentWindow: true, active: false }, tabs => {
      const tabIds = tabs.map(tab => tab.id).filter((id): id is number => id !== undefined);
      chrome.tabs.remove(tabIds);
    });
  }

  switch (request.type) {
    case commands.bookmarkCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, async ([tab]) => {
        if (tab.id) {
          try {
            const bookmark = await chrome.bookmarks.create({ title: tab.title, url: tab.url });
            console.log({ bookmark });
          } catch (error) {
            console.error({ error });
          }
        }
      });
      break;
    case commands.pinCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id) chrome.tabs.update(tab.id, { pinned: !tab.pinned });
      });
      break;
    case commands.muteCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        console.log({ tab });
        if (!tab?.id) return;
        const muted = !tab.mutedInfo?.muted;
        chrome.tabs.update(tab.id, { muted });
      });
      break;
    case commands.reloadCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id) chrome.tabs.reload(tab.id);
      });
      break;
    case commands.fullscreenCurrentTab:
      chrome.windows.getCurrent(window => {
        if (window.id)
          chrome.windows.update(window.id, { state: window.state === 'fullscreen' ? 'normal' : 'fullscreen' });
      });
      break;
    case commands.printCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id) chrome.tabs.executeScript(tab.id, { code: 'window.print();' });
      });
      break;
    case commands.closeCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id) chrome.tabs.remove(tab.id);
      });
      break;
    case commands.duplicateCurrentTab:
      chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
        if (tab.id) chrome.tabs.duplicate(tab.id);
      });
      break;
    case commands.openIncognitoWindow:
      chrome.windows.create({ incognito: true });
      break;
    case commands.clearCache:
      chrome.browsingData.removeCache({}, () => {
        console.log('Cache cleared');
      });
      break;
    case commands.clearHistory:
      chrome.history.deleteAll(() => {
        console.log('Browsing history cleared');
      });
      break;
    case commands.clearCookies:
      chrome.browsingData.removeCookies({}, () => {
        console.log('Cookies cleared');
      });
      break;
    case commands.clearLocalStorage:
      chrome.browsingData.removeLocalStorage({}, () => {
        console.log('Local storage cleared');
      });
      break;
  }

  return true;
});
