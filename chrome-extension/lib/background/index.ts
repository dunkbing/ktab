import 'webextension-polyfill';

console.log('background loaded');
console.log("Edit 'chrome-extension/lib/background/index.ts' and save to reload.");

chrome.commands.onCommand.addListener(async command => {
  console.log(command);
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
  }
});

const getCurrentTab = async () => {
  const queryOptions: chrome.tabs.QueryInfo = { active: true, currentWindow: true };
  const [tab] = await chrome.tabs.query(queryOptions);
  return tab;
};

interface Suggestion {
  content: string;
  description: string;
  type: string;
  iconUrl?: string;
}

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

const prioritizeAndLimitResults = (suggestions: Suggestion[], maxResults: number = 10): Suggestion[] => {
  const tabSuggestions = suggestions.filter(s => s.type === 'tab');
  const otherSuggestions = suggestions.filter(s => s.type !== 'tab');

  return [...tabSuggestions, ...otherSuggestions].slice(0, maxResults);
};

chrome.runtime.onMessage.addListener((request, _, sendResponse) => {
  if (request.type === 'GET_SUGGESTIONS' && request.input) {
    const input = request.input as string;
    (async () => {
      const [historySuggestions, bookmarkSuggestions, tabSuggestions, googleSuggestions] = await Promise.all([
        searchHistory(input, 5),
        searchBookmarks(input, 3),
        searchTabs(input),
        fetchGoogleSuggestions(input),
      ]);

      const allSuggestions = [
        ...tabSuggestions,
        ...historySuggestions,
        ...bookmarkSuggestions,
        ...googleSuggestions.slice(0, 5),
      ];

      const filteredSuggestions = removeDuplicates(allSuggestions);
      const prioritizedSuggestions = prioritizeAndLimitResults(filteredSuggestions);

      sendResponse({ suggestions: prioritizedSuggestions });
    })();
  }
  return true;
});

chrome.omnibox.onInputChanged.addListener((text, suggest) => {
  Promise.all([searchHistory(text, 3), searchTabs(text), fetchGoogleSuggestions(text)]).then(
    ([historySuggestions, tabSuggestions, googleSuggestions]) => {
      const allSuggestions = [...tabSuggestions, ...historySuggestions, ...googleSuggestions.slice(0, 3)];
      const filteredSuggestions = removeDuplicates(allSuggestions);
      const prioritizedSuggestions = prioritizeAndLimitResults(filteredSuggestions, 6);
      suggest(prioritizedSuggestions);
    },
  );
});
