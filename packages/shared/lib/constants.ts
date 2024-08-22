import type { Suggestion } from './types';

export const commands = {
  getSuggestions: 'GET_SUGGESTIONS',
  switchTab: 'SWITCH_TAB',
  newTab: 'NEW_TAB',
};

export const actions: Suggestion[] = [
  {
    content: 'https://docs.new',
    description: 'Create a new Google Docs document',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/docs.png'),
  },
  {
    content: 'https://slides.new',
    description: 'Create a new Google Slides presentation',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/slides.png'),
  },
  {
    content: 'https://sheets.new',
    description: 'Create a new Google Sheets spreadsheet',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/sheets.png'),
  },
  {
    content: 'https://www.notion.so/new',
    description: 'Create a new Notion page',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/notion.png'),
  },
  {
    content: 'https://github.com/new',
    description: 'Create a new GitHub repository',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/github.svg'),
  },
  {
    content: 'https://trello.com/create-board',
    description: 'Create new Trello board',
    type: 'action',
    iconUrl: chrome.runtime.getURL('/assets/trello.png'),
  },
];
