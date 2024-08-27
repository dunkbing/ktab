# KTab: Command Palette Chrome Extension

![Preview](sc/sc1.png)

KTab is a simple Chrome extension that adds a customizable command palette to your browser, enhancing your browsing efficiency and productivity.

Sometimes I do live streams of coding this project on TikTok. Follow me at [@dunkbing](https://www.tiktok.com/@dunkbing) to catch these sessions.

## Features

- **Quick Access**: Open the command palette with a keyboard shortcut (default: Cmd+Shift+K / Ctrl+Shift+K).
- **Universal Search**: Search across multiple sources:
  - Open tabs
  - Browsing history
  - Bookmarks
  - Google search suggestions
  - Quick actions
- **Tab Management**: Quickly switch between open tabs or restore recently closed tabs.
- **Bookmark Navigation**: Easily access and open your bookmarks.
- **History Lookup**: Search through your browsing history.
- **Quick Actions**: Perform common tasks like creating new documents or opening specific websites.
- **Google Search Integration**: Get Google search suggestions directly in the palette.
- **Keyboard Navigation**: Use arrow keys to navigate through suggestions and Enter to select.

## Installation

Download KTab from the Chrome Web Store: [KTab Chrome Extension](https://chromewebstore.google.com/detail/lpnolmmbpjnenjoanhdbgfdjiknmfpnm?authuser=0&hl=en)

## Usage

1. Press Cmd+Shift+K (Mac) or Ctrl+Shift+K (Windows/Linux) to open the command palette.
2. Start typing to search across tabs, history, bookmarks, and actions.
3. Use arrow keys to navigate through suggestions.
4. Press Enter to select an item or perform an action.

### Special Commands

- `/tab`: Search only through open tabs
- `/history`: Search only through browsing history
- `/bookmark`: Search only through bookmarks

## Development

This extension is built using React and TypeScript. To set up the development environment:

1. Clone the repository: `git clone [repository-url]`
2. Navigate to the project directory: `cd ktab`
3. Install dependencies: `pnpm install`
4. Build the extension: `pnpm run build`
5. For development with hot-reloading: `pnpm dev`

### Loading the Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions`.
2. Enable "Developer mode" in the top right corner.
3. Click "Load unpacked" and select the `dist` directory from the project folder.
