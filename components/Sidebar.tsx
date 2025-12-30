import React, { useState } from 'react';
import { Folder, FileText, ChevronRight, ChevronDown, Search, Database, Shield, Settings, Moon, Sun, Coffee, FilePlus, FolderPlus, Trash2, Edit3, X } from 'lucide-react';
import { FileSystemItem, SecurityTier, ThemeMode, AccentColor } from '../types';

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
        className={`group flex items-center gap-2 px-2 py-1.5 cursor-pointer rounded-base transition-all relative
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
    onCreateFile, onDeleteFile, onRenameFile 
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [isCreating, setIsCreating] = useState<{ parentId: string, type: 'file' | 'folder' } | null>(null);
  const [newName, setNewName] = useState('');
  const cleanTier = securityTier.toUpperCase().replace(/_/g, ' ');

  const handleCreateSubmit = () => {
    if (newName.trim() && isCreating) {
      onCreateFile(isCreating.parentId, newName, isCreating.type);
    }
    setIsCreating(null);
    setNewName('');
  };

  const accentOptions: { key: AccentColor; color: string }[] = [
    { key: 'red', color: '#ef4444' },
    { key: 'orange', color: '#f97316' },
    { key: 'green', color: '#22c55e' },
    { key: 'blue', color: '#3b82f6' },
    { key: 'purple', color: '#a855f7' },
    { key: 'pink', color: '#ec4899' },
    { key: 'g-red', color: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
    { key: 'g-blue', color: 'linear-gradient(135deg, #22c55e 0%, #3b82f6 100%)' },
    { key: 'g-yellow', color: 'linear-gradient(135deg, #facc15 0%, #f97316 100%)' },
  ];

  return (
    <div className="flex flex-col h-full bg-panel">
      <div className="p-5 border-b border-border flex items-center justify-between h-12 shrink-0">
        <div className="nova-brand">
          <span className="text-white">nova</span>
        </div>
      </div>

      <div className="flex items-center justify-between px-5 pt-4 pb-2">
         <span className="ui-label text-tertiary/20">EXPLORER</span>
         <div className="flex items-center gap-2">
            <button 
                onClick={() => setIsCreating({ parentId: 'root', type: 'file' })}
                className="p-1.5 text-tertiary/20 hover:text-accent transition-colors"
                title="New File"
            >
                <FilePlus className="w-3.5 h-3.5" />
            </button>
            <button 
                onClick={() => setIsCreating({ parentId: 'root', type: 'folder' })}
                className="p-1.5 text-tertiary/20 hover:text-accent transition-colors"
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
          <div className="absolute bottom-full left-5 right-5 mb-0 p-5 bg-panel border border-border rounded-large space-y-6 animate-in fade-in slide-in-from-bottom-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[200]">
             <div className="flex justify-between items-center">
                <span className="ui-label text-tertiary/30 tracking-[0.2em] font-black">PREFERENCES</span>
                <button onClick={() => setShowSettings(false)} className="text-tertiary/20 hover:text-secondary transition-colors">
                  <X className="w-4 h-4" />
                </button>
             </div>
             
             {/* Accent Color Palette 3x3 (Top) */}
             <div className="grid grid-cols-3 gap-4 justify-items-center">
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

             {/* Theme Selection (Bottom) */}
             <div className="flex gap-2">
                {[
                  { mode: 'dark', icon: Moon },
                  { mode: 'light', icon: Sun },
                  { mode: 'dawn', icon: Coffee }
                ].map(({ mode, icon: Icon }) => (
                  <button 
                    key={mode}
                    onClick={() => onThemeChange(mode as ThemeMode)}
                    className={`flex-1 h-12 rounded-base border flex items-center justify-center transition-all duration-300 active-press
                      ${themeMode === mode 
                        ? 'bg-black border-accent/40 text-accent shadow-inner' 
                        : 'bg-white/5 border-white/5 text-tertiary/20 hover:text-tertiary/60 hover:bg-white/10'}`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
             </div>
          </div>
        )}

        <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-3 ui-label text-tertiary/15 lowercase">
                <Database className="w-4 h-4 opacity-20" />
                <span>snap v3.1.2</span>
            </div>
            <button onClick={() => setShowSettings(!showSettings)} className={`p-2 transition-all rounded-base ${showSettings ? 'bg-accent text-dark shadow-lg shadow-accent/20' : 'text-tertiary/20 hover:text-tertiary hover:bg-white/5'}`}>
                <Settings className="w-4 h-4" />
            </button>
        </div>

        <button className="w-full flex items-center gap-3 px-6 py-3 rounded-base bg-accent text-dark ui-label hover:brightness-110 active-press shadow-2xl shadow-accent/5 justify-center transition-all group overflow-hidden flex-nowrap whitespace-nowrap">
           <Shield className="w-3.5 h-3.5 transition-transform group-hover:scale-110 shrink-0" />
           <span className="whitespace-nowrap pt-0.5">{cleanTier}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;