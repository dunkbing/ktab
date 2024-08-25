export type Suggestion = {
  content: string;
  description: string;
  type?: 'history' | 'bookmark' | 'tab' | 'search' | 'action' | 'website' | 'recently-closed';
  iconUrl?: string;
  tabId?: number;
  action?: () => void;
};
