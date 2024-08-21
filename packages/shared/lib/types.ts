export type Suggestion = {
  content: string;
  description: string;
  type?: 'history' | 'bookmark' | 'tab' | 'search' | 'action';
  iconUrl?: string;
  tabId?: number;
};
