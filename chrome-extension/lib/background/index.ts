import 'webextension-polyfill';
import { commands, actions } from '@extension/shared/lib/constants';
import type { Suggestion } from '@extension/shared/lib/types';

console.log('KTab background loaded');

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
  return actions.filter(action => action.description.toLowerCase().includes(input.toLowerCase()));
};

const fetchGoogleSuggestions = async (input: string): Promise<Suggestion[]> => {
  try {
    const response = await fetch(
      `http://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(input)}`,
    );
    const data: [string, string[]] = await response.json();
    return data[1].map(suggestion => ({
      content: `https://www.google.com/search?q=${encodeURIComponent(suggestion)}`,
      description: `Search Google for: ${suggestion}`,
      type: 'search',
    }));
  } catch (error) {
    console.error('Error fetching Google suggestions:', error);
    return [];
  }
};

const searchHistory = (input: string, maxResults: number): Promise<Suggestion[]> =>
  new Promise(resolve => {
    chrome.history.search({ text: input, maxResults }, historyItems => {
      resolve(
        historyItems.map(item => ({
          content: item.url!,
          description: `History: ${item.title}`,
          type: 'history',
        })),
      );
    });
  });

const searchBookmarks = (input: string, maxResults: number): Promise<Suggestion[]> =>
  new Promise(resolve => {
    chrome.bookmarks.search(input, bookmarkItems => {
      resolve(
        bookmarkItems.slice(0, maxResults).map(item => ({
          content: item.url!,
          description: `Bookmark: ${item.title}`,
          type: 'bookmark',
        })),
      );
    });
  });

const searchTabs = (input: string): Promise<Suggestion[]> =>
  new Promise(resolve => {
    chrome.tabs.query({}, tabs => {
      const matchingTabs = tabs.filter(tab => tab.title && tab.title.toLowerCase().includes(input.toLowerCase()));
      resolve(
        matchingTabs.map(tab => ({
          content: tab.url!,
          description: `Tab: ${tab.title}`,
          iconUrl: tab.favIconUrl,
          type: 'tab',
          tabId: tab.id,
        })),
      );
    });
  });

const removeDuplicates = (suggestions: Suggestion[]): Suggestion[] => {
  const seenUrls = new Set<string>();
  return suggestions.filter(suggestion => {
    if (seenUrls.has(suggestion.content)) {
      return false;
    }
    seenUrls.add(suggestion.content);
    return true;
  });
};

const prioritizeAndLimitResults = (suggestions: Suggestion[], maxResults: number = 20): Suggestion[] => {
  const tabSuggestions = suggestions.filter(s => s.type === 'tab');
  const otherSuggestions = suggestions.filter(s => s.type !== 'tab');

  return [...tabSuggestions, ...otherSuggestions].slice(0, maxResults);
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === commands.getSuggestions && request.input) {
    const input = request.input as string;

    // Immediately search for quick-to-retrieve suggestions
    (async () => {
      const [historySuggestions, bookmarkSuggestions, tabSuggestions, actionSuggestions, googleSuggestions] =
        await Promise.all([
          searchHistory(input, 5),
          searchBookmarks(input, 3),
          searchTabs(input),
          Promise.resolve(searchActions(input)),
          fetchGoogleSuggestions(input),
        ]);

      const initialSuggestions = [
        ...actionSuggestions,
        ...tabSuggestions,
        ...historySuggestions,
        ...bookmarkSuggestions,
        ...googleSuggestions,
      ];

      const filteredInitialSuggestions = removeDuplicates(initialSuggestions);
      const prioritizedInitialSuggestions = prioritizeAndLimitResults(filteredInitialSuggestions);

      sendResponse({ suggestions: prioritizedInitialSuggestions, complete: false });
    })();
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
  }
  return true;
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  Promise.all([
    searchHistory(text, 3),
    searchTabs(text),
    fetchGoogleSuggestions(text),
    Promise.resolve(searchActions(text)),
  ]).then(([historySuggestions, tabSuggestions, googleSuggestions, actionSuggestions]) => {
    const allSuggestions = [
      ...actionSuggestions,
      ...tabSuggestions,
      ...historySuggestions,
      ...googleSuggestions.slice(0, 3),
    ];
    const filteredSuggestions = removeDuplicates(allSuggestions);
    const prioritizedSuggestions = prioritizeAndLimitResults(filteredSuggestions, 6);
    suggest(prioritizedSuggestions);
  });
});
