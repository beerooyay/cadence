import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Home, Search } from 'lucide-react';

interface BrowserProps {
  url: string;
  onUrlChange: (url: string) => void;
}

const Browser: React.FC<BrowserProps> = ({ url, onUrlChange }) => {
  const [inputUrl, setInputUrl] = useState(url);
  const [isLoading, setIsLoading] = useState(false);
  const webviewRef = useRef<HTMLElement>(null);

  useEffect(() => {
    setInputUrl(url);
  }, [url]);

  const handleNavigate = (e: React.FormEvent) => {
    e.preventDefault();
    let finalUrl = inputUrl;
    if (!finalUrl.startsWith('http://') && !finalUrl.startsWith('https://')) {
      if (finalUrl.includes('.') && !finalUrl.includes(' ')) {
        finalUrl = 'https://' + finalUrl;
      } else {
        finalUrl = `https://www.google.com/search?q=${encodeURIComponent(finalUrl)}`;
      }
    }
    onUrlChange(finalUrl);
  };

  const handleBack = () => {
    if (webviewRef.current) {
      (webviewRef.current as any).goBack?.();
    }
  };

  const handleForward = () => {
    if (webviewRef.current) {
      (webviewRef.current as any).goForward?.();
    }
  };

  const handleReload = () => {
    if (webviewRef.current) {
      (webviewRef.current as any).reload?.();
    }
  };

  const handleHome = () => {
    onUrlChange('https://www.google.com');
  };

  return (
    <div className="flex flex-col h-full bg-dark">
      <div className="flex items-center gap-2 px-3 py-2 bg-panel border-b border-border">
        <div className="flex items-center gap-1">
          <button onClick={handleBack} className="p-1.5 rounded hover:bg-white/5 text-tertiary/40 hover:text-tertiary transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <button onClick={handleForward} className="p-1.5 rounded hover:bg-white/5 text-tertiary/40 hover:text-tertiary transition-colors">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={handleReload} className={`p-1.5 rounded hover:bg-white/5 text-tertiary/40 hover:text-tertiary transition-colors ${isLoading ? 'animate-spin' : ''}`}>
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={handleHome} className="p-1.5 rounded hover:bg-white/5 text-tertiary/40 hover:text-tertiary transition-colors">
            <Home className="w-4 h-4" />
          </button>
        </div>
        <form onSubmit={handleNavigate} className="flex-1">
          <div className="flex items-center gap-2 bg-dark border border-border rounded-lg px-3 py-1.5">
            <Search className="w-3.5 h-3.5 text-tertiary/30" />
            <input
              type="text"
              value={inputUrl}
              onChange={e => setInputUrl(e.target.value)}
              placeholder="search or enter url..."
              className="flex-1 bg-transparent text-tertiary text-sm outline-none placeholder:text-tertiary/20"
            />
          </div>
        </form>
      </div>
      <div className="flex-1 relative">
        <webview
          ref={webviewRef as any}
          src={url}
          className="absolute inset-0 w-full h-full"
          onDidStartLoading={() => setIsLoading(true)}
          onDidStopLoading={() => setIsLoading(false)}
        />
      </div>
    </div>
  );
};

export default Browser;
