
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIPanel from './components/AIPanel';
import StatusBar from './components/StatusBar';
import { INITIAL_FILES, ACCENTS, THEME } from './constants';
import { AppState, SecurityTier, FileSystemItem, ChatMessage, ThemeMode, AccentColor, ConsoleLog } from './types';
import { PanelLeft, PanelRight } from 'lucide-react';
import { generateProjectManifest, polishpyCLI } from './services/polishpyService';
import { saveFileContent, openFolder, loadFolderTree, readFile } from './services/fileSystem';
import { polishpyCheck, polishpyFormat, polishpyAuto, polishpySyntax, pythonRunCode } from './services/polishpy';

type ResizeMode = 'sidebar' | 'console' | 'chat' | null;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('cadence-state');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          isAIProcessing: false
        };
      } catch (e) {
        console.error('failed to parse saved state');
      }
    }
    return {
      files: INITIAL_FILES,
      openTabs: [{ fileId: 'test.py', isActive: true }],
      activeFileId: 'test.py',
      messages: [
        { id: '1', role: 'assistant', text: 'cadence ide active. kernel synchronized.', timestamp: Date.now() }
      ],
      consoleLogs: [
        { id: 'credits', text: 'engineered by: @ceeboozwah & beerooyay', type: 'success' },
        { id: 'online', text: 'cadence online', type: 'success' }
      ],
      securityTier: SecurityTier.READ_WRITE,
      isAIProcessing: false,
      themeMode: 'dark',
      accentColor: 'g-orange'
    };
  });

  const [isPolishing, setIsPolishing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mobileView, setMobileView] = useState<'dash' | 'chat'>('dash');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isChatOpen, setIsChatOpen] = useState(true);
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [consoleHeight, setConsoleHeight] = useState(320);
  const [chatWidth, setChatWidth] = useState(380);
  const [isResizing, setIsResizing] = useState<ResizeMode>(null);
  const resizeModeRef = useRef<ResizeMode>(null);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);

  // track window width for responsive layout
  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // detect if sidebars would collide - go fullscreen chat if so
  const minMainWidth = 200;
  const sidebarsCollide = isChatOpen && (sidebarWidth + chatWidth + minMainWidth > windowWidth);
  const shouldFullscreenChat = mobileView === 'chat' || sidebarsCollide;

  useEffect(() => {
    const saveState = () => {
      try {
        localStorage.setItem('cadence-state', JSON.stringify(state));
      } catch (e) {
        console.error('failed to save state');
      }
    };
    const timer = setTimeout(saveState, 500);
    return () => clearTimeout(timer);
  }, [state]);

  useEffect(() => {
    const root = document.documentElement;

    const rgbof = (hex: string) => {
      if (!hex || hex[0] !== '#' || (hex.length !== 7 && hex.length !== 4)) return null;
      const full = hex.length === 4
        ? `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
        : hex;
      const r = parseInt(full.slice(1, 3), 16);
      const g = parseInt(full.slice(3, 5), 16);
      const b = parseInt(full.slice(5, 7), 16);
      if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return null;
      return `${r} ${g} ${b}`;
    };

    // Use requestAnimationFrame for smoother transitions
    requestAnimationFrame(() => {
      root.classList.remove('theme-dark', 'theme-light', 'theme-dawn');
      root.classList.add(`theme-${state.themeMode}`);
      root.classList.toggle('dark', state.themeMode === 'dark' || state.themeMode === 'dawn');

      const gradient = ACCENTS[state.accentColor] || ACCENTS['g-orange'];
      root.style.setProperty('--accent-gradient', gradient);
      // extract first color from gradient for places that need a solid (terminal cursor, etc)
      const gradientMatch = gradient.match(/#[a-fA-F0-9]{6}/g);
      const primaryColor = gradientMatch?.[0] || '#f97316';
      root.style.setProperty('--accent', primaryColor);
      root.style.setProperty('--accent-rgb', rgbof(primaryColor) || '249 115 22');

      if (typeof window !== 'undefined' && (window as any).electronAPI) {
        const bg = THEME[state.themeMode]?.bg || THEME.dark.bg;
        (window as any).electronAPI.windowSetColor?.(bg).catch(() => {});
      }
    });
  }, [state.themeMode, state.accentColor]);

  const activeFile = useMemo(() => 
    state.activeFileId ? state.files[state.activeFileId] : null
  , [state.activeFileId, state.files]);

  const projectManifest = useMemo(() => generateProjectManifest(state.files), [state.files]);

  const logToTerminal = useCallback((text: string, type: ConsoleLog['type'] = 'info') => {
    setState(s => ({
      ...s,
      consoleLogs: [...s.consoleLogs, { id: Date.now().toString(), text, type }]
    }));
  }, []);

  const handleTerminalCommand = useCallback(async (cmd: string) => {
    logToTerminal(`> ${cmd}`, 'info');

    if (cmd.toLowerCase() === 'clear') {
      setState(s => ({ ...s, consoleLogs: [] }));
      return;
    }

    if (typeof window !== 'undefined' && (window as any).shell?.exec) {
      try {
        const result = await (window as any).shell.exec(cmd);
        const output = result.output || result.error || '';
        if (output.trim()) {
          logToTerminal(output.trim(), result.success ? 'success' : 'error');
        }
      } catch (e) {
        logToTerminal(`error: ${e}`, 'error');
      }
    }
  }, [logToTerminal]);

  const handleCodeChange = useCallback((content: string) => {
    setState(s => {
      const file = s.files[s.activeFileId!];
      return {
        ...s,
        files: {
          ...s.files,
          [s.activeFileId!]: { ...file, content, isDirty: true }
        }
      };
    });
  }, [state.activeFileId]);

  const handleSaveFile = useCallback(async () => {
    if (!activeFile) return;
    const filePath = activeFile.path;
    if (filePath) {
      const success = await saveFileContent(filePath, activeFile.content || '');
      if (success) {
        setState(s => ({
          ...s,
          files: {
            ...s.files,
            [s.activeFileId!]: { ...s.files[s.activeFileId!], isDirty: false }
          }
        }));
        logToTerminal('FILE SAVED: ' + activeFile.name, 'success');
      } else {
        logToTerminal('SAVE FAILED: ' + activeFile.name, 'error');
      }
    } else {
      logToTerminal('IN-MEMORY FILE (no disk path)', 'info');
    }
  }, [activeFile, logToTerminal]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile]);

  const onPolish = useCallback(async () => {
    if (!activeFile || isPolishing) return;
    
    setIsPolishing(true);
    logToTerminal("PIPELINE: TRIGGERED CORE.POLISHPY.AUTOCMD");
    
    if (activeFile.path) {
      await handleSaveFile();
      const result = await polishpyAuto(activeFile.path);
      if (result.success) {
        const fileResult = await readFile(activeFile.path);
        if ('content' in fileResult) {
          handleCodeChange(fileResult.content);
        }
        logToTerminal(`PIPELINE: ${result.output || 'AUTO-FIXED'} - SUCCESS`, 'success');
      } else {
        logToTerminal(`PIPELINE: ${result.error || result.output}`, 'error');
      }
      setIsPolishing(false);
      return;
    }
    
    const localPolish = activeFile.content?.split('\n')
      .map(l => l.trimEnd())
      .join('\n') || '';
    handleCodeChange(localPolish);

    try {
      const result = polishpyCLI(localPolish, 'fix');
      if (result.success) {
        handleCodeChange(result.formatted);
        logToTerminal(`PIPELINE: ${result.issues.length > 0 ? result.issues.join(', ') : 'NO ISSUES'} - SUCCESS`, 'success');
      } else {
        logToTerminal(`PIPELINE: ISSUES DETECTED - ${result.issues.join(', ')}`, 'error');
      }
    } catch (e) {
      logToTerminal("PIPELINE: BACKGROUND SCAN INTERRUPTED.", 'error');
    } finally {
      setIsPolishing(false);
    }
  }, [activeFile, isPolishing, handleCodeChange, logToTerminal, handleSaveFile]);

  const onSyntaxCheck = useCallback(async () => {
    if (!activeFile || isScanning) return;
    setIsScanning(true);
    logToTerminal(`PIPELINE: INITIATING SCAN [${activeFile.name}]`);
    
    if (activeFile.path) {
      await handleSaveFile();
      const result = await polishpyCheck(activeFile.path);
      if (result.success) {
        logToTerminal("INTEGRITY: 100%. PRISTINE STATUS VERIFIED.", 'success');
      } else {
        logToTerminal(`DIAGNOSTIC: ${result.error || result.output}`, 'error');
      }
      setIsScanning(false);
      return;
    }
    
    try {
      const result = polishpyCLI(activeFile.content || '', 'check');
      if (result.success) {
        logToTerminal("INTEGRITY: 100%. PRISTINE STATUS VERIFIED.", 'success');
      } else {
        logToTerminal(`DIAGNOSTIC: ${result.issues.join('; ')}`, 'error');
      }
    } catch (e) {
      logToTerminal("SCAN FAILURE: ENGINE TIMEOUT.", 'error');
    } finally {
      setIsScanning(false);
    }
  }, [activeFile, isScanning, logToTerminal, handleSaveFile]);

  const onExecute = useCallback(async () => {
    if (!activeFile) return;
    logToTerminal(`EXECUTING: ${activeFile.name}`);
    
    try {
      const result = await pythonRunCode(activeFile.content || '');
      if (result.success) {
        logToTerminal(result.output || 'execution complete', 'success');
      } else {
        logToTerminal(result.error || 'execution failed', 'error');
      }
    } catch (e) {
      logToTerminal('EXECUTION FAILED: python not available', 'error');
    }
  }, [activeFile, logToTerminal]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!resizeModeRef.current) return;
    if (resizeModeRef.current === 'sidebar') {
      const newWidth = Math.max(200, Math.min(window.innerWidth * 0.4, e.clientX));
      setSidebarWidth(newWidth);
    } else if (resizeModeRef.current === 'chat') {
      const newWidth = Math.max(300, Math.min(window.innerWidth * 0.6, window.innerWidth - e.clientX));
      setChatWidth(newWidth);
    } else if (resizeModeRef.current === 'console') {
      const editorBottom = window.innerHeight - 40; 
      const newHeight = Math.max(180, Math.min(editorBottom * 0.8, editorBottom - e.clientY));
      setConsoleHeight(newHeight);
    }
  }, []);

  const stopResizing = useCallback(() => {
    resizeModeRef.current = null;
    setIsResizing(null);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', stopResizing);
    document.body.style.cursor = 'default';
    document.body.style.userSelect = 'auto';
  }, [handleMouseMove]);

  const startResizing = (mode: ResizeMode) => (e: React.MouseEvent) => {
    e.preventDefault();
    resizeModeRef.current = mode;
    setIsResizing(mode);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', stopResizing);
    document.body.style.cursor = mode === 'console' ? 'row-resize' : 'col-resize';
    document.body.style.userSelect = 'none';
  };

  const handleOpenFolder = useCallback(async () => {
    const folderPath = await openFolder();
    if (!folderPath) return;
    
    logToTerminal(`OPENING FOLDER: ${folderPath}`, 'info');
    
    try {
      const nodes = await loadFolderTree(folderPath);
      
      const convertedFiles: Record<string, FileSystemItem> = {};
      for (const [id, node] of Object.entries(nodes)) {
        convertedFiles[id] = {
          id: node.id,
          name: node.name,
          type: node.type,
          parentId: node.parentId,
          path: node.path,
          children: node.children,
          content: node.type === 'file' ? '' : undefined
        };
      }
      
      setState(s => ({
        ...s,
        files: convertedFiles,
        openTabs: [],
        activeFileId: null,
      }));
      
      logToTerminal(`LOADED: ${Object.keys(convertedFiles).length} items`, 'success');
    } catch (e) {
      logToTerminal(`FAILED TO LOAD FOLDER`, 'error');
    }
  }, [logToTerminal]);

  const handleFileClick = useCallback(async (file: FileSystemItem) => {
    if (file.type === 'folder') return;
    
    let content = file.content;
    if (file.path && !content) {
      try {
        const result = await readFile(file.path);
        content = result.content;
        setState(s => ({
          ...s,
          files: {
            ...s.files,
            [file.id]: { ...s.files[file.id], content }
          }
        }));
      } catch {}
    }
    
    setState(prev => {
      const alreadyOpen = prev.openTabs.some(t => t.fileId === file.id);
      const newTabs = prev.openTabs.map(t => ({ ...t, isActive: t.fileId === file.id }));
      if (!alreadyOpen) newTabs.push({ fileId: file.id, isActive: true });
      return { ...prev, openTabs: newTabs, activeFileId: file.id };
    });
  }, []);

  const handleCloseTab = useCallback((fileId: string) => {
    setState(prev => {
      const newTabs = prev.openTabs.filter(t => t.fileId !== fileId);
      let newActiveId = prev.activeFileId;
      if (fileId === prev.activeFileId) {
        newActiveId = newTabs.length > 0 ? newTabs[newTabs.length - 1].fileId : null;
        if (newActiveId) {
          const lastIdx = newTabs.length - 1;
          newTabs[lastIdx] = { ...newTabs[lastIdx], isActive: true };
        }
      }
      return { ...prev, openTabs: newTabs, activeFileId: newActiveId };
    });
  }, []);

  const handleCreateFile = useCallback(async (parentId: string, name: string, type: 'file' | 'folder') => {
    const id = `${parentId}/${name}`;
    const parent = state.files[parentId];
    
    if (parent?.path && typeof window !== 'undefined' && (window as any).fs) {
      const newPath = `${parent.path}/${name}`;
      try {
        if (type === 'file') {
          await (window as any).fs.createFile(newPath, '');
        } else {
          await (window as any).fs.createFolder(newPath);
        }
        logToTerminal(`CREATED: ${newPath}`, 'success');
      } catch (e) {
        logToTerminal(`FAILED TO CREATE: ${name}`, 'error');
        return;
      }
      setState(s => {
        const p = s.files[parentId];
        const newFiles = {
          ...s.files,
          [id]: { id, name, type, parentId, path: newPath, content: type === 'file' ? '' : undefined, children: type === 'folder' ? [] : undefined },
          [parentId]: { ...p, children: [...(p.children || []), id] }
        };
        return { ...s, files: newFiles };
      });
    } else {
      setState(s => {
        const p = s.files[parentId];
        const newFiles = {
          ...s.files,
          [id]: { id, name, type, parentId, content: type === 'file' ? '' : undefined, children: type === 'folder' ? [] : undefined },
          [parentId]: { ...p, children: [...(p.children || []), id] }
        };
        return { ...s, files: newFiles };
      });
    }
    
    if (type === 'file') {
      setState(s => ({
        ...s,
        openTabs: [...s.openTabs.map(t => ({ ...t, isActive: false })), { fileId: id, isActive: true }],
        activeFileId: id
      }));
    }
  }, [state.files, logToTerminal]);

  const handleDeleteFile = useCallback(async (id: string) => {
    const file = state.files[id];
    if (!file || id === 'root') return;
    
    if (file.path && typeof window !== 'undefined' && (window as any).fs) {
      try {
        await (window as any).fs.delete(file.path);
        logToTerminal(`DELETED: ${file.path}`, 'success');
      } catch (e) {
        logToTerminal(`FAILED TO DELETE: ${file.name}`, 'error');
        return;
      }
    }
    
    setState(s => {
      const f = s.files[id];
      if (!f || id === 'root') return s;
      const parent = s.files[f.parentId!];
      const newFiles = { ...s.files };
      const deleteRecursive = (fileId: string) => {
        const ff = newFiles[fileId];
        if (ff?.children) ff.children.forEach(deleteRecursive);
        delete newFiles[fileId];
      };
      deleteRecursive(id);
      newFiles[f.parentId!] = { ...parent, children: parent.children?.filter(c => c !== id) };
      const newTabs = s.openTabs.filter(t => !t.fileId.startsWith(id));
      const newActiveId = s.activeFileId?.startsWith(id) ? (newTabs[0]?.fileId || null) : s.activeFileId;
      return { ...s, files: newFiles, openTabs: newTabs, activeFileId: newActiveId };
    });
  }, [state.files, logToTerminal]);

  const handleRenameFile = useCallback(async (id: string, newName: string) => {
    const file = state.files[id];
    if (!file) return;
    
    if (file.path && typeof window !== 'undefined' && (window as any).fs) {
      const dir = file.path.substring(0, file.path.lastIndexOf('/'));
      const newPath = `${dir}/${newName}`;
      try {
        await (window as any).fs.rename(file.path, newPath);
        logToTerminal(`RENAMED: ${file.name} -> ${newName}`, 'success');
        setState(s => {
          const f = s.files[id];
          if (!f) return s;
          return { ...s, files: { ...s.files, [id]: { ...f, name: newName, path: newPath } } };
        });
      } catch (e) {
        logToTerminal(`FAILED TO RENAME: ${file.name}`, 'error');
      }
    } else {
      setState(s => {
        const f = s.files[id];
        if (!f) return s;
        return { ...s, files: { ...s.files, [id]: { ...f, name: newName } } };
      });
    }
  }, [state.files, logToTerminal]);

  const handleViewChange = (view: 'dash' | 'chat') => {
    if (window.innerWidth >= 1024) {
      // desktop: toggle panels independently
      if (view === 'dash') setIsSidebarOpen(prev => !prev);
      if (view === 'chat') setIsChatOpen(prev => !prev);
    } else {
      // mobile: switch between views, chat goes fullscreen
      if (view === 'chat') {
        setMobileView('chat');
        setIsChatOpen(true);
      } else {
        setMobileView('dash');
        setIsChatOpen(false);
      }
    }
  };

  
  return (
    <div className="flex flex-col h-full w-full bg-dark text-tertiary overflow-hidden">
      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <div style={{ width: isSidebarOpen ? sidebarWidth : 0, maxWidth: '400px' }} className={`shrink-0 bg-panel z-[100] relative border-r border-border flex overflow-hidden h-full ${isResizing === 'sidebar' ? '' : 'sidebar-transition'}`}>
          <div className="w-full h-full min-w-[200px]">
            <Sidebar files={state.files} activeFileId={state.activeFileId} onFileClick={handleFileClick} securityTier={state.securityTier} themeMode={state.themeMode} accentColor={state.accentColor} onThemeChange={m => setState(s => ({...s, themeMode: m}))} onAccentChange={c => setState(s => ({...s, accentColor: c}))} onCreateFile={handleCreateFile} onDeleteFile={handleDeleteFile} onRenameFile={handleRenameFile} onOpenFolder={handleOpenFolder} />
          </div>
          {isSidebarOpen && window.innerWidth >= 1024 && <div onMouseDown={startResizing('sidebar')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-[110]" />}
        </div>

        <main className={`flex-1 flex flex-col overflow-hidden relative min-h-0 ${mobileView === 'dash' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center px-4 h-12 border-b border-border bg-panel shrink-0 justify-between z-10" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
            <div className="flex items-center gap-2">
              {!isSidebarOpen && <div className="w-16" />}
              <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 transition-opacity ${isSidebarOpen ? 'text-accent' : 'text-tertiary/10 hover:text-accent'}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}><PanelLeft className="w-4 h-4" /></button>
            </div>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 transition-opacity ${isChatOpen ? 'text-accent' : 'text-tertiary/10 hover:text-accent'}`} style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}><PanelRight className="w-4 h-4" /></button>
          </div>

          <Editor tabs={state.openTabs} activeFile={activeFile} files={state.files} consoleLogs={state.consoleLogs} consoleHeight={consoleHeight} isResizing={isResizing === 'console'} isPolishing={isPolishing} isScanning={isScanning} pendingCode={pendingCode} onConsoleResize={startResizing('console')} onCloseTab={handleCloseTab} onTabClick={id => handleFileClick(state.files[id])} onCodeChange={handleCodeChange} onExecute={onExecute} onPolish={onPolish} onSyntaxCheck={onSyntaxCheck} onTerminalCommand={handleTerminalCommand} onSave={handleSaveFile} onAcceptPending={() => { if (pendingCode) { handleCodeChange(pendingCode); setPendingCode(null); }}} onRejectPending={() => setPendingCode(null)} />
        </main>

        <div className={`flex flex-col border-l border-border overflow-hidden ${shouldFullscreenChat ? 'fixed inset-0 z-[200] slide-from-right' : isChatOpen ? 'relative' : 'hidden lg:relative'} ${isResizing === 'chat' ? '' : 'sidebar-transition'}`} style={{ width: shouldFullscreenChat ? '100%' : (isChatOpen ? chatWidth : 0), backgroundColor: 'var(--bg-panel)' }}>
          {isChatOpen && !shouldFullscreenChat && <div onMouseDown={startResizing('chat')} className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-[160] hover:bg-accent/20 transition-colors" />}
          <AIPanel messages={state.messages} onSendMessage={m => setState(s => ({...s, messages: [...s.messages, m]}))} onUpdateLastMessage={text => setState(prev => { const msgs = [...prev.messages]; msgs[msgs.length-1].text = text; return {...prev, messages: msgs}; })} isProcessing={state.isAIProcessing} setProcessing={p => setState(s => ({...s, isAIProcessing: p}))} contextCode={activeFile?.content || ''} fileTreeSummary={projectManifest} onApplyToSource={(code) => setPendingCode(code)} onRejectMessage={(id) => setState(s => ({...s, messages: s.messages.filter(m => m.id !== id)}))} onCloseMobile={() => { setMobileView('dash'); setIsChatOpen(false); }} isMobileView={shouldFullscreenChat} files={state.files} />
        </div>
      </div>
      <StatusBar 
        activeFile={activeFile} 
        isProcessing={state.isAIProcessing}
        isUtilityActive={isScanning || isPolishing}
        mobileView={mobileView} 
        isSidebarOpen={isSidebarOpen} 
        isChatOpen={isChatOpen}
        onViewChange={handleViewChange}
      />
    </div>
  );
};

export default App;