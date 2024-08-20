import React, { useEffect, useRef } from 'react';
import CommandMenu from './command-menu';

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
