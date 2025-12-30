
import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronRight, Wand2, Check, RefreshCw, X, RotateCcw } from 'lucide-react';
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
}

const FormattedMessage: React.FC<{ 
    messageId: string, 
    text: string, 
    onApply?: (code: string) => void,
    onReject?: (id: string) => void 
}> = ({ messageId, text, onApply, onReject }) => {
  const [appliedCode, setAppliedCode] = useState<string | null>(null);
  const parts = text.split(/(```[\s\S]*?```|\*\*[\s\S]*?\*\*)/g);

  const handleApply = (code: string) => {
    if (onApply) {
      onApply(code);
      setAppliedCode(code);
    }
  };

  return (
    <div className="space-y-6">
      {parts.map((part, i) => {
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
                        : 'bg-accent text-dark hover:brightness-110 active:scale-[0.98]'}`}
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
          <span key={i} className="content-text leading-relaxed text-tertiary/60 block opacity-90 first-letter:uppercase">
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
  messages, onSendMessage, onUpdateLastMessage, isProcessing, setProcessing, contextCode, fileTreeSummary, onApplyToSource, onRejectMessage, onCloseMobile, isMobileView 
}) => {
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing) return;
    const userMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text: input, timestamp: Date.now() };
    onSendMessage(userMsg);
    setInput('');
    setProcessing(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantMsg: ChatMessage = { id: assistantId, role: 'assistant', text: '', timestamp: Date.now() };
    onSendMessage(assistantMsg);

    await generateAIResponseStream(input, contextCode, fileTreeSummary, onUpdateLastMessage);
    setProcessing(false);
  };

  return (
    <div className="flex flex-col h-full bg-panel relative">
      {isMobileView && (
        <div className="lg:hidden flex items-center justify-between px-8 h-14 border-b border-border bg-panel shrink-0 z-30">
          <div className="nova-brand"><span className="text-white">nova</span> chat</div>
          <button onClick={onCloseMobile} className="p-2 text-tertiary/40 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar scroll-smooth" ref={scrollRef}>
        <div className="min-h-full flex flex-col justify-end max-w-4xl mx-auto px-8 py-16 space-y-16">
          {messages.map((msg, idx) => (
            <div key={msg.id} className="flex flex-col gap-5">
              <div className={`flex items-center gap-4 ${msg.role === 'assistant' ? 'flex-row' : 'flex-row-reverse'}`}>
                <div className={`ui-label text-[9px] tracking-[0.3em] font-black ${msg.role === 'assistant' ? 'text-accent' : 'text-tertiary/20'}`}>
                   {msg.role === 'assistant' ? 'nova kernel' : 'operator'}
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
                        <span className="ui-label text-accent tracking-[0.5em] font-black text-[9px]">SOLVING...</span>
                     </div>
                   )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="px-8 py-8 border-t border-border bg-dark/40 backdrop-blur-2xl shrink-0 z-20 pb-28 lg:pb-10">
        <div className="max-w-4xl mx-auto relative group">
          <textarea 
            className="w-full bg-panel border border-border rounded-base px-6 py-6 content-text font-bold focus:border-accent/30 transition-all min-h-[60px] max-h-60 resize-none pr-20 text-tertiary/90 placeholder:text-tertiary/5 shadow-inner uppercase text-[12px]"
            placeholder="INPUT COMMAND OR QUERY..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button 
            className={`absolute bottom-5 right-5 p-3.5 rounded-base transition-all active-press 
              ${input.trim() ? 'bg-accent text-dark shadow-2xl shadow-accent/20' : 'bg-white/5 text-tertiary/10 cursor-not-allowed'}`} 
            onClick={handleSend} 
            disabled={!input.trim() || isProcessing}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIPanel;
