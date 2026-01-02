const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const pty = require('node-pty');

let mainWindow;
let ptyProcess = null;
let mlxProcess = null;
let fileWatcher = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 20, y: 19 },
    backgroundColor: '#050505',
    roundedCorners: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  const isDev = !app.isPackaged;
  
  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
    // set dock icon for dev
    if (process.platform === 'darwin') {
      try {
        app.dock.setIcon(path.join(__dirname, 'build/icon.png'));
      } catch (e) {
        console.error('Failed to set dock icon:', e);
      }
    }
  } else {
    const appPath = app.getAppPath();
    mainWindow.loadFile(path.join(appPath, 'dist/index.html'));
  }

  mainWindow.on('close', () => {
    mainWindow = null;
  });
}

// Register IPC handlers
function registerHandlers() {
  // polishpy handler
  if (!ipcMain.getAttributeNames?.().includes('polishpy')) {
    ipcMain.handle('polishpy', async (e, { code, mode }) => {
      return new Promise((resolve) => {
        const proc = spawn('python3', ['-m', 'polishpy', mode, '--stdin']);
        let out = '', err = '';
        proc.stdin.write(code);
        proc.stdin.end();
        proc.stdout.on('data', d => out += d);
        proc.stderr.on('data', d => err += d);
        proc.on('close', c => resolve({ success: c === 0, output: out, error: err }));
      });
    });
  }

  // file system handlers
  ipcMain.handle('fs:openFolder', async () => {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory']
    });
    if (result.canceled) return null;
    return result.filePaths[0];
  });

  ipcMain.handle('fs:readDir', async (e, dirPath) => {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      return entries.map(entry => ({
        name: entry.name,
        path: path.join(dirPath, entry.name),
        isDirectory: entry.isDirectory(),
        isFile: entry.isFile()
      }));
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:readFile', async (e, filePath) => {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const stats = fs.statSync(filePath);
      return { content, size: stats.size, modified: stats.mtimeMs };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:writeFile', async (e, filePath, content) => {
    try {
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:createFile', async (e, filePath, content = '') => {
    try {
      if (fs.existsSync(filePath)) return { error: 'file exists' };
      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:createFolder', async (e, folderPath) => {
    try {
      if (fs.existsSync(folderPath)) return { error: 'folder exists' };
      fs.mkdirSync(folderPath, { recursive: true });
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:delete', async (e, targetPath) => {
    try {
      const stats = fs.statSync(targetPath);
      if (stats.isDirectory()) {
        fs.rmSync(targetPath, { recursive: true });
      } else {
        fs.unlinkSync(targetPath);
      }
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:rename', async (e, oldPath, newPath) => {
    try {
      fs.renameSync(oldPath, newPath);
      return { success: true };
    } catch (err) {
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:exists', async (e, targetPath) => {
    return fs.existsSync(targetPath);
  });

  ipcMain.handle('fs:watch', async (e, dirPath) => {
    console.log('[MAIN] fs:watch called for:', dirPath);
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    try {
      fileWatcher = fs.watch(dirPath, { recursive: true }, (eventType, filename) => {
        console.log('[MAIN] fs:watch event:', eventType, filename);
        if (filename && !filename.includes('node_modules') && !filename.startsWith('.')) {
          console.log('[MAIN] sending fs:changed to renderer');
          mainWindow?.webContents.send('fs:changed', { eventType, filename, dirPath });
        }
      });
      console.log('[MAIN] watcher started successfully');
      return { success: true };
    } catch (err) {
      console.log('[MAIN] watcher error:', err.message);
      return { error: err.message };
    }
  });

  ipcMain.handle('fs:unwatch', async () => {
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }
    return { success: true };
  });

  // window controls
  ipcMain.handle('window:minimize', () => mainWindow?.minimize());
  ipcMain.handle('window:maximize', () => {
    if (mainWindow?.isMaximized()) mainWindow.unmaximize();
    else mainWindow?.maximize();
  });
  ipcMain.handle('window:close', () => mainWindow?.close());
  ipcMain.handle('window:set-color', (e, color) => {
    if (mainWindow) mainWindow.setBackgroundColor(color);
  });

  // polishpy cli - real integration
  ipcMain.handle('polishpy:check', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['check', filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:format', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['format', filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:auto', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['auto', filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:syntax', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['syntax', filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  // semantic layer commands
  ipcMain.handle('polishpy:semantic', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['semantic', filePath, '--json'], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:transform', async (e, filePath, preview = false) => {
    return new Promise((resolve) => {
      const args = preview ? ['transform', '--preview', filePath] : ['transform', filePath];
      const proc = spawn('polishpy', args, { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:intent', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['intent', filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('polishpy:concept', async (e, intent) => {
    return new Promise((resolve) => {
      const proc = spawn('polishpy', ['concept', ...intent.split(' ')], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  // python execution
  ipcMain.handle('python:run', async (e, filePath) => {
    return new Promise((resolve) => {
      const proc = spawn('python3', [filePath], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  ipcMain.handle('python:runCode', async (e, code) => {
    return new Promise((resolve) => {
      const proc = spawn('python3', ['-c', code], { shell: true });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  // real shell command execution (legacy)
  ipcMain.handle('shell:exec', async (e, command, cwd) => {
    return new Promise((resolve) => {
      const proc = spawn(command, { shell: true, cwd: cwd || process.cwd() });
      let stdout = '', stderr = '';
      proc.stdout.on('data', d => stdout += d);
      proc.stderr.on('data', d => stderr += d);
      proc.on('close', code => resolve({ success: code === 0, output: stdout, error: stderr }));
    });
  });

  // pty terminal - persistent shell session
  ipcMain.handle('pty:spawn', (e, cwd) => {
    console.log('[PTY] spawn called, cwd:', cwd);
    try {
      if (ptyProcess) {
        console.log('[PTY] killing existing process');
        ptyProcess.kill();
      }
      const shell = process.platform === 'win32' ? 'powershell.exe' : process.env.SHELL || '/bin/zsh';
      console.log('[PTY] spawning shell:', shell);
      
      // custom env with clean prompt
      const customEnv = { ...process.env };
      customEnv.PS1 = 'cadence > ';
      customEnv.PROMPT = 'cadence > ';
      
      ptyProcess = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 80,
        rows: 24,
        cwd: cwd || process.env.HOME,
        env: customEnv
      });
      console.log('[PTY] process spawned, pid:', ptyProcess.pid);
      
      // send initial prompt setup command
      setTimeout(() => {
        if (ptyProcess) {
          ptyProcess.write("export PS1='cadence > ' && clear\r");
        }
      }, 200);
      
      ptyProcess.onData(data => {
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:data', data);
        }
      });
      ptyProcess.onExit(({ exitCode }) => {
        console.log('[PTY] exit:', exitCode);
        if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.webContents.send('pty:exit', exitCode);
        }
        ptyProcess = null;
      });
      return { success: true, pid: ptyProcess.pid };
    } catch (err) {
      console.error('[PTY] spawn error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('pty:write', (e, data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
      return { success: true };
    }
    return { success: false, error: 'no pty' };
  });

  ipcMain.handle('pty:resize', (e, cols, rows) => {
    if (ptyProcess) {
      ptyProcess.resize(cols, rows);
      return { success: true };
    }
    return { success: false };
  });

  ipcMain.handle('pty:kill', () => {
    if (ptyProcess) {
      ptyProcess.kill();
      ptyProcess = null;
      return { success: true };
    }
    return { success: false };
  });
}

function startMLXServer() {
  const serverPath = path.join(__dirname, 'cadenceserver.py');
  if (!fs.existsSync(serverPath)) {
    console.log('[cadence] cadenceserver.py not found');
    return;
  }
  
  console.log('[cadence] starting server...');
  mlxProcess = spawn('python3', ['-u', serverPath], {
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe'],
    env: { ...process.env, PYTHONUNBUFFERED: '1' }
  });
  
  mlxProcess.stdout.on('data', d => console.log('[cadence]', d.toString().trim()));
  mlxProcess.stderr.on('data', d => console.log('[cadence]', d.toString().trim()));
  mlxProcess.on('error', err => console.log('[cadence] error:', err.message));
  mlxProcess.on('exit', code => {
    console.log('[cadence] exited:', code);
    mlxProcess = null;
  });
}

app.whenReady().then(() => {
  startMLXServer();
  registerHandlers();
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
  mainWindow = null;
});

app.on('before-quit', () => {
  if (mlxProcess) {
    console.log('[MLX] stopping server...');
    mlxProcess.kill();
    mlxProcess = null;
  }
  if (ptyProcess) {
    ptyProcess.kill();
    ptyProcess = null;
  }
});

app.on('activate', () => {
  if (!mainWindow || mainWindow.isDestroyed()) {
    createWindow();
  } else {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }
    mainWindow.show();
    mainWindow.focus();
  }
});
