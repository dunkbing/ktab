import React, { forwardRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Command } from 'cmdk';
import { Search, History, Bookmark, Globe, MoveDown, MoveUp, Loader } from 'lucide-react';

import { actions, commands } from '@extension/shared/lib/constants';
import type { Suggestion } from '@extension/shared/lib/types';

type CommandMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SummaryHeading = React.memo(({ results }: { results: number }) => (
  <div className="flex flex-row justify-between p-3 text-gray-400">
    <span className="flex flex-row items-center">
      Navigate using the arrow keys <MoveUp size={16} strokeWidth={3} />/<MoveDown size={16} strokeWidth={3} />
    </span>
    <span>{`${results} result${results !== 1 ? 's' : ''}`}</span>
  </div>
));

SummaryHeading.displayName = 'SummaryHeading';

const CommandMenuItem = React.memo(
  ({
    suggestion,
    onSelect,
    getIconForSuggestion,
  }: {
    suggestion: Suggestion;
    onSelect: () => void;
    getIconForSuggestion: (suggestion: Suggestion) => React.ReactNode;
  }) => (
    <Command.Item
      key={`${suggestion.content}`}
      value={suggestion.content}
      onSelect={onSelect}
      className="flex items-center px-2 py-2 text-gray-200 rounded-md cursor-pointer aria-selected:bg-white/10 transition-all duration-200 ease-in-out hover:bg-white/5">
      <div className="flex items-center flex-1 min-w-0">
        <div className="w-8 h-8 mr-3 bg-gray-700/50 rounded-md flex items-center justify-center flex-shrink-0">
          {getIconForSuggestion(suggestion)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="truncate">{suggestion.description}</div>
          <div className="text-sm text-gray-500 truncate">{suggestion.content}</div>
        </div>
      </div>
    </Command.Item>
  ),
);

CommandMenuItem.displayName = 'CommandMenuItem';

const CommandMenu = forwardRef<HTMLInputElement, CommandMenuProps>(({ isOpen, onClose }, ref) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(actions);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = useCallback((value: string) => {
    setInput(value);
    setIsLoading(true);
  }, []);

  useEffect(() => {
    const getSuggestions = () => {
      if (input.length > 0) {
        chrome.runtime.sendMessage(
          { type: commands.getSuggestions, input },
          (response: { suggestions: Suggestion[]; complete: boolean }) => {
            if (response && response.suggestions) {
              setSuggestions(response.suggestions);
              setIsLoading(false);
            }
          },
        );
      } else {
        setSuggestions(actions);
        setIsLoading(false);
      }
    };
    const timeoutId = setTimeout(getSuggestions, 300);

    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: Suggestion) => {
      return () => {
        if (suggestion.type === 'tab') {
          chrome.runtime.sendMessage({ type: commands.switchTab, tabId: suggestion.tabId });
        } else if (suggestion.type) {
          chrome.runtime.sendMessage({ type: commands.newTab, url: suggestion.content });
        }
        onClose?.();
      };
    },
    [onClose],
  );

  const getIconForSuggestion = useCallback((suggestion: Suggestion) => {
    switch (suggestion.type) {
      case 'history':
        return <History className="w-5 h-5 text-blue-400" />;
      case 'bookmark':
        return <Bookmark className="w-5 h-5 text-yellow-400" />;
      case 'tab':
        return <img src={`${suggestion.iconUrl}`} alt="Tab favicon" className="w-5 h-5" />;
      case 'action':
        return <img src={`${suggestion.iconUrl}`} alt="Action favicon" className="w-5 h-5" />;
      case 'search':
        return <Search className="w-5 h-5 text-green-400" />;
      default:
        return <Globe className="w-5 h-5 text-gray-400" />;
    }
  }, []);

  const memoizedSuggestions = useMemo(
    () =>
      suggestions.map(suggestion => (
        <CommandMenuItem
          key={suggestion.content}
          suggestion={suggestion}
          onSelect={handleSuggestionSelect(suggestion)}
          getIconForSuggestion={getIconForSuggestion}
        />
      )),
    [suggestions, handleSuggestionSelect, getIconForSuggestion],
  );

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-start justify-center bg-black/50 z-50"
      onMouseDown={handleMouseDown}>
      <div className="relative w-full max-w-2xl mt-16">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-xl" />
        <Command
          label="Command Menu"
          loop
          className="relative w-full bg-gray-800/50 rounded-xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center px-4 py-3 border-b border-gray-700/50">
            {isLoading ? (
              <Loader className="w-5 h-5 text-gray-400 mr-2 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <Command.Input
              value={input}
              ref={ref}
              onValueChange={handleInputChange}
              className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-400 focus:outline-none"
              placeholder="Search for apps and commands..."
            />
          </div>
          <SummaryHeading results={suggestions.length} />
          <Command.List className="max-h-96 overflow-y-auto py-2">
            {suggestions.length > 0 && (
              <Command.Group className="px-4 py-2 text-sm text-gray-400">{memoizedSuggestions}</Command.Group>
            )}
          </Command.List>
        </Command>
      </div>
    </div>
  );
});

CommandMenu.displayName = 'CommandMenu';

export default CommandMenu;
