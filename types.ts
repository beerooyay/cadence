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
  children?: string[];
  path?: string;
  isDirty?: boolean;
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

export enum SecurityTier {
  READ_ONLY = 'READ_ONLY',
  READ_WRITE = 'READ_WRITE',
  ADMIN = 'ADMIN',
  NETWORK = 'NETWORK'
}

export type ThemeMode = 'dark' | 'light' | 'dawn';
export type AccentColor = 'g-red' | 'g-orange' | 'g-yellow' | 'g-green' | 'g-blue' | 'g-purple';

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
}
