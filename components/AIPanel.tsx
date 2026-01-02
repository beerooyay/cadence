
import React, { useState, useRef, useEffect } from 'react';
import { Send, Check, RefreshCw, X, ChevronDown, Paperclip, FileText, Image, FileCode, Search, Loader2, PanelRight, Plus, History, Terminal, Edit3, Trash2 } from 'lucide-react';
import { ChatMessage } from '../types';
import { generateAIResponseStream } from '../services/polishpyService';

interface AIPanelProps {
  messages: ChatMessage[];
  onSendMessage: (msg: ChatMessage) => void;
  onUpdateLastMessage: (text: string) => void;
  isProcessing: boolean;
  setProcessing: (val: boolean) => void;
  contextCode: string;
  fileTreeSummary: string;
  onApplyToSource?: (code: string) => void;
  onRejectMessage?: (id: string) => void;
  onCloseMobile?: () => void;
  onNewConversation?: () => void;
  onOpenTerminal?: () => void;
  onTerminalCommand?: (cmd: string) => void;
  isMobileView?: boolean;
  files?: Record<string, any>;
}

type Attachment = {
  name: string;
  content: string;
  type: 'image' | 'text' | 'code' | 'file';
  icon?: string;
};

const FormattedMessage: React.FC<{
    messageId: string,
    text: string,
    onApply?: (code: string) => void,
    onReject?: (id: string) => void,
    onOpenTerminal?: () => void,
    onTerminalCommand?: (cmd: string) => void
}> = ({ messageId, text, onApply, onReject, onOpenTerminal, onTerminalCommand }) => {
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [thinkExpanded, setThinkExpanded] = useState(false);
  const [terminalExpanded, setTerminalExpanded] = useState(false);
  const [webExpanded, setWebExpanded] = useState(false);
  
  const parseMessage = (raw: string) => {
    const segments: { type: string; content: string }[] = [];
    let remaining = raw;
    
    while (remaining.length > 0) {
      const thinkMatch = remaining.match(/^<think>([\s\S]*?)<\/think>/i);
      if (thinkMatch) {
        segments.push({ type: 'think', content: thinkMatch[1] });
        remaining = remaining.slice(thinkMatch[0].length).trim();
        continue;
      }
      
      const codeMatch = remaining.match(/^```(\w*)\n?([\s\S]*?)```/);
      if (codeMatch) {
        segments.push({ type: 'code', content: codeMatch[0] });
        remaining = remaining.slice(codeMatch[0].length).trim();
        continue;
      }
      
      const actionMatch = remaining.match(/^action:\s*(\w+)\s*\naction input:\s*([^\n]+)/i);
      if (actionMatch) {
        segments.push({ type: 'action', content: `${actionMatch[1]}: ${actionMatch[2]}` });
        remaining = remaining.slice(actionMatch[0].length).trim();
        continue;
      }
      
      const obsMatch = remaining.match(/^observation:\s*([\s\S]*?)(?=\n\n|$)/i);
      if (obsMatch) {
        segments.push({ type: 'observation', content: obsMatch[1] });
        remaining = remaining.slice(obsMatch[0].length).trim();
        continue;
      }
      
      const nextSpecial = remaining.search(/<think>|```|action:|observation:/i);
      if (nextSpecial > 0) {
        segments.push({ type: 'text', content: remaining.slice(0, nextSpecial).trim() });
        remaining = remaining.slice(nextSpecial);
      } else if (nextSpecial === -1) {
        if (remaining.trim()) segments.push({ type: 'text', content: remaining.trim() });
        break;
      } else {
        remaining = remaining.slice(1);
      }
    }
    return segments;
  };
  
  const segments = parseMessage(text);

  const handleApply = (code: string) => {
    if (onApply) {
      onApply(code);
      setAppliedCode(code);
    }
  };

  return (
    <div className="space-y-3">
      {segments.map((seg, i) => {
        if (seg.type === 'think') {
          return (
            <div key={i} className="my-3">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-dark/40 border border-border rounded-[8px] hover:bg-dark/60 transition-all w-full cursor-pointer" onClick={() => setThinkExpanded(!thinkExpanded)}>
                <ChevronDown className={`w-3 h-3 text-tertiary/40 transition-transform ${thinkExpanded ? 'rotate-180' : ''}`} />
                <span className="ui-label text-[10px] text-tertiary/30 tracking-[0.15em]">THINKING</span>
                <div className="flex-1" />
                <div className="p-1 text-accent/60">
                  <RefreshCw className="w-3.5 h-3.5" />
                </div>
              </div>
              {thinkExpanded && (
                <div className="mt-2 px-4 py-3 bg-dark/20 border border-border rounded-[8px] max-h-[120px] overflow-y-auto">
                  <p className="text-[11px] leading-relaxed text-tertiary/50 font-mono whitespace-pre-wrap">
                    {seg.content.slice(0, 300)}{seg.content.length > 300 ? '...' : ''}
                  </p>
                </div>
              )}
            </div>
          );
        }
        if (seg.type === 'code') {
          const code = seg.content.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          const lang = seg.content.match(/```(\w+)/)?.[1] || '';
          const isRecentlyApplied = appliedCode === code;

          return (
            <div key={i} className="group relative my-8 animate-in zoom-in-95 duration-500">
              <div className="flex items-center justify-between px-4 py-2 bg-dark/40 border-t border-x border-border rounded-t-base">
                 <div className="ui-label text-[8px] text-tertiary/20 tracking-[0.2em] uppercase">
                    {lang || 'source_buffer'}
                 </div>
                 {onApply && (
                   <div className="flex items-center gap-2">
                      <span className="ui-label text-[7px] text-tertiary/10">⌘ ENTER TO APPLY</span>
                   </div>
                 )}
              </div>
              <pre className="bg-dark/60 border-x border-border p-6 overflow-x-auto no-scrollbar font-mono text-[12px] leading-relaxed text-tertiary/70 selection:bg-accent/20">
                <code>{code}</code>
              </pre>

              {onApply && (
                <div className="flex items-center gap-px bg-border/20 rounded-b-base overflow-hidden border border-border">
                  <button
                    onClick={() => handleApply(code)}
                    disabled={isRecentlyApplied}
                    className={`flex-1 h-11 flex items-center justify-center gap-2.5 ui-label text-[10px] transition-all active-press
                      ${isRecentlyApplied
                        ? 'bg-accent/10 text-accent cursor-default'
                        : 'text-dark hover:brightness-110 active:scale-[0.98]'}`}
              style={isRecentlyApplied ? {} : { background: 'var(--accent-gradient)' }}
                  >
                    {isRecentlyApplied ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>{isRecentlyApplied ? 'ACCEPTED' : 'ACCEPT'}</span>
                  </button>
                  <button
                    onClick={() => onReject?.(messageId)}
                    className="flex-1 h-11 bg-panel hover:bg-white/[0.02] text-tertiary/40 hover:text-secondary flex items-center justify-center gap-2.5 ui-label text-[10px] transition-all active-press border-l border-border"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>REJECT</span>
                  </button>
                </div>
              )}
            </div>
          );
        }
        if (seg.type === 'action') {
          const actionParts = seg.content.split(': ');
          const actionType = actionParts[0]?.toLowerCase() || '';
          const actionInput = actionParts[1] || seg.content;
          const nextSeg = segments[i + 1];
          const output = nextSeg?.type === 'observation' ? nextSeg.content : '';
          const outputLines = output.split('\n').filter(l => l.trim());
          const preview = outputLines.slice(0, 5).join('\n');
          const hasMore = outputLines.length > 5;
          
          const isWebAction = actionType === 'webfetch' || actionType === 'websearch';
          const isTerminalAction = actionType === 'execute';
          const label = isWebAction ? 'WEB' : 'TERMINAL';
          const expanded = isWebAction ? webExpanded : terminalExpanded;
          const setExpanded = isWebAction ? setWebExpanded : setTerminalExpanded;
          
          return (
            <div key={i} className="my-3">
              <div className="flex items-center gap-2 px-3 py-2.5 bg-dark/40 border border-border rounded-[8px] hover:bg-dark/60 transition-all w-full cursor-pointer" onClick={() => setExpanded(!expanded)}>
                <ChevronDown className={`w-3 h-3 text-tertiary/40 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                <span className="ui-label text-[10px] text-tertiary/30 tracking-[0.15em]">{label}</span>
                <div className="flex-1" />
                {isTerminalAction && onOpenTerminal && (
                  <div onClick={(e) => { e.stopPropagation(); onOpenTerminal(); }} className="p-1 hover:text-accent text-accent/60 transition-colors">
                    <Terminal className="w-3.5 h-3.5" />
                  </div>
                )}
                {isWebAction && (
                  <div className="p-1 text-accent/60">
                    <Search className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
              {expanded && (
                <div className="mt-2 px-4 py-3 bg-dark/20 border border-border rounded-[8px] max-h-[120px] overflow-y-auto">
                  <p className="text-[11px] text-accent/70 font-mono mb-2 break-all">{actionInput}</p>
                  {output && (
                    <pre className="text-[11px] text-tertiary/50 font-mono whitespace-pre-wrap break-words">
                      {hasMore ? preview + `\n...${outputLines.length - 5} more lines` : output}
                    </pre>
                  )}
                </div>
              )}
            </div>
          );
        }
        if (seg.type === 'observation') {
          return null;
        }
        if (seg.type === 'text' && seg.content.trim()) {
          let content = seg.content.trim();
          // filter out any leaked think content
          content = content.replace(/<\/?think>/gi, '').replace(/^think>/i, '').trim();
          if (!content) return null;
          const isTraceback = content.startsWith('Traceback') || content.startsWith('File "') || (content.includes('Error:') && content.includes('line '));
          if (isTraceback) return null;
          // skip if content is mostly thinking ramble
          if (content.toLowerCase().includes('okay, the user') || content.toLowerCase().includes('let me check') || content.toLowerCase().includes('wait, the rules')) return null;
          
          const formatLine = (line: string) => {
            const parts = line.split(/(`[^`]+`|'[a-z_]+')/).filter(Boolean);
            return parts.map((part, idx) => {
              if (part.startsWith('`') || (part.startsWith("'") && part.endsWith("'") && /^'[a-z_]+'$/.test(part))) {
                const code = part.slice(1, -1);
                return <code key={idx} className="px-1.5 py-0.5 bg-dark/40 rounded text-accent/80 font-mono text-[12px]">{code}</code>;
              }
              return <span key={idx}>{part}</span>;
            });
          };
          
          return (
            <span key={i} className="content-text leading-relaxed text-tertiary/60 block opacity-90">
              {content.split('\n').map((line, lineIdx) => (
                <React.Fragment key={lineIdx}>
                  {formatLine(line)}
                  {lineIdx !== content.split('\n').length - 1 && <br />}
                </React.Fragment>
              ))}
            </span>
          );
        }
        return null;
      })}
    </div>
  );
};

const AIPanel: React.FC<AIPanelProps> = ({
  messages, onSendMessage, onUpdateLastMessage, isProcessing, setProcessing, contextCode, fileTreeSummary, onApplyToSource, onRejectMessage, onCloseMobile, onNewConversation, onOpenTerminal, onTerminalCommand, isMobileView, files
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const [conversations, setConversations] = useState<{ id: string; title: string; messages: ChatMessage[]; timestamp: number }[]>([]);
  const [currentConvId, setCurrentConvId] = useState<string>(Date.now().toString());
  const [editingConvId, setEditingConvId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);

  const prevMsgCount = useRef(messages.length);
  useEffect(() => {
    if (scrollRef.current && messages.length !== prevMsgCount.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      prevMsgCount.current = messages.length;
    }
  }, [messages.length]);

  useEffect(() => {
    const saved = localStorage.getItem('cadence_conversations');
    if (saved) {
      try { setConversations(JSON.parse(saved)); } catch {}
    }
  }, []);

  useEffect(() => {
    if (messages.length > 1) {
      const title = messages.find(m => m.role === 'user')?.text.slice(0, 40) || 'new conversation';
      setConversations(prev => {
        const existing = prev.find(c => c.id === currentConvId);
        const updated = existing 
          ? prev.map(c => c.id === currentConvId ? { ...c, messages, timestamp: Date.now() } : c)
          : [...prev, { id: currentConvId, title, messages, timestamp: Date.now() }];
        localStorage.setItem('cadence_conversations', JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, currentConvId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showHistory && historyRef.current && !historyRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showHistory]);

  const handleLoadConv = (id: string) => {
    const conv = conversations.find(c => c.id === id);
    if (conv) {
      conv.messages.forEach((m, i) => {
        if (i === 0) onNewConversation?.();
        setTimeout(() => onSendMessage(m), i * 10);
      });
      setCurrentConvId(id);
      setShowHistory(false);
    }
  };

  const handleDeleteConv = (id: string) => {
    const updated = conversations.filter(c => c.id !== id);
    setConversations(updated);
    localStorage.setItem('cadence_conversations', JSON.stringify(updated));
  };

  const handleRenameConv = (id: string, newTitle: string) => {
    const updated = conversations.map(c => c.id === id ? { ...c, title: newTitle } : c);
    setConversations(updated);
    localStorage.setItem('cadence_conversations', JSON.stringify(updated));
    setEditingConvId(null);
  };

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [input]);

  const handleFileAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = e.target.files;
    if (!uploadedFiles) return;

    for (let i = 0; i < uploadedFiles.length; i++) {
      const file = uploadedFiles[i];
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result as string;
        let type: 'image' | 'text' | 'code' | 'file' = 'file';

        if (file.type.startsWith('image/')) {
          type = 'image';
        } else if (file.name.endsWith('.py') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.tsx')) {
          type = 'code';
        } else if (file.type.startsWith('text/') || file.name.endsWith('.txt') || file.name.endsWith('.md')) {
          type = 'text';
        }

        setAttachments(prev => [...prev, {
          name: file.name,
          content: content,
          type: type
        }]);
      };

      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        reader.readAsText(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileReference = (fileId: string, fileName: string, fileContent: string) => {
    setAttachments(prev => [...prev, {
      name: fileName,
      content: fileContent,
      type: 'code'
    }]);
    setShowFilePicker(false);
    setFileSearch('');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInput(value);

    if (value.endsWith('@')) {
      setShowFilePicker(true);
    } else if (showFilePicker && !value.includes('@')) {
      setShowFilePicker(false);
    }
  };

  const getAttachmentIcon = (type: Attachment['type']) => {
    switch (type) {
      case 'image': return <Image className="w-3 h-3" />;
      case 'code': return <FileCode className="w-3 h-3" />;
      case 'text': return <FileText className="w-3 h-3" />;
      default: return <FileText className="w-3 h-3" />;
    }
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isProcessing) return;

    let fullPrompt = input.replace(/@$/, '').trim();

    if (attachments.length > 0) {
      fullPrompt += '\n\nattached context:\n';
      attachments.forEach(att => {
        if (att.type === 'image') {
          fullPrompt += `\n[image: ${att.name}]\n${att.content}\n`;
        } else {
          fullPrompt += `\n--- ${att.name} ---\n${att.content}\n`;
        }
      });
    }

    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    onSendMessage(userMsg);
    setInput('');
    setAttachments([]);
    setShowFilePicker(false);
    setProcessing(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', text: '', timestamp: Date.now() };
    onSendMessage(assistantMsg);

    const historyForContext = messages.map(m => ({ role: m.role, text: m.text }));
    const terminalContext = (window as any)._terminalBuffer ? `\n\nrecent terminal output:\n${(window as any)._terminalBuffer.slice(-500)}` : '';
    await generateAIResponseStream(fullPrompt, contextCode + terminalContext, fileTreeSummary, onUpdateLastMessage, historyForContext);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--bg-panel)' }}>
      <div className="flex items-center justify-between px-4 h-10 border-b border-border shrink-0 z-30" style={{ backgroundColor: 'var(--bg-dark)' }}>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => { setCurrentConvId(Date.now().toString()); onNewConversation?.(); }} 
            className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-tertiary/40 hover:text-accent"
            title="new conversation"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="relative" ref={historyRef}>
            <button 
              onClick={() => setShowHistory(!showHistory)}
              className={`p-1.5 rounded-md hover:bg-white/5 transition-colors ${showHistory ? 'text-accent' : 'text-tertiary/40 hover:text-accent'}`}
              title="history"
            >
              <History className="w-4 h-4" />
            </button>
            {showHistory && (
              <div className="absolute top-full left-0 mt-2 w-72 p-4 border border-border rounded-large animate-in fade-in slide-in-from-top-2 shadow-[0_20px_50px_rgba(0,0,0,0.8)] z-[200]" style={{ backgroundColor: 'var(--bg-dark)' }}>
                <div className="flex justify-between items-center mb-3">
                  <span className="ui-label text-tertiary/30 tracking-[0.2em] font-black text-[9px]">HISTORY</span>
                  <button onClick={() => setShowHistory(false)} className="text-tertiary/20 hover:text-secondary transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {conversations.length === 0 ? (
                  <p className="text-tertiary/30 text-[11px] text-center py-4">no saved conversations</p>
                ) : (
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {conversations.map(conv => (
                      <div key={conv.id} className="group relative flex items-center rounded-md hover:bg-white/5 transition-colors">
                        {editingConvId === conv.id ? (
                          <input
                            autoFocus
                            value={editingTitle}
                            onChange={e => setEditingTitle(e.target.value)}
                            onBlur={() => handleRenameConv(conv.id, editingTitle)}
                            onKeyDown={e => e.key === 'Enter' && handleRenameConv(conv.id, editingTitle)}
                            className="flex-1 bg-dark border border-border rounded px-2 py-1 text-[11px] text-tertiary/80 outline-none"
                          />
                        ) : (
                          <>
                            <button
                              onClick={() => handleLoadConv(conv.id)}
                              className="flex-1 text-left p-2 pr-16"
                            >
                              <p className="text-tertiary/60 text-[11px] truncate">{conv.title}</p>
                              <p className="text-tertiary/20 text-[9px]">{new Date(conv.timestamp).toLocaleDateString()}</p>
                            </button>
                            <div className="absolute right-0 top-0 bottom-0 flex items-center gap-1 pr-2 pl-8 opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'linear-gradient(to right, transparent, var(--bg-dark) 20%, var(--bg-dark) 100%)' }}>
                              <button 
                                onClick={() => { setEditingConvId(conv.id); setEditingTitle(conv.title); }}
                                className="p-1 text-tertiary/40 hover:text-accent transition-colors"
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button 
                                onClick={() => handleDeleteConv(conv.id)}
                                className="p-1 text-tertiary/40 hover:text-secondary transition-colors"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="w-8" />
        {isMobileView ? (
          <button onClick={onCloseMobile} className="p-1.5 rounded-md hover:bg-white/5 transition-colors text-tertiary/40 hover:text-accent">
            <PanelRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8" />
        )}
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth scroll-fade" ref={scrollRef}>
        <div className="min-h-full flex flex-col justify-end max-w-4xl mx-auto px-8 py-8 space-y-8">
          {messages.map((msg, idx) => (
            <div key={msg.id} className="flex flex-col gap-2">
              <div className={`flex items-center gap-4 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className="ui-label text-[9px] tracking-[0.3em] font-black gradient-text">
                   {msg.role === 'assistant' ? 'CADENCE' : 'OPERATOR'}
                </div>
                <div className="flex-1 h-[1px] bg-white/5" />
              </div>
              <div className={`flex ${msg.role === 'assistant' ? 'justify-start' : 'justify-end'}`}>
                <div className="max-w-[95%]">
                   <FormattedMessage
                      messageId={msg.id}
                      text={msg.text}
                      onApply={msg.role === 'assistant' ? onApplyToSource : undefined}
                      onReject={onRejectMessage}
                      onOpenTerminal={onOpenTerminal}
                      onTerminalCommand={onTerminalCommand}
                   />
                   {msg.text === '' && isProcessing && idx === messages.length - 1 && (
                     <div className="flex items-center gap-4 animate-pulse pt-4">
                        <div className="w-1.5 h-1.5 bg-accent rounded-full animate-ping" />
                        <span className="ui-label text-accent tracking-[0.5em] font-black text-[9px]">solving...</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 py-6 bg-dark/40 backdrop-blur-2xl shrink-0 z-20 pb-6 relative">
        <div className="max-w-4xl mx-auto">
          {showFilePicker && files && (
            <div className="absolute bottom-full left-8 right-8 mb-2 bg-panel border border-border rounded-[8px] shadow-2xl max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-2 px-3 py-2 bg-dark/40 rounded-[8px]">
                  <Search className="w-3.5 h-3.5 text-tertiary/40" />
                  <input
                    type="text"
                    placeholder="search files..."
                    value={fileSearch}
                    onChange={(e) => setFileSearch(e.target.value)}
                    className="flex-1 bg-transparent text-[11px] text-tertiary outline-none placeholder:text-tertiary/20"
                  />
                </div>
              </div>
              <div className="p-2">
                {Object.values(files)
                  .filter((f: any) => f.type === 'file' && f.name.toLowerCase().includes(fileSearch.toLowerCase()))
                  .slice(0, 10)
                  .map((f: any) => (
                    <button
                      key={f.id}
                      onClick={() => handleFileReference(f.id, f.name, f.content || '')}
                      className="w-full flex items-center gap-2 px-3 py-2 hover:bg-white/5 rounded-[8px] transition-colors text-left"
                    >
                      <FileCode className="w-3.5 h-3.5 text-accent" />
                      <span className="ui-label text-[10px] text-tertiary/70">{f.name}</span>
                    </button>
                  ))}
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {attachments.map((att, idx) => (
                <div key={idx} className="flex items-center gap-2 px-2.5 py-1.5 bg-dark/60 border border-border/50 rounded-md">
                  <div className="text-accent/70">{getAttachmentIcon(att.type)}</div>
                  <span className="ui-label text-[9px] text-tertiary/60 max-w-[120px] truncate">{att.name}</span>
                  <button
                    onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}
                    className="text-tertiary/30 hover:text-secondary transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="bg-panel border border-border rounded-[8px] overflow-hidden">
            <textarea
              ref={textareaRef}
              className="w-full bg-transparent px-6 py-3 content-text font-bold focus:outline-none transition-none resize-none text-tertiary/90 placeholder:text-tertiary/5 text-[12px]"
              placeholder="message cadence..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
                if (e.key === 'Escape' && showFilePicker) {
                  setShowFilePicker(false);
                }
              }}
              rows={1}
              style={{ height: '40px', minHeight: '40px', maxHeight: '120px' }}
            />
            <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 bg-dark/20">
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.txt,.pdf,.md,.json,.py,.js,.ts,.tsx,.jsx"
                  className="hidden"
                  onChange={handleFileAttach}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="p-2 rounded-[8px] transition-all duration-300 active-press text-tertiary/40 hover:bg-white/10"
                  onMouseEnter={(e) => e.currentTarget.style.color = 'var(--accent)'}
                  onMouseLeave={(e) => e.currentTarget.style.color = ''}
                  title="attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>
              </div>
              <button
                className={`p-2.5 rounded-[8px] transition-all active-press
                  ${isProcessing ? 'text-dark shadow-lg shadow-accent/10' : input.trim() || attachments.length > 0 ? 'text-dark shadow-lg shadow-accent/10 hover:brightness-110' : 'bg-white/5 text-tertiary/30 hover:bg-white/10 hover:text-tertiary'}`}
                style={(input.trim() || attachments.length > 0 || isProcessing) ? { background: 'var(--accent-gradient)' } : {}}
                onClick={handleSend}
                disabled={(!input.trim() && attachments.length === 0) || isProcessing}
                title="send message"
              >
                {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
