import type { KeyboardEventHandler } from 'react';
import { forwardRef, useEffect, useRef } from 'react';
import { Command } from 'cmdk';
import { Search, Clipboard, Key } from 'lucide-react';

type CommandMenuProps = {
  onClose: () => void;
};

const CommandMenu = forwardRef<HTMLInputElement, CommandMenuProps>(({ onClose }, ref) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      console.log(event.key);
      if (event.key === 'Escape') {
        onClose();
      }
    };

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = event => {
    if (event.key === 'Escape') {
      event.preventDefault(); // Prevent the event from bubbling up
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div ref={menuRef} className="relative w-full max-w-2xl">
        {/* Vibrancy background */}
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
              onKeyDown={handleInputKeyDown}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const toggleMenu = (show: boolean) => {
    console.log('toggleMenu');
    if (rootRef.current) {
      rootRef.current.classList.toggle('hidden', !show);
      rootRef.current.classList.toggle('block', show);
      if (show && inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  useEffect(() => {
    const handleMessage = (message: { request: string }) => {
      console.log(message.request);
      if (message.request === 'toggle-ktab') {
        toggleMenu(!rootRef.current?.classList.contains('block'));
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, []);

  return (
    <div className="hidden" ref={rootRef}>
      <CommandMenu ref={inputRef} onClose={() => toggleMenu(false)} />
    </div>
  );
}
