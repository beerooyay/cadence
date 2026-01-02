import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Search, Database, Settings, Moon, Sun, Coffee, FilePlus, FolderPlus, Trash2, Edit3, X, FolderOpen, Loader2 } from 'lucide-react';
import { FileSystemItem, SecurityTier, ThemeMode, AccentColor } from '../types';
import { ACCENTS, THEME } from '../constants';

interface SidebarProps {
  files: Record<string, FileSystemItem>;
  activeFileId: string | null;
  onFileClick: (file: FileSystemItem) => void;
  securityTier: SecurityTier;
  themeMode: ThemeMode;
  accentColor: AccentColor;
  onThemeChange: (mode: ThemeMode) => void;
  onAccentChange: (color: AccentColor) => void;
  onCreateFile: (parentId: string, name: string, type: 'file' | 'folder') => void;
  onDeleteFile: (id: string) => void;
  onRenameFile: (id: string, newName: string) => void;
  onOpenFolder?: () => void;
}

const FileItem: React.FC<{ 
    item: FileSystemItem; 
    depth: number; 
    onFileClick: (f: FileSystemItem) => void;
    files: Record<string, FileSystemItem>;
    activeFileId: string | null;
    onDelete: (id: string) => void;
    onRename: (id: string, name: string) => void;
    onCreate: (parentId: string, type: 'file' | 'folder') => void;
}> = ({ item, depth, onFileClick, files, activeFileId, onDelete, onRename, onCreate }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(item.name);
  const isFolder = item.type === 'folder';
  const isActive = item.id === activeFileId;

  const handleRename = () => {
    if (editName.trim() && editName !== item.name) {
      onRename(item.id, editName);
    }
    setIsEditing(false);
  };

  return (
    <div className="select-none px-2 py-0.5">
      <div 
        className={`group flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-[8px] transition-all relative
          ${isActive ? 'bg-accent/10 text-accent font-bold' : 'text-tertiary/40 hover:bg-white/5 hover:text-tertiary/80'}`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={() => {
          if (isFolder) setIsOpen(!isOpen);
          onFileClick(item);
        }}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {isFolder ? (
            isOpen ? <ChevronDown className="w-3.5 h-3.5 opacity-60" /> : <ChevronRight className="w-3.5 h-3.5 opacity-60" />
          ) : (
            <FileText className="w-3.5 h-3.5 opacity-30" />
          )}
          
          {isEditing ? (
            <input 
                autoFocus
                className="bg-panel border border-accent/40 rounded-sm px-1 py-0 w-full ui-label text-tertiary outline-none"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); }}
                onClick={e => e.stopPropagation()}
            />
          ) : (
            <span className="ui-label truncate flex-1">{item.name}</span>
          )}
        </div>

        {!isEditing && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                {isFolder && (
                    <button onClick={(e) => { e.stopPropagation(); onCreate(item.id, 'file'); }} className="p-1 hover:text-accent"><FilePlus className="w-3 h-3" /></button>
                )}
                <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} className="p-1 hover:text-accent"><Edit3 className="w-3 h-3" /></button>
                {item.id !== 'root' && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} className="p-1 hover:text-secondary"><Trash2 className="w-3 h-3" /></button>
                )}
            </div>
        )}
      </div>

      {isFolder && isOpen && item.children?.map(childId => (
        <FileItem 
          key={childId} 
          item={files[childId]} 
          depth={depth + 1} 
          onFileClick={onFileClick} 
          files={files} 
          activeFileId={activeFileId} 
          onDelete={onDelete}
          onRename={onRename}
          onCreate={onCreate}
        />
      ))}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ 
    files, activeFileId, onFileClick, securityTier, themeMode, accentColor, onThemeChange, onAccentChange, 
    onCreateFile, onDeleteFile, onRenameFile, onOpenFolder 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isCreating, setIsCreating] = useState<{ parentId: string, type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const [activeModel, setActiveModel] = useState<string>('qwen');
  const [loadingModel, setLoadingModel] = useState<string | null>(null);
  const cleanTier = securityTier.toUpperCase().replace(/_/g, ' ');

  const handleCreateSubmit = () => {
    if (newName.trim() && isCreating) {
      onCreateFile(isCreating.parentId, newName, isCreating.type);
    }
    setIsCreating(null);
    setNewName('');
  };

  const accentOptions = (Object.keys(ACCENTS) as AccentColor[]).map(key => ({
    key,
    color: ACCENTS[key]
  }));

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="pl-24 pr-5 border-b border-border flex items-center justify-between h-12 shrink-0 select-none" style={{ WebkitAppRegion: 'drag' } as React.CSSProperties}>
        <div className="flex items-center gap-3">
          <svg viewBox="0 0 1080 1080" className="w-5 h-5">
            <defs>
              <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: 'var(--accent)' }} />
                <stop offset="100%" style={{ stopColor: 'var(--accent)' }} />
              </linearGradient>
            </defs>
            <g fill="url(#waveGradient)">
              <path d="M342.53,430.17c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M667.82,553.65c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
              <path d="M476.59,312.97c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M801.89,436.45c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
              <path d="M207.32,548.37c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M532.61,671.85c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
            </g>
          </svg>
          <span className="font-black text-[16px] tracking-wide lowercase text-tertiary">cadence</span>
        </div>
        {onOpenFolder && (
          <button 
            onClick={onOpenFolder}
            className="p-1.5 text-tertiary/30 hover:text-accent transition-colors"
            title="Open Folder"
            style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
          >
            <FolderOpen className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between px-5 pt-4 pb-2">
         <span className="ui-label gradient-text">EXPLORER</span>
         <div className="flex items-center gap-1">
            <button 
                onClick={() => setIsCreating({ parentId: 'root', type: 'file' })}
                className="p-1.5 text-tertiary/20 hover:text-accent fast-transition"
                title="New File"
            >
                <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={() => setIsCreating({ parentId: 'root', type: 'folder' })}
                className="p-1.5 text-tertiary/20 hover:text-accent fast-transition"
                title="New Folder"
            >
                <FolderPlus className="w-3.5 h-3.5" />
            </button>
         </div>
      </div>

      <div className="px-5 mb-4">
        <div className="relative flex items-center group">
          <Search className="absolute left-0 w-3.5 h-3.5 text-tertiary/10 group-focus-within:text-accent transition-colors" />
          <input 
            type="text" 
            placeholder="FILTER..." 
            className="w-full bg-transparent border-b border-border rounded-none pl-6 py-1.5 ui-label focus:border-accent/40 transition-all placeholder:text-tertiary/10"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar py-2">
        {isCreating && (
            <div className="px-4 py-2 flex items-center gap-2 animate-in slide-in-from-top-2">
                {isCreating.type === 'file' ? <FileText className="w-3.5 h-3.5 text-accent" /> : <Folder className="w-3.5 h-3.5 text-accent" />}
                <input 
                    autoFocus
                    placeholder={`NAME ${isCreating.type}...`}
                    className="bg-dark border border-accent/40 rounded-sm px-2 py-1 w-full ui-label text-accent placeholder:text-accent/20 outline-none"
                    value={newName}
                    onChange={e => setNewName(e.target.value)}
                    onBlur={handleCreateSubmit}
                    onKeyDown={e => { if (e.key === 'Enter') handleCreateSubmit(); if (e.key === 'Escape') setIsCreating(null); }}
                />
            </div>
        )}
        <FileItem 
          item={files['root']} 
          depth={0} 
          onFileClick={onFileClick} 
          files={files} 
          activeFileId={activeFileId} 
          onDelete={onDeleteFile}
          onRename={onRenameFile}
          onCreate={(p, t) => setIsCreating({ parentId: p, type: t })}
        />
      </div>

      <div className="mt-auto pt-4 px-5 pb-5 space-y-4 border-t border-border bg-dark/10 relative">
        {showSettings && (
          <div className="absolute bottom-full left-5 right-5 mb-0 p-5 bg-panel border border-border rounded-large animate-in fade-in slide-in-from-bottom-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[200]">
             <div className="flex justify-between items-center mb-4">
                <span className="ui-label text-tertiary/30 tracking-[0.2em] font-black">PREFERENCES</span>
                <button onClick={() => setShowSettings(false)} className="text-tertiary/20 hover:text-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
             </div>
             <div className="grid grid-cols-2 gap-4 justify-items-center mb-4">
                {accentOptions.map(({ key, color }) => (
                  <button 
                    key={key}
                    onClick={() => onAccentChange(key)}
                    className={`w-12 h-12 rounded-full border transition-all duration-300 active-press flex items-center justify-center group overflow-hidden
                      ${accentColor === key 
                        ? 'border-white/40 scale-100 shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                        : 'border-transparent opacity-60 hover:opacity-100 scale-95'}`}
                    style={{ background: color }}
                  >
                    {accentColor === key && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_white]" />}
                  </button>
                ))}
             </div>
             <div className="flex gap-2 mb-4">
                {[
                  { mode: 'dark' as ThemeMode, icon: Moon },
                  { mode: 'light' as ThemeMode, icon: Sun },
                  { mode: 'dawn' as ThemeMode, icon: Coffee }
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => onThemeChange(mode as ThemeMode)}
                    style={themeMode === mode ? { background: 'var(--accent-gradient)' } : {}}
                    className={`flex-1 h-12 rounded-[8px] border flex items-center justify-center transition-all duration-300 active-press
                      ${themeMode === mode
                        ? 'border-transparent text-dark shadow-lg shadow-accent/20'
                        : 'bg-white/5 border-white/5 text-tertiary/20 hover:text-tertiary/60 hover:bg-white/10'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
             </div>
             <div className="mb-2">
                <span className="ui-label text-tertiary/20 text-[10px]">MODEL</span>
             </div>
             <div className="flex gap-2">
                  {['qwen', 'llama'].map((m) => (
                    <button 
                      key={m}
                      onClick={async () => {
                        setLoadingModel(m);
                        try {
                          await fetch(`http://localhost:11435/api/models/${m}`, { method: 'POST' });
                          setActiveModel(m);
                        } catch {} finally { setLoadingModel(null); }
                      }}
                      className={`flex-1 h-10 rounded-[8px] border text-[11px] font-bold uppercase tracking-wider transition-all duration-300 active-press flex items-center justify-center gap-2
                        ${activeModel === m ? 'text-dark border-transparent shadow-lg shadow-accent/20' : 'bg-white/5 border-white/5 text-tertiary/40 hover:text-tertiary hover:bg-white/10'}`}
                      style={activeModel === m ? { background: 'var(--accent-gradient)' } : {}}
                    >
                      {loadingModel === m ? <Loader2 className="w-3 h-3 animate-spin" /> : m}
                    </button>
                  ))}
             </div>
          </div>
        )}

        <button 
          onClick={() => setShowSettings(!showSettings)} 
          className={`w-full h-12 rounded-[8px] flex items-center justify-center gap-2 transition-all active-press
            ${showSettings ? 'text-dark shadow-lg shadow-accent/20' : 'bg-white/5 text-tertiary/40 hover:text-tertiary hover:bg-white/10'}`}
          style={showSettings ? { background: 'var(--accent-gradient)' } : {}}
        >
          <Settings className="w-4 h-4" />
          <span className="ui-label text-[10px] tracking-wider">settings</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;