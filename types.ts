export type FileType = 'file' | 'folder';

export interface FileSystemItem {
  id: string;
  name: string;
  type: FileType;
  parentId: string | null;
  content?: string;
  isOpen?: boolean;
  size?: number;
  lastModified?: number;
  hash?: string;
  children?: string[]; // IDs of children
}

export interface EditorTab {
  fileId: string;
  isActive: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

export interface ConsoleLog {
  id: string;
  text: string;
  type: 'info' | 'error' | 'success' | 'system';
}

export interface GhostSuggestion {
  original: string;
  suggested: string;
  description: string;
}

export enum SecurityTier {
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE',
  ADMIN = 'ADMIN',
  NETWORK = 'NETWORK'
}

export type ThemeMode = 'dark' | 'light' | 'dawn';
export type AccentColor = 
  | 'orange' | 'blue' | 'purple' | 'pink' | 'green' | 'red' 
  | 'g-red' | 'g-blue' | 'g-yellow';

export interface AppState {
  files: Record<string, FileSystemItem>;
  openTabs: EditorTab[];
  activeFileId: string | null;
  messages: ChatMessage[];
  consoleLogs: ConsoleLog[];
  securityTier: SecurityTier;
  isAIProcessing: boolean;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  ghostSuggestion: GhostSuggestion | null;
  isAnalyzing: boolean;
}
