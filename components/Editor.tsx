import React, { useState, useRef, useEffect } from 'react';
import { X, FileCode, Play, Hash, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';
import { EditorTab, FileSystemItem, ConsoleLog } from '../types';

interface EditorProps {
  tabs: EditorTab[];
  activeFile: FileSystemItem | null;
  consoleLogs: ConsoleLog[];
  consoleHeight: number;
  isResizing: boolean;
  isPolishing?: boolean;
  isScanning?: boolean;
  isAnalyzing?: boolean;
  ghostSuggestion?: any;
  onConsoleResize: (e: React.MouseEvent) => void;
  onCloseTab: (id: string) => void;
  onTabClick: (id: string) => void;
  onCodeChange: (content: string) => void;
  onExecute: () => void;
  onPolish?: () => void;
  onSyntaxCheck?: () => void;
  onTerminalCommand: (cmd: string) => void;
}

const Editor: React.FC<EditorProps> = ({ 
    tabs, activeFile, consoleLogs, consoleHeight, isResizing, isPolishing, isScanning, isAnalyzing, 
    onConsoleResize, onCloseTab, onTabClick, onCodeChange, onExecute, onPolish, onSyntaxCheck, onTerminalCommand
}) => {
  const [terminalOpen, setTerminalOpen] = useState(true);
  const [terminalInput, setTerminalInput] = useState('');
  const terminalInputRef = useRef<HTMLInputElement>(null);
  const logContainerRef = useRef<HTMLDivElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  const handleTerminalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!terminalInput.trim()) return;
    onTerminalCommand(terminalInput);
    setTerminalInput('');
  };

  useEffect(() => {
    if (logContainerRef.current) logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
  }, [consoleLogs]);

  if (!activeFile) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-dark">
        <div className="w-20 h-20 bg-panel border border-border rounded-large flex items-center justify-center opacity-20"><FileCode className="w-10 h-10" /></div>
        <p className="ui-label text-tertiary/10 tracking-[1em] mt-8 uppercase">Awaiting Input</p>
      </div>
    );
  }

  return (
    <div 
      ref={editorRef}
      className="flex-1 flex flex-col min-h-0 bg-dark relative z-0 overflow-hidden"
    >
      <div className="flex items-center bg-panel/30 h-12 shrink-0 border-b border-border overflow-x-auto no-scrollbar relative z-50">
        {tabs.map(tab => (
          <div key={tab.fileId} onClick={() => onTabClick(tab.fileId)} className={`flex items-center gap-4 px-6 h-full ui-label cursor-pointer border-r border-border transition-all ${tab.isActive ? 'bg-dark text-accent border-t-2 border-t-accent' : 'text-tertiary/15 hover:text-tertiary/40'}`}>
            <span className="truncate lowercase text-[11px]">{tab.fileId}</span>
            <X className={`w-3.5 h-3.5 ${tab.isActive ? 'opacity-40 hover:opacity-100' : 'opacity-0'}`} onClick={(e) => { e.stopPropagation(); onCloseTab(tab.fileId); }} />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between px-6 py-2 border-b border-border bg-dark/20 h-14 shrink-0 relative z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-3 px-4 py-1.5 bg-panel border border-border rounded-base">
            <Hash className={`w-3.5 h-3.5 transition-colors ${isAnalyzing || isScanning ? 'text-accent animate-pulse' : 'text-accent/30'}`} />
            <span className="ui-label text-tertiary/30 whitespace-nowrap text-[10px]">
              {isScanning ? 'ENHANCED SCAN ACTIVE' : isAnalyzing ? 'NOVA WATCH ACTIVE' : 'INTEGRITY: 100%'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={onSyntaxCheck} disabled={isScanning} title="PolishPy Syntax Diagnostic" className={`flex items-center gap-2.5 px-5 py-2 rounded-base border text-accent ui-label transition-all text-[10px] ${isScanning ? 'bg-accent/20 border-accent animate-pulse' : 'border-accent/10 hover:bg-accent/10 hover:border-accent/30'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'SCANNING' : 'SYNTAX'}</span>
          </button>
          <button onClick={onPolish} disabled={isPolishing} title="PolishPy Autocmd Fix pipeline" className={`flex items-center gap-2.5 px-5 py-2 rounded-base border text-accent ui-label transition-all text-[10px] ${isPolishing ? 'bg-accent/20 border-accent' : 'border-accent/10 hover:bg-accent/10 hover:border-accent/30'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
            <span>{isPolishing ? 'AUTOCMD RUNNING' : 'POLISH'}</span>
          </button>
          <button onClick={onExecute} className="flex items-center gap-2.5 px-6 py-2 rounded-base bg-accent text-dark ui-label text-[10px] hover:brightness-110 active-press shadow-xl shadow-accent/5">
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>EXECUTE</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative overflow-hidden bg-dark">
        {isPolishing && (
          <div className="lava-container">
            <div className="lava-overlay" />
            <div className="lava-wave" />
          </div>
        )}

        <textarea 
          className="flex-1 bg-transparent p-10 lg:p-14 outline-none code-editor leading-relaxed resize-none text-tertiary selection:bg-accent/20 relative z-20"
          value={activeFile.content || ''}
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          onChange={(e) => onCodeChange(e.target.value)}
        />

        <div className="border-t border-border bg-dark flex flex-col relative z-50 shrink-0" style={{ height: terminalOpen ? consoleHeight : 40 }}>
          {terminalOpen && <div onMouseDown={onConsoleResize} className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-20" />}
          
          <div onClick={() => setTerminalOpen(!terminalOpen)} className="h-10 px-6 flex items-center justify-between border-b border-border/10 cursor-pointer shrink-0 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-3">
               <div className="w-1.5 h-1.5 bg-accent rounded-full animate-pulse" />
               <div className="nova-brand"><span className="text-tertiary text-[14px]">nova</span></div>
            </div>
            {terminalOpen ? <ChevronDown className="w-4 h-4 text-tertiary/10" /> : <ChevronUp className="w-4 h-4 text-tertiary/10" />}
          </div>

          {terminalOpen && (
            <div className="flex-1 flex flex-col min-h-0 bg-dark overflow-hidden">
              <div ref={logContainerRef} className="flex-1 overflow-y-auto p-6 pb-2 terminal-text no-scrollbar">
                <div className="flex flex-col justify-end min-h-full gap-2.5">
                  {consoleLogs.map(log => (
                    <div key={log.id} className="flex gap-4 animate-in slide-in-from-bottom-1 duration-200 shrink-0">
                      <span className={`shrink-0 ${log.type === 'success' ? 'text-accent' : log.type === 'error' ? 'text-secondary' : 'text-tertiary/10'}`}>
                        {log.type === 'success' ? '✔' : log.type === 'error' ? '✘' : '»'}
                      </span>
                      <span className={`whitespace-pre break-all ${log.type === 'success' ? 'text-accent font-black' : log.type === 'error' ? 'text-secondary/80' : 'text-tertiary font-bold'}`} style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                        {log.text}
                      </span>
                    </div>
                  ))}
                  <div className="h-4 shrink-0" />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-white/5 bg-panel shrink-0 pb-24 lg:pb-6">
                <form onSubmit={handleTerminalSubmit} className="flex items-center gap-4">
                  <span className="text-accent font-black animate-pulse text-[14px]">❯</span>
                  <input 
                    ref={terminalInputRef} 
                    className="flex-1 bg-transparent terminal-text text-tertiary uppercase outline-none placeholder:text-tertiary/10" 
                    placeholder="COMMAND LINE" 
                    style={{ color: 'var(--tertiary)' }}
                    value={terminalInput} 
                    onChange={e => setTerminalInput(e.target.value)} 
                  />
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;