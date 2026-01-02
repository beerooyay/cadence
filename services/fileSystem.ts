declare global {
  interface Window {
    fs?: {
      openFolder: () => Promise<string | null>;
      readDir: (path: string) => Promise<DirEntry[] | { error: string }>;
      readFile: (path: string) => Promise<FileResult | { error: string }>;
      writeFile: (path: string, content: string) => Promise<{ success: boolean } | { error: string }>;
      createFile: (path: string, content?: string) => Promise<{ success: boolean } | { error: string }>;
      createFolder: (path: string) => Promise<{ success: boolean } | { error: string }>;
      delete: (path: string) => Promise<{ success: boolean } | { error: string }>;
      rename: (oldPath: string, newPath: string) => Promise<{ success: boolean } | { error: string }>;
      exists: (path: string) => Promise<boolean>;
    };
  }
}

export interface DirEntry {
  name: string;
  path: string;
  isDirectory: boolean;
  isFile: boolean;
}

export interface FileResult {
  content: string;
  size: number;
  modified: number;
}

export interface FileNode {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId: string | null;
  content?: string;
  children?: string[];
  size?: number;
  modified?: number;
}

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.fs;
};

export const openFolder = async (): Promise<string | null> => {
  if (!isElectron()) return null;
  return window.fs!.openFolder();
};

export const readDir = async (path: string): Promise<DirEntry[]> => {
  if (!isElectron()) return [];
  const result = await window.fs!.readDir(path);
  if ('error' in result) throw new Error(result.error);
  return result;
};

export const readFile = async (path: string): Promise<FileResult> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.readFile(path);
  if ('error' in result) throw new Error(result.error);
  return result;
};

export const writeFile = async (path: string, content: string): Promise<void> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.writeFile(path, content);
  if ('error' in result) throw new Error(result.error);
};

export const createFile = async (path: string, content: string = ''): Promise<void> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.createFile(path, content);
  if ('error' in result) throw new Error(result.error);
};

export const createFolder = async (path: string): Promise<void> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.createFolder(path);
  if ('error' in result) throw new Error(result.error);
};

export const deleteItem = async (path: string): Promise<void> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.delete(path);
  if ('error' in result) throw new Error(result.error);
};

export const renameItem = async (oldPath: string, newPath: string): Promise<void> => {
  if (!isElectron()) throw new Error('not in electron');
  const result = await window.fs!.rename(oldPath, newPath);
  if ('error' in result) throw new Error(result.error);
};

export const exists = async (path: string): Promise<boolean> => {
  if (!isElectron()) return false;
  return window.fs!.exists(path);
};

const SKIP_DIRS = new Set(['node_modules', '.git', '.venv', '__pycache__', 'dist', 'build', '.next', 'venv', 'env']);
const MAX_DEPTH = 5;
const MAX_FILES = 500;

export const loadFolderTree = async (rootPath: string): Promise<Record<string, FileNode>> => {
  const nodes: Record<string, FileNode> = {};
  let fileCount = 0;
  
  const processDir = async (dirPath: string, parentId: string | null, depth: number): Promise<string> => {
    const name = dirPath.split('/').pop() || dirPath;
    const id = dirPath;
    const childIds: string[] = [];
    
    if (depth < MAX_DEPTH && fileCount < MAX_FILES) {
      try {
        const entries = await readDir(dirPath);
        
        for (const entry of entries) {
          if (fileCount >= MAX_FILES) break;
          if (entry.name.startsWith('.')) continue;
          if (SKIP_DIRS.has(entry.name)) continue;
          
          if (entry.isDirectory) {
            const childId = await processDir(entry.path, id, depth + 1);
            childIds.push(childId);
          } else if (entry.isFile) {
            fileCount++;
            nodes[entry.path] = {
              id: entry.path,
              name: entry.name,
              path: entry.path,
              type: 'file',
              parentId: id
            };
            childIds.push(entry.path);
          }
        }
      } catch (e) {
        console.warn('failed to read dir:', dirPath);
      }
    }
    
    nodes[id] = {
      id,
      name,
      path: dirPath,
      type: 'folder',
      parentId,
      children: childIds
    };
    
    return id;
  };
  
  await processDir(rootPath, null, 0);
  return nodes;
};

export const saveFileContent = async (filePath: string, content: string): Promise<boolean> => {
  try {
    await writeFile(filePath, content);
    return true;
  } catch {
    return false;
  }
};
