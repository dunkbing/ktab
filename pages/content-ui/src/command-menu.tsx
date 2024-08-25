import React, { forwardRef, useEffect, useState, useCallback, useRef } from 'react';
import { Search, History, Bookmark, Globe, MoveDown, MoveUp, Loader } from 'lucide-react';

import { actions, commands } from '@extension/shared/lib/constants';
import type { Suggestion } from '@extension/shared/lib/types';
import { SwitchToTabButton } from './button';

type CommandProps = {
  children: React.ReactNode;
  className?: string;
  label: string;
};

const Command = ({ children, className, label }: CommandProps) => (
  <div role="combobox" aria-labelledby={label} aria-controls="command-list" aria-expanded={true} className={className}>
    {children}
  </div>
);

const CommandInput = forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement> & { onValueChange: (value: string) => void }
>(({ onValueChange, ...props }, ref) => (
  <input ref={ref} type="text" onChange={e => onValueChange(e.target.value)} {...props} />
));

CommandInput.displayName = 'CommandInput';

const CommandList = forwardRef<HTMLDivElement, { children: React.ReactNode; className?: string }>(
  ({ children, className }, ref) => (
    <div id="command-list" ref={ref} role="listbox" className={className}>
      {children}
    </div>
  ),
);

CommandList.displayName = 'CommandList';

const CommandGroup = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div role="group" className={className}>
    {children}
  </div>
);

const CommandItem = forwardRef<
  HTMLDivElement,
  {
    children: React.ReactNode;
    onSelect: () => void;
    className?: string;
  }
>(({ children, onSelect, className }, ref) => (
  <div
    ref={ref}
    role="option"
    onClick={onSelect}
    onKeyDown={e => {
      if (e.key === 'Enter' || e.key === ' ') {
        onSelect();
      }
    }}
    tabIndex={0}
    aria-selected={false}
    className={className}>
    {children}
  </div>
));

CommandItem.displayName = 'CommandItem';

Command.Input = CommandInput;
Command.List = CommandList;
Command.Group = CommandGroup;
Command.Item = CommandItem;

const getIconForSuggestion = (suggestion: Suggestion) => {
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
};

type CommandMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const SummaryHeading = React.memo(({ results }: { results: number }) => (
  <div className="flex flex-row justify-between px-4 py-2 text-gray-400">
    <span className="flex flex-row items-center">
      Navigate using the arrow keys <MoveUp size={16} strokeWidth={3} />/<MoveDown size={16} strokeWidth={3} />
    </span>
    <span>{`${results} result${results !== 1 ? 's' : ''}`}</span>
  </div>
));

SummaryHeading.displayName = 'SummaryHeading';

const CommandMenu = forwardRef<HTMLInputElement, CommandMenuProps>(({ isOpen, onClose }, ref) => {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>(actions);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  const listRef = useRef<HTMLDivElement>(null);

  const handleInputChange = useCallback((value: string) => {
    let newValue = value;
    if (value === '/t') newValue = '/tab ';
    if (value === '/h') newValue = '/history ';
    if (value === '/b') newValue = '/bookmark ';

    setInput(newValue);
    setIsLoading(true);
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setInput('');
    }
  }, [isOpen]);

  useEffect(() => {
    const getSuggestions = () => {
      if (input.length > 0) {
        let command = '';
        if (input.startsWith('/tab')) {
          command = 'tab';
        }
        if (input.startsWith('/history')) command = 'history';
        if (input.startsWith('/bookmark')) command = 'bookmark';

        const newInput = input.replace(`/${command} `, '');
        if (!newInput) {
          setIsLoading(false);
        }

        chrome.runtime.sendMessage(
          {
            type: commands.getSuggestions,
            input: newInput,
            command,
          },
          (response: { suggestions: Suggestion[] }) => {
            if (response?.suggestions) {
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

  const scrollToIndex = useCallback((index: number) => {
    if (listRef.current) {
      const listElement = listRef.current;
      const items = listElement.getElementsByClassName('command-item');
      if (items[index]) {
        const item = items[index] as HTMLElement;
        item.scrollIntoView({ block: 'nearest' });
      }
    }
  }, []);

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

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace' && input.endsWith(' ')) {
        const trimmedInput = input.trim();
        if (trimmedInput === '/tab' || trimmedInput === '/history' || trimmedInput === '/bookmark') {
          e.preventDefault();
          setInput('');
          return;
        }
      }

      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const direction = e.key === 'ArrowDown' ? 1 : -1;
        const newIndex = (selectedIndex + direction + suggestions.length) % suggestions.length;
        setSelectedIndex(newIndex);
        scrollToIndex(newIndex);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleSuggestionSelect(suggestions[selectedIndex])();
      }
    },
    [input, selectedIndex, suggestions, scrollToIndex, handleSuggestionSelect],
  );

  const handleMouseDown: React.MouseEventHandler<HTMLDivElement> = useCallback(
    e => {
      if (e.target === e.currentTarget) {
        onClose();
      }
    },
    [onClose],
  );

  if (!isOpen) return null;

  return (
    <div
      role="presentation"
      className="fixed inset-0 flex items-start justify-center bg-gray-900/60 backdrop-blur-sm z-50"
      onMouseDown={handleMouseDown}>
      <div className="relative w-full max-w-2xl mt-16">
        <Command
          label="Command Menu"
          className="relative w-full bg-gray-800 rounded-xl shadow-2xl overflow-hidden border border-gray-700">
          <div className="flex items-center px-4 py-3 border-b border-gray-700">
            {isLoading ? (
              <Loader className="w-5 h-5 text-gray-400 mr-2 animate-spin" />
            ) : (
              <Search className="w-5 h-5 text-gray-400 mr-2" />
            )}
            <Command.Input
              value={input}
              ref={ref}
              onValueChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-500 focus:outline-none"
              placeholder="Search or enter a command..."
            />
          </div>
          <SummaryHeading results={suggestions.length} />
          <Command.List ref={listRef} className="max-h-96 overflow-y-auto pb-2">
            <Command.Group className="px-4 py-2 text-sm text-gray-400">
              {suggestions.map((suggestion, index) => (
                <Command.Item
                  key={`${suggestion.content}`}
                  onSelect={handleSuggestionSelect(suggestion)}
                  className={`command-item flex items-center px-2 py-2 text-gray-300 rounded-md cursor-pointer transition-all duration-200 ease-in-out hover:bg-gray-700/50 ${
                    index === selectedIndex ? 'bg-gray-700/70' : ''
                  }`}>
                  <div className="flex items-center flex-1 min-w-0">
                    <div className="w-8 h-8 mr-3 bg-gray-700 rounded-md flex items-center justify-center flex-shrink-0">
                      {getIconForSuggestion(suggestion)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="truncate font-semibold">{suggestion.description}</div>
                      <div className="text-sm text-gray-500 truncate">{suggestion.content}</div>
                    </div>
                  </div>
                  {suggestion.type === 'tab' && <SwitchToTabButton />}
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
