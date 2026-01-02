import React, { useEffect, useRef } from 'react';
import { Terminal as XTerm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

interface TerminalProps {
  cwd?: string;
  height?: number;
}

declare global {
  interface Window {
    pty: {
      spawn: (cwd?: string) => Promise<{ success: boolean }>;
      write: (data: string) => Promise<{ success: boolean }>;
      resize: (cols: number, rows: number) => Promise<{ success: boolean }>;
      kill: () => Promise<{ success: boolean }>;
      onData: (callback: (data: string) => void) => void;
      onExit: (callback: (code: number) => void) => void;
      removeListeners: () => void;
    };
    _ptySpawned?: boolean;
    _terminalBuffer?: string;
  }
}

const Terminal: React.FC<TerminalProps> = ({ cwd, height = 300 }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<XTerm | null>(null);
  const fitRef = useRef<FitAddon | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    // clean up any existing terminal
    if (termRef.current) {
      termRef.current.dispose();
      termRef.current = null;
    }

    // get theme colors from CSS variables - fallbacks only used if vars not set
    const cs = getComputedStyle(document.documentElement);
    const bgDark = cs.getPropertyValue('--bg-dark').trim();
    const textColor = cs.getPropertyValue('--tertiary').trim();
    const accentColor = cs.getPropertyValue('--accent').trim();
    const accentStart = cs.getPropertyValue('--accent-start').trim() || accentColor;

    const term = new XTerm({
      fontFamily: '"JetBrains Mono", "Menlo", "Monaco", "Consolas", monospace',
      fontSize: 13,
      lineHeight: 1.5,
      letterSpacing: 0,
      cursorBlink: true,
      cursorStyle: 'bar',
      allowTransparency: false,
      theme: {
        background: bgDark || '#050505',
        foreground: textColor || '#ede1d3',
        cursor: accentStart,
        cursorAccent: bgDark || '#050505',
        selectionBackground: (accentColor || '#3b82f6') + '40',
        selectionForeground: textColor || '#ede1d3'
      }
    });

    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    
    fit.fit();
    termRef.current = term;
    fitRef.current = fit;

    if (window.pty) {
      window.pty.removeListeners();
      window._terminalBuffer = window._terminalBuffer || '';
      
      window.pty.onData((data: string) => {
        if (termRef.current) termRef.current.write(data);
        window._terminalBuffer = (window._terminalBuffer + data).slice(-2000);
      });
      window.pty.onExit((code: number) => {
        if (termRef.current) termRef.current.write(`\r\n[exited: ${code}]\r\n`);
        window._ptySpawned = false;
      });
      term.onData((data) => {
        window.pty.write(data);
      });
      term.onResize(({ cols, rows }) => {
        window.pty.resize(cols, rows);
      });
      
      if (!window._ptySpawned) {
        window._ptySpawned = true;
        window.pty.spawn(cwd);
      }
    } else {
      term.write('\x1b[38;2;239;68;68mcadence isn\'t online\x1b[0m\r\n\r\n');
      term.write('not running in electron environment\r\n');
      term.write('start with: npm run electron-dev\r\n');
    }

    return () => {
      // don't kill pty or remove listeners on unmount - just dispose xterm
      if (termRef.current) {
        termRef.current.dispose();
        termRef.current = null;
      }
      fitRef.current = null;
    };
  }, [cwd]);

  useEffect(() => {
    const handleResize = () => fitRef.current?.fit();
    window.addEventListener('resize', handleResize);
    const timer = setTimeout(handleResize, 100);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timer);
    };
  }, [height]);

  // update terminal theme when accent changes
  useEffect(() => {
    const updateTheme = () => {
      if (!termRef.current) return;
      const cs = getComputedStyle(document.documentElement);
      const bgDark = cs.getPropertyValue('--bg-dark').trim() || '#050505';
      const textColor = cs.getPropertyValue('--tertiary').trim() || '#ede1d3';
      const accentColor = cs.getPropertyValue('--accent').trim() || '#3b82f6';
      termRef.current.options.theme = {
        background: bgDark,
        foreground: textColor,
        cursor: accentColor,
        cursorAccent: bgDark,
        selectionBackground: accentColor + '40',
        selectionForeground: textColor
      };
    };
    const obs = new MutationObserver(updateTheme);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['style', 'class'] });
    return () => obs.disconnect();
  }, []);

  return (
    <div 
      ref={containerRef} 
      className="w-full h-full overflow-hidden px-4 pt-2"
      style={{ height: height - 40 }}
    />
  );
};

export default Terminal;
