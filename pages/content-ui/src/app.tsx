import type { MouseEventHandler } from 'react';
import React, { forwardRef, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, Clipboard, Key } from 'lucide-react';

type CommandMenuProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CommandMenu = forwardRef<HTMLInputElement, CommandMenuProps>(({ isOpen, onClose }, ref) => {
  if (!isOpen) return null;
  const handleMouseDown: MouseEventHandler<HTMLDivElement> = e => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50" onMouseDown={handleMouseDown}>
      <div className="relative w-full max-w-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-xl rounded-xl" />
        <Command
          label="Command Menu"
          className="relative w-full bg-gray-800/50 rounded-xl shadow-2xl overflow-hidden border border-gray-700/50">
          <div className="flex items-center px-4 py-3 border-b border-gray-700/50">
            <Search className="w-5 h-5 text-gray-400 mr-2" />
            <Command.Input
              ref={ref}
              className="w-full bg-transparent text-gray-200 text-lg placeholder-gray-400 focus:outline-none"
              placeholder="Search for apps and commands..."
            />
          </div>
          <Command.List className="max-h-96 overflow-y-auto py-2">
            <Command.Group heading="Suggestions" className="px-4 py-2 text-sm text-gray-400">
              {['Linear', 'Figma', 'Slack', 'YouTube', 'Raycast'].map(app => (
                <Command.Item
                  key={app}
                  className="flex items-center justify-between px-2 py-2 text-gray-200 hover:bg-white/10 rounded-md cursor-pointer">
                  <div className="flex items-center">
                    <div className="w-6 h-6 mr-3 bg-gray-700/50 rounded-md"></div>
                    {app}
                  </div>
                  <span className="text-gray-500">Application</span>
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Commands" className="px-4 py-2 text-sm text-gray-400">
              <Command.Item className="flex items-center justify-between px-2 py-2 text-gray-200 hover:bg-white/10 rounded-md cursor-pointer">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-3 bg-red-500/70 rounded-md flex items-center justify-center">
                    <Clipboard className="w-4 h-4 text-white" />
                  </div>
                  Clipboard History
                </div>
                <span className="text-gray-500">Command</span>
              </Command.Item>
              <Command.Item className="flex items-center justify-between px-2 py-2 text-gray-200 hover:bg-white/10 rounded-md cursor-pointer">
                <div className="flex items-center">
                  <div className="w-6 h-6 mr-3 bg-green-500/70 rounded-md flex items-center justify-center">
                    <Key className="w-4 h-4 text-white" />
                  </div>
                  Import Extension
                </div>
                <span className="text-gray-500">Command</span>
              </Command.Item>
            </Command.Group>
          </Command.List>
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-700/50 text-gray-400 text-sm">
            <div className="flex items-center">
              <div className="w-5 h-5 mr-2 bg-gray-700/50 rounded-md"></div>
              Open Application
            </div>
            <div className="flex items-center space-x-2">
              <span>Actions</span>
              <span>⌘</span>
              <span>K</span>
            </div>
          </div>
        </Command>
      </div>
    </div>
  );
});

CommandMenu.displayName = 'CommandMenu';

export default function App() {
  const [isOpen, setIsOpen] = React.useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log('key', event.key);
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    document.addEventListener('keyup', handleKeyDown);
    return () => {
      document.removeEventListener('keyup', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleMessage = (message: { request: string }) => {
      if (message.request === 'toggle-ktab') {
        setIsOpen(prev => !prev);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  return <CommandMenu ref={inputRef} isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
