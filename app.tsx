
import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import Editor from './components/Editor';
import AIPanel from './components/AIPanel';
import StatusBar from './components/StatusBar';
import { INITIAL_FILES } from './constants';
import { AppState, SecurityTier, FileSystemItem, ChatMessage, ThemeMode, AccentColor, ConsoleLog, GhostSuggestion } from './types';
import { PanelLeft, PanelRight, X } from 'lucide-react';
import { generateProjectManifest, analyzeWithNuExtract, polishpyCLI, generateAIResponseStream } from './services/polishpyService';

type ResizeMode = 'sidebar' | 'console' | 'chat' | null;

const App: React.FC = () => {
  const [state, setState] = useState<AppState>({
    files: INITIAL_FILES,
    openTabs: [{ fileId: 'main.py', isActive: true }],
    activeFileId: 'main.py',
    messages: [
      { id: '1', role: 'assistant', text: 'nova ide active. kernel synchronized.', timestamp: Date.now() }
    ],
    consoleLogs: [
      { id: 'credits', text: 'engineered by: @ceeboozwah & beerooyay', type: 'success' },
      { id: 'online', text: 'nova online', type: 'success' }
    ],
    securityTier: SecurityTier.READ_WRITE,
    isAIProcessing: false,
    themeMode: 'dark',
    accentColor: 'orange',
    ghostSuggestion: null,
    isAnalyzing: false
  });

  const [isPolishing, setIsPolishing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [mobileView, setMobileView] = useState<'dash' | 'chat'>('dash');
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth > 1024);
  const [isChatOpen, setIsChatOpen] = useState(window.innerWidth > 1280);
  
  const [sidebarWidth, setSidebarWidth] = useState(260);
  const [consoleHeight, setConsoleHeight] = useState(320);
  const [chatWidth, setChatWidth] = useState(380);
  const [isResizing, setIsResizing] = useState<ResizeMode>(null);
  const resizeModeRef = useRef<ResizeMode>(null);
  const analysisTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('theme-dark', 'theme-light', 'theme-dawn');
    root.classList.add(`theme-${state.themeMode}`);
    
    const colorVar = state.accentColor.startsWith('g-') 
      ? `var(--accent-${state.accentColor})` 
      : `var(--accent-${state.accentColor})`;
      
    root.style.setProperty('--accent', colorVar);
  }, [state.themeMode, state.accentColor]);

  const activeFile = useMemo(() => 
    state.activeFileId ? state.files[state.activeFileId] : null
  , [state.activeFileId, state.files]);

  const projectManifest = useMemo(() => generateProjectManifest(state.files), [state.files]);

  const handleTerminalCommand = useCallback((cmd: string, type: ConsoleLog['type'] = 'info') => {
    const logId = Date.now().toString();
    setState(s => ({
      ...s,
      consoleLogs: [...s.consoleLogs, { id: logId, text: cmd, type: type }]
    }));

    if (cmd.toLowerCase() === 'clear') {
      setState(s => ({ ...s, consoleLogs: [] }));
    }
  }, []);

  const triggerNovaWatch = useCallback(async () => {
    if (!activeFile || state.isAIProcessing || isPolishing || isScanning) return;
    setState(s => ({ ...s, isAnalyzing: true }));
    try {
      const suggestion = await analyzeForGhostPolish(activeFile.content || '', projectManifest);
      setState(s => ({ ...s, isAnalyzing: false, ghostSuggestion: suggestion }));
    } catch (e) {
      setState(s => ({ ...s, isAnalyzing: false }));
    }
  }, [activeFile, state.isAIProcessing, isPolishing, isScanning, projectManifest]);

  const handleCodeChange = useCallback((content: string) => {
    setState(s => ({
      ...s,
      ghostSuggestion: null,
      files: {
        ...s.files,
        [s.activeFileId!]: { ...s.files[s.activeFileId!], content }
      }
    }));
    if (analysisTimerRef.current) window.clearTimeout(analysisTimerRef.current);
    analysisTimerRef.current = window.setTimeout(triggerNovaWatch, 3000);
  }, [state.activeFileId, triggerNovaWatch]);

  const onPolish = useCallback(async () => {
    if (!activeFile || isPolishing) return;
    
    setIsPolishing(true);
    handleTerminalCommand("PIPELINE: TRIGGERED CORE.POLISHPY.AUTOCMD");
    
    // 1. Instant local cleanup (Fastest)
    const localPolish = activeFile.content?.split('\n')
      .map(l => l.trimEnd())
      .join('\n') || '';
    handleCodeChange(localPolish);

    // 2. Background Deep Polish (No thinking, strictly formatting)
    try {
      const polishedCode = await fastPolishCode(localPolish);
      handleCodeChange(polishedCode);
      handleTerminalCommand("PIPELINE: INTEGRITY VERIFIED. DEEP POLISH SUCCESS.", 'success');
    } catch (e) {
      handleTerminalCommand("PIPELINE: BACKGROUND SCAN INTERRUPTED.", 'error');
    } finally {
      setIsPolishing(false);
    }
  }, [activeFile, isPolishing, handleCodeChange, handleTerminalCommand]);

  const onSyntaxCheck = useCallback(async () => {
    if (!activeFile || isScanning) return;
    setIsScanning(true);
    handleTerminalCommand(`PIPELINE: INITIATING SCAN [${activeFile.name}]`);
    
    try {
      const diagnostic = await analyzeSyntax(activeFile.content || '', activeFile.name);
      if (diagnostic.includes("PRISTINE")) {
          handleTerminalCommand(diagnostic, 'success');
      } else {
          handleTerminalCommand(diagnostic, 'error');
      }
    } catch (e) {
      handleTerminalCommand("SCAN FAILURE: ENGINE TIMEOUT.", 'error');
    } finally {
      setIsScanning(false);
    }
  }, [activeFile, isScanning, handleTerminalCommand]);

  const loadGhostToChat = useCallback(() => {
    if (!state.ghostSuggestion) return;
    const ghost = state.ghostSuggestion;
    
    setIsChatOpen(true);
    if (window.innerWidth < 1024) setMobileView('chat');
    
    setState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: Date.now().toString(),
        role: 'assistant',
        text: `**NOVA WATCH ALERT:** Suggested improvement for ${activeFile?.name}.\n\n**Reason:** ${ghost.description}\n\n\`\`\`python\n${ghost.suggested}\n\`\`\``,
        timestamp: Date.now()
      }]
    }));
  }, [state.ghostSuggestion, activeFile]);

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

  const handleFileClick = useCallback((file: FileSystemItem) => {
    if (file.type === 'folder') return;
    setState(prev => {
      const alreadyOpen = prev.openTabs.some(t => t.fileId === file.id);
      const newTabs = prev.openTabs.map(t => ({ ...t, isActive: t.fileId === file.id }));
      if (!alreadyOpen) newTabs.push({ fileId: file.id, isActive: true });
      return { ...prev, openTabs: newTabs, activeFileId: file.id, ghostSuggestion: null };
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
      return { ...prev, openTabs: newTabs, activeFileId: newActiveId, ghostSuggestion: null };
    });
  }, []);

  const handleViewChange = (view: 'dash' | 'chat') => {
    if (window.innerWidth >= 1024) {
      if (view === 'dash') setIsSidebarOpen(prev => !prev);
      if (view === 'chat') setIsChatOpen(prev => !prev);
    } else {
      setMobileView(view);
      if (view === 'chat') setIsChatOpen(true);
      if (view === 'dash') setMobileView('dash');
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-dark text-tertiary overflow-hidden">
      <div className="fixed top-0 inset-x-0 flex justify-center z-[500] pointer-events-none">
        <div className={`relative w-[180px] h-[72px] transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${state.ghostSuggestion ? 'translate-y-0 opacity-100' : '-translate-y-[110%] opacity-0'}`}>
          <div className="absolute inset-0 bg-panel border-b border-x border-border rounded-b-[36px] z-10 shadow-2xl shadow-black/40" />
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto group/topdock">
             <div className="flex items-center gap-2 p-1.5 transition-all duration-500 group-hover/topdock:scale-105">
               <button onClick={loadGhostToChat} className="w-12 h-12 flex items-center justify-center rounded-[18px] bg-accent text-dark shadow-lg shadow-accent/20 active-press relative overflow-hidden">
                  <div className="absolute inset-0 bg-white/10 opacity-0 hover:opacity-100 transition-opacity" />
                  <div className="flex items-center justify-center relative translate-y-[1px]">
                    <span className="font-black text-[24px] leading-none select-none pr-1">❯</span>
                    <div className="w-2 h-2 rounded-full bg-dark animate-pulse shadow-sm" />
                  </div>
               </button>
             </div>
             <button onClick={(e) => { e.stopPropagation(); setState(s => ({...s, ghostSuggestion: null})); }} className="absolute top-3 right-5 text-tertiary/10 hover:text-secondary p-1 transition-colors group/close">
                <X className="w-3.5 h-3.5 opacity-40 group-hover/close:opacity-100" />
             </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative min-h-0">
        <div style={{ width: isSidebarOpen ? (window.innerWidth >= 1024 ? sidebarWidth : '100%') : 0 }} className={`shrink-0 bg-panel z-[100] relative border-r border-border flex overflow-hidden h-full ${isResizing === 'sidebar' ? '' : 'sidebar-transition'} ${!isSidebarOpen && window.innerWidth < 1024 ? 'hidden' : ''}`}>
          <div className="w-full h-full min-w-[200px]">
            <Sidebar files={state.files} activeFileId={state.activeFileId} onFileClick={handleFileClick} securityTier={state.securityTier} themeMode={state.themeMode} accentColor={state.accentColor} onThemeChange={m => setState(s => ({...s, themeMode: m}))} onAccentChange={c => setState(s => ({...s, accentColor: c}))} onCreateFile={(p,n,t) => {}} onDeleteFile={id => {}} onRenameFile={(id, n) => {}} />
          </div>
          {isSidebarOpen && window.innerWidth >= 1024 && <div onMouseDown={startResizing('sidebar')} className="absolute right-0 top-0 bottom-0 w-1 cursor-col-resize z-[110]" />}
        </div>

        <main className={`flex-1 flex flex-col overflow-hidden relative min-h-0 ${mobileView === 'dash' ? 'flex' : 'hidden lg:flex'}`}>
          <div className="flex items-center px-4 h-11 border-b border-border bg-panel shrink-0 justify-between z-10">
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`p-2 transition-opacity ${isSidebarOpen ? 'text-accent' : 'text-tertiary/10 hover:text-accent'}`}><PanelLeft className="w-4 h-4" /></button>
            <button onClick={() => setIsChatOpen(!isChatOpen)} className={`p-2 transition-opacity ${isChatOpen ? 'text-accent' : 'text-tertiary/10 hover:text-accent'}`}><PanelRight className="w-4 h-4" /></button>
          </div>

          <Editor tabs={state.openTabs} activeFile={activeFile} consoleLogs={state.consoleLogs} consoleHeight={consoleHeight} isResizing={isResizing === 'console'} isPolishing={isPolishing} isScanning={isScanning} isAnalyzing={state.isAnalyzing} ghostSuggestion={state.ghostSuggestion} onConsoleResize={startResizing('console')} onCloseTab={handleCloseTab} onTabClick={id => handleFileClick(state.files[id])} onCodeChange={handleCodeChange} onExecute={() => {}} onPolish={onPolish} onSyntaxCheck={onSyntaxCheck} onTerminalCommand={handleTerminalCommand} />
        </main>

        <div className={`shrink-0 flex flex-col bg-panel border-l border-border overflow-hidden relative ${mobileView === 'chat' ? 'fixed inset-0 z-[150] w-full lg:relative lg:inset-auto lg:z-auto lg:h-full lg:flex' : 'relative hidden lg:flex'} ${isResizing === 'chat' ? '' : 'sidebar-transition'}`} style={{ width: mobileView === 'chat' ? (window.innerWidth >= 1024 ? (isChatOpen ? chatWidth : 0) : '100%') : (isChatOpen ? chatWidth : 0) }}>
          {isChatOpen && mobileView !== 'chat' && window.innerWidth >= 1024 && <div onMouseDown={startResizing('chat')} className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize z-[160] hover:bg-accent/20 transition-colors" />}
          <AIPanel messages={state.messages} onSendMessage={m => setState(s => ({...s, messages: [...s.messages, m]}))} onUpdateLastMessage={text => setState(prev => { const msgs = [...prev.messages]; msgs[msgs.length-1].text = text; return {...prev, messages: msgs}; })} isProcessing={state.isAIProcessing} setProcessing={p => setState(s => ({...s, isAIProcessing: p}))} contextCode={activeFile?.content || ''} fileTreeSummary={projectManifest} onApplyToSource={(code) => handleCodeChange(code)} onRejectMessage={(id) => setState(s => ({...s, messages: s.messages.filter(m => m.id !== id)}))} onCloseMobile={() => { setMobileView('dash'); setIsChatOpen(false); }} isMobileView={mobileView === 'chat'} />
        </div>
      </div>
      <StatusBar 
        activeFile={activeFile} 
        isProcessing={state.isAIProcessing} // ONLY heavy reasoning for chat
        isUtilityActive={state.isAnalyzing || isScanning || isPolishing} // Fast background utility label
        mobileView={mobileView} 
        isSidebarOpen={isSidebarOpen} 
        isChatOpen={isChatOpen} 
        onViewChange={handleViewChange} 
      />
    </div>
  );
};

export default App;