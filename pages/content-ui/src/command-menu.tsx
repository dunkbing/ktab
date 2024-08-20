import type { MouseEventHandler } from 'react';
import { forwardRef, useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { Search, History, Bookmark, Globe } from 'lucide-react';

type CommandMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

type Suggestion = {
  content: string;
  description: string;
  type?: 'history' | 'bookmark' | 'tab' | 'search';
  iconUrl?: string;
};

const CommandMenu = forwardRef<HTMLInputElement, CommandMenuProps>(({ isOpen, onClose }, ref) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const getSuggestions = () => {
      if (input.length > 0) {
        chrome.runtime.sendMessage({ type: 'GET_SUGGESTIONS', input }, (response: { suggestions: Suggestion[] }) => {
          if (response && response.suggestions) {
            setSuggestions(response.suggestions);
          }
        });
      } else {
        setSuggestions([]);
      }
    };
    const timeoutId = setTimeout(getSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [input]);

  const handleInputChange = (value: string) => {
    setInput(value);
  };

  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleSuggestionSelect = (suggestion: Suggestion) => {
    console.log('Selected suggestion:', suggestion);
    // Handle the selection (e.g., navigate to URL or perform action)
    // onClose();
  };

  const getIconForSuggestion = (suggestion: Suggestion) => {
    switch (suggestion.type) {
      case 'history':
        return <History className="w-4 h-4 text-blue-400" />;
      case 'bookmark':
        return <Bookmark className="w-4 h-4 text-yellow-400" />;
      case 'tab':
        return <img src={`${suggestion.iconUrl}`} alt="Tab favicon" className="w-4 h-4" />;
      case 'search':
        return <Search className="w-4 h-4 text-green-400" />;
      default:
        return <Globe className="w-4 h-4 text-gray-400" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-center justify-center bg-black/50 z-50"
      onMouseDown={handleMouseDown}>
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-xl" />
        <Command
          label="Command Menu"
          loop
          className="relative w-full bg-gray-800/50 rounded-xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center px-4 py-3 border-b border-gray-700/50">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <Command.Input
              value={input}
              ref={ref}
              onValueChange={handleInputChange}
              className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-400 focus:outline-none"
              placeholder="Search for apps and commands..."
            />
          </div>
          <Command.List className="max-h-96 overflow-y-auto py-2">
            <Command.Group heading="Suggestions" className="px-4 py-2 text-sm text-gray-400">
              {suggestions.map((suggestion, index) => (
                <Command.Item
                  key={index}
                  value={suggestion.content}
                  onSelect={() => handleSuggestionSelect(suggestion)}
                  className="flex items-center justify-between px-2 py-2 text-gray-200 rounded-md cursor-pointer aria-selected:bg-white/10">
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-3 bg-gray-700/50 rounded-md flex items-center justify-center">
                      {getIconForSuggestion(suggestion)}
                    </div>
                    {suggestion.description}
                  </div>
                  <span className="text-gray-500 truncate ml-2 max-w-xs">{suggestion.content}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
});

CommandMenu.displayName = 'CommandMenu';

export default CommandMenu;