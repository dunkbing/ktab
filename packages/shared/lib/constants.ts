import type { Suggestion } from './types';

export const commands = {
  getSuggestions: 'GET_SUGGESTIONS',
  switchTab: 'SWITCH_TAB',
  newTab: 'NEW_TAB',
};

export const actions: Suggestion[] = [
  {
    content: 'https://docs.google.com/document/create',
    description: 'Create a new Google Docs document',
    type: 'action',
    iconUrl: 'https://www.google.com/images/icons/product/docs-32.png',
  },
  {
    content: 'https://docs.google.com/presentation/create',
    description: 'Create a new Google Slides presentation',
    type: 'action',
    iconUrl: 'https://www.google.com/images/icons/product/slides-32.png',
  },
  {
    content: 'https://sheets.new',
    description: 'Create a new Google Sheets spreadsheet',
    type: 'action',
    iconUrl: 'https://www.google.com/images/icons/product/sheets-32.png',
  },
  {
    content: 'https://www.notion.so/new',
    description: 'Create a new Notion page',
    type: 'action',
    iconUrl: 'https://www.notion.so/images/favicon.ico',
  },
  {
    content: 'https://trello.com/create-board',
    description: 'Create new Trello board',
    type: 'action',
    iconUrl: 'https://trello.com/favicon.ico',
  },
  {
    content: 'https://github.com/new',
    description: 'Create a new GitHub repository',
    type: 'action',
    iconUrl: 'https://github.githubassets.com/favicons/favicon.svg',
  },
];
