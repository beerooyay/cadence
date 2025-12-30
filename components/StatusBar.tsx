import React from 'react';
import { Globe, LayoutGrid, MessageSquare } from 'lucide-react';
import { FileSystemItem } from '../types';

interface StatusBarProps {
  activeFile: FileSystemItem | null;
  isProcessing: boolean;
  isUtilityActive?: boolean;
  mobileView: 'dash' | 'chat';
  isSidebarOpen: boolean;
  isChatOpen: boolean;
  onViewChange: (view: 'dash' | 'chat') => void;
}

const StatusBar: React.FC<StatusBarProps> = ({ isProcessing, isUtilityActive, mobileView, isSidebarOpen, isChatOpen, onViewChange }) => {
  const isDesktop = typeof window !== 'undefined' && window.innerWidth >= 1024;
  
  // Dashboard active if in mobile dash view OR sidebar is open on desktop
  const isDashActive = isDesktop ? isSidebarOpen : mobileView === 'dash';
  // Chat active if in mobile chat view OR chat panel is open on desktop
  const isChatActive = isDesktop ? isChatOpen : mobileView === 'chat';

  // The dock hides if specifically asked to hide on desktop to clear workspace
  const shouldHideDock = isSidebarOpen && isChatOpen && isDesktop;

  return (
    <footer className="h-10 shrink-0 select-none relative z-[200]">
      <div className="absolute inset-0 bg-panel border-t border-border" />

      <div className="absolute inset-0 flex justify-center pointer-events-none overflow-visible">
        <div 
          className={`relative w-[160px] h-[64px] self-end transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]
          ${shouldHideDock ? 'translate-y-[110%] opacity-0' : 'translate-y-0 opacity-100'}`}
        >
          <div className="absolute inset-0 bg-panel border-t border-x border-border rounded-t-[32px] z-10 shadow-2xl shadow-black/40" />

          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-auto group/dock">
            <div className="flex items-center gap-2 p-1.5 transition-all duration-500 group-hover/dock:scale-105">
              <button 
                onClick={() => onViewChange('dash')}
                title={isDesktop ? "Toggle Explorer" : "Switch to Dashboard"}
                className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all duration-300 active-press
                  ${isDashActive
                    ? 'bg-accent text-dark shadow-lg shadow-accent/20 scale-100' 
                    : 'bg-white/[0.04] text-tertiary/20 hover:text-tertiary hover:bg-white/10 scale-95 hover:scale-100'}`}
              >
                <LayoutGrid className="w-5 h-5" />
              </button>
              
              <div className="w-[1px] h-6 bg-white/5 mx-0.5 opacity-50" />
              
              <button 
                onClick={() => onViewChange('chat')}
                title={isDesktop ? "Toggle AI Chat" : "Switch to Chat"}
                className={`w-11 h-11 flex items-center justify-center rounded-[14px] transition-all duration-300 active-press
                  ${isChatActive
                    ? 'bg-accent text-dark shadow-lg shadow-accent/20 scale-100' 
                    : 'bg-white/[0.04] text-tertiary/20 hover:text-tertiary hover:bg-white/10 scale-95 hover:scale-100'}`}
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="relative h-10 w-full flex items-center justify-between px-8 text-[9px] font-bold text-tertiary/20 z-30 pointer-events-none tracking-widest">
        <div className="flex items-center gap-8 pointer-events-auto">
          <div className="flex items-center gap-3 text-accent/50 group cursor-pointer hover:text-accent transition-colors">
            <Globe className="w-3.5 h-3.5" />
            <span className="hidden sm:block uppercase">KERNEL ACTIVE</span>
          </div>
        </div>

        <div className="flex items-center gap-8 pointer-events-auto">
          {isProcessing ? (
             <div className="flex items-center gap-3 text-accent uppercase font-black animate-pulse pr-4">
               REASONING...
             </div>
          ) : isUtilityActive ? (
            <div className="flex items-center gap-3 text-tertiary/40 uppercase font-black pr-4">
               SYNCING...
             </div>
          ) : null}
          
          <div className="flex items-center gap-6 pl-8 border-l border-border h-full text-tertiary/10 no-wrap uppercase">
             <span className="hidden xs:inline">UTF-8</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StatusBar;