import React, { useState, useRef, useEffect } from 'react';
import { X, FileCode, Play, Hash, ChevronDown, ChevronUp, Sparkles, ShieldCheck } from 'lucide-react';
import { EditorTab, FileSystemItem, ConsoleLog } from '../types';
import Terminal from './Terminal';

interface EditorProps {
  tabs: EditorTab[];
  activeFile: FileSystemItem | null;
  files: Record<string, FileSystemItem>;
  consoleLogs: ConsoleLog[];
  consoleHeight: number;
  isResizing: boolean;
  isPolishing?: boolean;
  isScanning?: boolean;
  pendingCode?: string | null;
  onConsoleResize: (e: React.MouseEvent) => void;
  onCloseTab: (id: string) => void;
  onTabClick: (id: string) => void;
  onCodeChange: (content: string) => void;
  onExecute: () => void;
  onPolish?: () => void;
  onSyntaxCheck?: () => void;
  onTerminalCommand: (cmd: string) => void;
  onSave?: () => void;
  onAcceptPending?: () => void;
  onRejectPending?: () => void;
}

const Editor: React.FC<EditorProps> = ({ 
    tabs, activeFile, files, consoleLogs, consoleHeight, isResizing, isPolishing, isScanning, pendingCode,
    onConsoleResize, onCloseTab, onTabClick, onCodeChange, onExecute, onPolish, onSyntaxCheck, onTerminalCommand, onSave, onAcceptPending, onRejectPending
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
        {tabs.map(tab => {
          const file = files[tab.fileId];
          const isDirty = file?.isDirty;
          return (
            <div key={tab.fileId} onClick={() => onTabClick(tab.fileId)} className={`flex items-center gap-4 px-6 h-full ui-label cursor-pointer border-r border-border transition-all ${tab.isActive ? 'bg-dark border-t-2 border-t-accent' : 'text-tertiary/15 hover:text-tertiary/40'}`}>
              <span className={`truncate lowercase text-[11px] ${tab.isActive ? 'text-accent' : ''}`}>{file?.name || tab.fileId}</span>
              {isDirty ? (
                <div className="w-2 h-2 rounded-full bg-accent animate-pulse" title="unsaved" />
              ) : (
                <X className={`w-3.5 h-3.5 ${tab.isActive ? 'opacity-40 hover:opacity-100' : 'opacity-0'}`} onClick={(e) => { e.stopPropagation(); onCloseTab(tab.fileId); }} />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between px-3 lg:px-6 py-2 bg-dark/20 h-14 shrink-0 relative z-50 gap-2 overflow-x-auto no-scrollbar">
        <div className="hidden lg:flex items-center gap-3 shrink-0">
        </div>

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          <button onClick={onSyntaxCheck} disabled={isScanning} title="PolishPy Syntax Diagnostic" className={`flex items-center gap-1.5 lg:gap-2.5 px-3 lg:px-5 py-2 rounded-[8px] border text-accent ui-label transition-all text-[10px] ${isScanning ? 'bg-accent/20 border-accent animate-pulse' : 'border-accent/10 hover:bg-accent/10 hover:border-accent/30'}`}>
            <ShieldCheck className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isScanning ? 'SCANNING' : 'SYNTAX'}</span>
          </button>
          <button onClick={onPolish} disabled={isPolishing} title="PolishPy Autocmd Fix pipeline" className={`flex items-center gap-1.5 lg:gap-2.5 px-3 lg:px-5 py-2 rounded-[8px] border text-accent ui-label transition-all text-[10px] ${isPolishing ? 'bg-accent/20 border-accent' : 'border-accent/10 hover:bg-accent/10 hover:border-accent/30'}`}>
            <Sparkles className={`w-3.5 h-3.5 ${isPolishing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isPolishing ? 'RUNNING' : 'POLISH'}</span>
          </button>
          <button onClick={onExecute} className="flex items-center gap-1.5 lg:gap-2.5 px-4 lg:px-6 py-2 rounded-[8px] text-dark ui-label text-[10px] hover:brightness-110 active-press shadow-xl shadow-accent/5"
            style={{ background: 'var(--accent-gradient)' }}>
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="hidden sm:inline">EXECUTE</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-0 relative bg-dark">
        {isPolishing && (
          <div className="lava-container">
            <div className="lava-overlay" />
            <div className="lava-wave" />
          </div>
        )}

        {pendingCode ? (
          <div className="flex-1 flex flex-col relative z-20">
            <div className="flex items-center justify-between px-6 py-3 bg-accent/10 border-b border-accent/30">
              <span className="ui-label text-accent text-[10px]">PENDING CHANGES - REVIEW BEFORE ACCEPTING</span>
              <div className="flex items-center gap-2">
                <button onClick={onAcceptPending} className="px-4 py-1.5 bg-accent text-dark ui-label text-[10px] rounded-[8px] active-press">ACCEPT</button>
                <button onClick={onRejectPending} className="px-4 py-1.5 bg-white/5 text-tertiary/60 hover:text-secondary ui-label text-[10px] rounded-[8px] active-press">REJECT</button>
              </div>
            </div>
            <pre className="flex-1 bg-transparent p-6 lg:p-10 overflow-auto code-editor leading-relaxed text-accent/90 selection:bg-accent/20 whitespace-pre-wrap">
              {pendingCode}
            </pre>
          </div>
        ) : (
          <textarea 
            className="flex-1 bg-transparent p-6 lg:p-10 outline-none code-editor leading-relaxed resize-none text-tertiary selection:bg-accent/20 relative z-20 scroll-fade"
            value={activeFile.content || ''}
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            data-gramm="false"
            onChange={(e) => onCodeChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === 's') {
                e.preventDefault();
                onSave?.();
              }
            }}
          />
        )}

        <div className="border-t border-border bg-dark flex flex-col relative z-50 shrink-0" style={{ height: terminalOpen ? consoleHeight : 40 }}>
          {terminalOpen && <div onMouseDown={onConsoleResize} className="absolute -top-1 left-0 right-0 h-2 cursor-row-resize z-20" />}
          
          <div onClick={() => setTerminalOpen(!terminalOpen)} className="h-10 px-4 flex items-center justify-between border-b border-border/10 cursor-pointer shrink-0 hover:bg-white/[0.02] transition-colors">
            <div className="flex items-center gap-2">
               <span className="ui-label text-[9px] tracking-[0.3em] font-black gradient-text">TERMINAL</span>
            </div>
            {terminalOpen ? <ChevronDown className="w-4 h-4 text-tertiary/10" /> : <ChevronUp className="w-4 h-4 text-tertiary/10" />}
          </div>

          {terminalOpen && (
            <div className="flex-1 min-h-0 bg-dark overflow-hidden">
              <Terminal height={consoleHeight - 40} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Editor;