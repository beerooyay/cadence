const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  executePolishpy: (code, mode) => ipcRenderer.invoke('execute-polishpy', { code, mode }),
  inferenceLocalModel: (model, prompt) => ipcRenderer.invoke('inference-local-model', { model, prompt }),
  windowSetColor: (color) => ipcRenderer.invoke('window:set-color', color)
});

contextBridge.exposeInMainWorld('fs', {
  openFolder: () => ipcRenderer.invoke('fs:openFolder'),
  readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
  readFile: (path) => ipcRenderer.invoke('fs:readFile', path),
  writeFile: (path, content) => ipcRenderer.invoke('fs:writeFile', path, content),
  createFile: (path, content) => ipcRenderer.invoke('fs:createFile', path, content),
  createFolder: (path) => ipcRenderer.invoke('fs:createFolder', path),
  delete: (path) => ipcRenderer.invoke('fs:delete', path),
  rename: (oldPath, newPath) => ipcRenderer.invoke('fs:rename', oldPath, newPath),
  exists: (path) => ipcRenderer.invoke('fs:exists', path),
  watch: (dirPath) => {
    console.log('[PRELOAD] fs.watch called for:', dirPath);
    return ipcRenderer.invoke('fs:watch', dirPath);
  },
  unwatch: () => ipcRenderer.invoke('fs:unwatch'),
  onChanged: (callback) => {
    console.log('[PRELOAD] fs.onChanged listener registered');
    ipcRenderer.removeAllListeners('fs:changed');
    ipcRenderer.on('fs:changed', (e, data) => {
      console.log('[PRELOAD] fs:changed received:', data);
      callback(data);
    });
  }
});

contextBridge.exposeInMainWorld('polishpy', {
  check: (filePath) => ipcRenderer.invoke('polishpy:check', filePath),
  format: (filePath) => ipcRenderer.invoke('polishpy:format', filePath),
  auto: (filePath) => ipcRenderer.invoke('polishpy:auto', filePath),
  syntax: (filePath) => ipcRenderer.invoke('polishpy:syntax', filePath),
  semantic: (filePath) => ipcRenderer.invoke('polishpy:semantic', filePath),
  transform: (filePath, preview) => ipcRenderer.invoke('polishpy:transform', filePath, preview),
  intent: (filePath) => ipcRenderer.invoke('polishpy:intent', filePath),
  concept: (intent) => ipcRenderer.invoke('polishpy:concept', intent)
});

contextBridge.exposeInMainWorld('python', {
  run: (filePath) => ipcRenderer.invoke('python:run', filePath),
  runCode: (code) => ipcRenderer.invoke('python:runCode', code)
});

contextBridge.exposeInMainWorld('shell', {
  exec: (command, cwd) => ipcRenderer.invoke('shell:exec', command, cwd)
});

contextBridge.exposeInMainWorld('web', {
  fetch: (url) => ipcRenderer.invoke('web:fetch', url),
  search: (query) => ipcRenderer.invoke('web:search', query)
});

contextBridge.exposeInMainWorld('pty', {
  spawn: (cwd) => ipcRenderer.invoke('pty:spawn', cwd),
  write: (data) => ipcRenderer.invoke('pty:write', data),
  resize: (cols, rows) => ipcRenderer.invoke('pty:resize', cols, rows),
  kill: () => ipcRenderer.invoke('pty:kill'),
  onData: (callback) => {
    ipcRenderer.on('pty:data', (e, data) => callback(data));
  },
  onExit: (callback) => {
    ipcRenderer.on('pty:exit', (e, code) => callback(code));
  },
  removeListeners: () => {
    ipcRenderer.removeAllListeners('pty:data');
    ipcRenderer.removeAllListeners('pty:exit');
  }
});
