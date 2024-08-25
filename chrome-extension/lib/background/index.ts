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
    return data[1].slice(0, limit).map(suggestion => ({
      content: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
      description: `Search Google for: ${suggestion}`,
      type: 'search',
    }));
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

const prioritizeAndLimitResults = (suggestions: Suggestion[], maxResults: number = 20): Suggestion[] => {
  const tabSuggestions = suggestions.filter(s => s.type === 'tab');
  const otherSuggestions = suggestions.filter(s => s.type !== 'tab');

  return [...tabSuggestions, ...otherSuggestions].slice(0, maxResults);
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
    iconUrl: await fetchFavicon(url),
  };
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === commands.getSuggestions && request.input) {
    const input = request.input as string;
    const command = request.command;
    (async () => {
      if (command === 'history') {
        const suggestions = await searchHistory(input, 30);
        return sendResponse({ suggestions });
      } else if (command === 'bookmark') {
        const suggestions = await searchBookmarks(input, 30);
        return sendResponse({ suggestions });
      } else if (command === 'tab') {
        const suggestions = await searchTabs(input);
        return sendResponse({ suggestions });
      }

      const [tabSuggestions, actionSuggestions, googleSuggestions] = await Promise.all([
        searchTabs(input),
        Promise.resolve(searchActions(input)),
        fetchGoogleSuggestions(input),
      ]);

      const initialSuggestions = [...actionSuggestions, ...tabSuggestions, ...googleSuggestions];

      if (isWebsite(input)) {
        const websiteSuggestion = await getWebsiteSuggestion(input);
        initialSuggestions.unshift(websiteSuggestion);
      }

      const prioritizedSuggestions = prioritizeAndLimitResults(initialSuggestions);
      sendResponse({ suggestions: prioritizedSuggestions });
    })();

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
  } else if (request.type === 'RESTORE_TAB') {
    const sessionId = request.sessionId as string;
    chrome.sessions.restore(sessionId, restoredSession => {
      if (restoredSession && restoredSession.tab) {
        chrome.tabs.update(restoredSession.tab.id!, { active: true });
      }
    });
  }

  return true;
});
