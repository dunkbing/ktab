export type Suggestion = {
  content: string;
  description: string;
  type?: 'history' | 'bookmark' | 'tab' | 'search' | 'action' | 'website';
  iconUrl?: string;
  tabId?: number;
};
