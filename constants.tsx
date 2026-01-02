import { FileSystemItem, AccentColor } from './types';

export const THEME = {
  dark: { bg: '#050505', panel: '#0a0a0a', border: '#111111', text: '#ede1d3' },
  light: { bg: '#f0f0f0', panel: '#ffffff', border: '#e2e2e2', text: '#000000' },
  dawn: { bg: '#1b1c1e', panel: '#212226', border: '#2a2b2f', text: '#ffffff' }
} as const;

export const ACCENTS: Record<AccentColor, string> = {
  'g-red': 'linear-gradient(135deg, #ff6b6b 0%, #ff3d3d 100%)',
  'g-orange': 'linear-gradient(135deg, #ffa940 0%, #ff7a00 100%)',
  'g-yellow': 'linear-gradient(135deg, #fff7cc 0%, #ffd966 100%)',
  'g-green': 'linear-gradient(135deg, #a3e635 0%, #4ade80 100%)',
  'g-blue': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
  'g-purple': 'linear-gradient(135deg, #c084fc 0%, #a855f7 100%)'
};

export const FALLBACK = { text: '#ede1d3', bg: '#050505' };

export const INITIAL_FILES: Record<string, FileSystemItem> = {
  'root': { id: 'root', name: 'workspace', type: 'folder', parentId: null, children: ['test.py'] },
  'test.py': { 
    id: 'test.py', 
    name: 'test.py', 
    type: 'file', 
    parentId: 'root', 
    content: `# test file for cadence ide
from typing import List, Dict, Optional

def greet(name: str) -> str:
    return f"hello {name}"

def process(items: List[str], config: Dict) -> Optional[str]:
    result = None
    for item in items:
        if item:
            result = str(item)
    return result

if __name__ == "__main__":
    print(greet("cadence"))
` 
  }
};