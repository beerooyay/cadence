import { FileSystemItem, SecurityTier } from './types';

export const INITIAL_FILES: Record<string, FileSystemItem> = {
  'root': { id: 'root', name: 'nova-workspace', type: 'folder', parentId: null, children: ['src', 'package.json', 'pyproject.toml', 'README.md'] },
  'src': { id: 'src', name: 'src', type: 'folder', parentId: 'root', children: ['main.py', 'kernel.py', 'utils.ts'] },
  'main.py': { 
    id: 'main.py', 
    name: 'main.py', 
    type: 'file', 
    parentId: 'src', 
    content: `def mandelbrot(c, max_iter):
    z = 0
    for n in range(max_iter):
        if abs(z) > 2:
            return n
        z = z*z + c
    return max_iter

def render_fractal():
    rows, cols = 30, 80
    chars = " .:-=+*#%@"
    
    print("NOVA KERNEL: STARTING FRACTAL COMPUTE...")
    for y in range(rows):
        line = ""
        for x in range(cols):
            c = complex(-2.0 + 3.0*x/cols, -1.5 + 3.0*y/rows)
            m = mandelbrot(c, 20)
            line += chars[m % len(chars)]
        print(line)
    print("NOVA KERNEL: COMPUTE SUCCESSFUL.")

if __name__ == "__main__":
    render_fractal()` 
  },
  'kernel.py': { id: 'kernel.py', name: 'kernel.py', type: 'file', parentId: 'src', content: '# Core Logic Extensions\nimport sys\n\ndef init():\n    print("INIT SUCCESS")' },
  'utils.ts': { id: 'utils.ts', name: 'utils.ts', type: 'file', parentId: 'src', content: 'export const format = (v: any) => JSON.stringify(v);' },
  'package.json': { id: 'package.json', name: 'package.json', type: 'file', parentId: 'root', content: '{\n  "name": "nova-ide",\n  "version": "1.0.0"\n}' },
  'pyproject.toml': { 
    id: 'pyproject.toml', 
    name: 'pyproject.toml', 
    type: 'file', 
    parentId: 'root', 
    content: `[tool.polishpy]
python_version = "3.10"
include = ["src"]

[tool.ruff]
line-length = 88
target-version = "py310"

[tool.ruff.lint]
select = ["E", "F", "I", "B", "C4"]
fixable = ["ALL"]

[tool.black]
line-length = 88
target-version = ["py310"]` 
  },
  'README.md': { id: 'README.md', name: 'README.md', type: 'file', parentId: 'root', content: '# NovaIDE\n\nThe future of coding with PolishPy integration.' }
};

export const MOCK_CHUNKS = [
  { web: { uri: "https://github.com/features/copilot", title: "GitHub Copilot" } },
  { web: { uri: "https://cursor.com", title: "Cursor IDE" } }
];