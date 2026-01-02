
import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronRight, Wand2, Check, RefreshCw, X, RotateCcw, ChevronDown, Paperclip, FileText, Image, FileCode, Search, Loader2, PanelRight } from 'lucide-react';
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
    onReject?: (id: string) => void
}> = ({ messageId, text, onApply, onReject }) => {
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const [thinkExpanded, setThinkExpanded] = useState(false);
  const parts = text.split(/(```[\s\S]*?```|\*\*[\s\S]*?\*\*|<think>[\s\S]*?<\/think>)/g);

  const handleApply = (code: string) => {
    if (onApply) {
      onApply(code);
      setAppliedCode(code);
    }
  };

  return (
    <div className="space-y-3">
      {parts.map((part, i) => {
        if (part.startsWith('<think>')) {
          const thinkContent = part.replace(/<think>/, '').replace(/<\/think>/, '');
          return (
            <div key={i} className="my-4">
              <button
                onClick={() => setThinkExpanded(!thinkExpanded)}
                className="flex items-center gap-2 px-3 py-2 bg-dark/40 border border-border rounded-[8px] hover:bg-dark/60 transition-all w-full"
              >
                <ChevronDown className={`w-3 h-3 text-tertiary/40 transition-transform ${thinkExpanded ? 'rotate-180' : ''}`} />
                <span className="ui-label text-[9px] text-tertiary/30 tracking-[0.2em]">THOUGHT PROCESS</span>
              </button>
              {thinkExpanded && (
                <div className="mt-2 px-4 py-3 bg-dark/20 border border-border rounded-[8px]">
                  <p className="content-text text-[11px] leading-relaxed text-tertiary/50 italic">
                    {thinkContent}
                  </p>
                </div>
              )}
            </div>
          );
        }
        if (part.startsWith('```')) {
          const code = part.replace(/```(\w+)?\n?/, '').replace(/```$/, '');
          const lang = part.match(/```(\w+)/)?.[1] || '';
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
        if (part.startsWith('**')) {
          return <strong key={i} className="text-accent font-black tracking-tight uppercase text-[12px] block mb-1">{part.slice(2, -2)}</strong>;
        }
        return (
          <span key={i} className="content-text leading-relaxed text-tertiary/60 block opacity-90">
            {part.split('\n').map((line, lineIdx) => (
              <React.Fragment key={lineIdx}>
                {line}
                {lineIdx !== part.split('\n').length - 1 && <br />}
              </React.Fragment>
            ))}
          </span>
        );
      })}
    </div>
  );
};

const AIPanel: React.FC<AIPanelProps> = ({
  messages, onSendMessage, onUpdateLastMessage, isProcessing, setProcessing, contextCode, fileTreeSummary, onApplyToSource, onRejectMessage, onCloseMobile, isMobileView, files
}) => {
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showFilePicker, setShowFilePicker] = useState(false);
  const [fileSearch, setFileSearch] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

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
    await generateAIResponseStream(fullPrompt, contextCode, fileTreeSummary, onUpdateLastMessage, historyForContext);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col h-full relative" style={{ backgroundColor: 'var(--bg-panel)' }}>
      {isMobileView && (
        <div className="flex items-center justify-between px-6 h-12 border-b border-border shrink-0 z-30" style={{ backgroundColor: 'var(--bg-panel)' }}>
          <div className="flex items-center gap-3">
            <svg viewBox="0 0 1080 1080" className="w-5 h-5" style={{ fill: 'var(--accent)' }}>
              <path d="M342.53,430.17c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M667.82,553.65c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
              <path d="M476.59,312.97c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M801.89,436.45c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
              <path d="M207.32,548.37c-1.19-3.81-.92-11.44-.53-15.51,2.4-25.28,19.22-44.69,43.2-52.08,16.92-5.3,35.24-3.66,50.95,4.56,12.9,6.83,21.42,18.15,28.08,30.88,28.58,54.62,78.8,89.26,132.69,115.94,14.17,7.01,30.71,14.97,44.01,23.2,8.31,4.4,19.33,10.85,26.88,16.51,37.43,25.76,79.36,64.4,70.45,114.99-7.94,45.05-67.07,65.32-103.03,39.43-16.58-11.71-23.96-30.05-35.58-46.08-8.97-12.14-19.17-23.33-30.43-33.39-22.3-19.96-43.91-32.17-70.53-45.71-5.19-2.64-28.76-13.81-32.28-16.32-5.84-2.42-12.81-6.6-18.42-9.64-48.26-26.17-101.38-67.11-105.46-126.76Z"/>
              <path d="M532.61,671.85c-1.16.32-2.62.71-3.79.31-16.09-5.58-30.93-9.29-47.74-12.16-4.25-.82-20.46-2.49-22.37-3.28-4.95-.04-11.05-.88-16.1-1.24-41.25-3-83.42-5.82-123.28-17.36-43.46-12.58-87.46-34.87-107.11-78.04-1.43-3.14-3.06-9.32-4.9-11.71,4.09,59.65,57.2,100.6,105.46,126.76,5.61,3.04,12.58,7.22,18.42,9.64,3.52,2.51,27.09,13.68,32.28,16.32,26.62,13.54,48.24,25.75,70.53,45.71,11.26,10.06,21.46,21.25,30.43,33.39,11.62,16.03,19.01,34.37,35.58,46.08,35.97,25.9,95.1,5.62,103.03-39.43,8.91-50.58-33.02-89.22-70.45-114.99Z"/>
            </svg>
            <span className="font-black text-[16px] tracking-wide lowercase text-tertiary">cadence</span>
          </div>
          <button onClick={onCloseMobile} className="p-2 transition-colors" style={{ color: 'var(--accent)' }}>
            <PanelRight className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" ref={scrollRef}>
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

      <div className="px-8 py-6 border-t border-border bg-dark/40 backdrop-blur-2xl shrink-0 z-20 pb-28 lg:pb-10 relative">
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
