/**
 * generates a high-fidelity project manifest for the ai
 */
export const generateProjectManifest = (files: Record<string, any>) => {
  return Object.values(files)
    .map(f => {
      const info = `${f.type === 'folder' ? '[DIR]' : '[FILE]'} ${f.name}`;
      if (f.name.endsWith('.toml') || f.name.endsWith('.json') || f.name === 'README.md') {
        return `${info}\n--- CONTENT ---\n${f.content}\n---------------`;
      }
      return info;
    })
    .join('\n');
};

export const polishpyCLI = (code: string, mode: 'check' | 'fix' = 'check'): {
  formatted: string;
  issues: string[];
  success: boolean;
} => {
  const issues: string[] = [];

  const typePattern = /:\s*(List|Dict|Set|Tuple|Optional|Union|Any|Callable|Iterator|Generator|Iterable)/g;
  const returnPattern = /->\s*(List|Dict|Set|Tuple|Optional|Union|Any|Callable|Iterator|Generator|Iterable)/g;

  const found = new Set<string>();
  let match;
  while ((match = typePattern.exec(code)) !== null) found.add(match[1]);
  while ((match = returnPattern.exec(code)) !== null) found.add(match[1]);

  if (found.size > 0 && mode === 'fix') {
    const hasTypingImport = code.includes('from typing import');
    if (!hasTypingImport) {
      const missing = Array.from(found).sort().join(', ');
      const formatted = `from typing import ${missing}\n\n${code}`;
      return { formatted, issues: [`added typing imports: ${missing}`], success: true };
    }
  }

  if (found.size > 0) {
    issues.push(`missing typing imports: ${Array.from(found).sort().join(', ')}`);
  }

  const lines = code.split('\n');
  const formatted = lines.map(l => l.trimEnd()).join('\n');
  const hasTrailingSpaces = lines.some(l => l !== l.trimEnd());
  if (hasTrailingSpaces && mode === 'fix') {
    return { formatted, issues: issues.length > 0 ? issues : ['fixed trailing spaces'], success: true };
  }
  if (hasTrailingSpaces) {
    issues.push('trailing spaces found');
  }

  return {
    formatted: code,
    issues: issues.length > 0 ? issues : [],
    success: issues.length === 0
  };
};

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const buildConversationContext = (
  history: Message[],
  context: string,
  manifest: string,
  maxTokens: number = 8000
): Message[] => {
  const systemMsg: Message = {
    role: 'system',
    content: `you are cadence, a coding assistant. your name is cadence.

project structure:
${manifest.slice(0, 2000)}

current file:
${context.slice(0, 4000)}

rules:
- no emojis, lowercase only
- wrap code in triple backtick python or typescript blocks
- be concise but thorough
- remember our full conversation history
- if using <think></think>, keep thoughts under 100 words`
  };

  const estimateTokens = (msgs: Message[]) => 
    msgs.reduce((sum, m) => sum + Math.ceil(m.content.length / 4), 0);

  const messages: Message[] = [systemMsg];
  let tokenCount = estimateTokens(messages);

  const recentHistory = [...history].slice(-50);
  
  for (const msg of recentHistory) {
    const msgTokens = Math.ceil(msg.content.length / 4);
    if (tokenCount + msgTokens > maxTokens) {
      const summaryMsg: Message = {
        role: 'system',
        content: '[earlier conversation truncated for context length]'
      };
      messages.splice(1, 0, summaryMsg);
      break;
    }
    messages.push(msg);
    tokenCount += msgTokens;
  }

  return messages;
};

/**
 * local llm for chat with full conversation memory
 * tries mlx server first, then ollama
 */
export const generateAIResponseStream = async (
  prompt: string,
  context: string,
  manifest: string,
  onChunk: (text: string) => void,
  conversationHistory: { role: 'user' | 'assistant'; text: string }[] = []
): Promise<string> => {
  const history: Message[] = conversationHistory.map(m => ({
    role: m.role,
    content: m.text
  }));

  history.push({ role: 'user', content: prompt });

  const messages = buildConversationContext(history, context, manifest);

  const formattedPrompt = messages
    .map(m => {
      if (m.role === 'system') return `[SYSTEM]\n${m.content}\n`;
      if (m.role === 'user') return `[USER]\n${m.content}\n`;
      return `[ASSISTANT]\n${m.content}\n`;
    })
    .join('\n');

  const endpoints = [
    'http://localhost:11435/api/generate',
    'http://localhost:11434/api/generate'
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: formattedPrompt,
          stream: true,
          max_tokens: 1024,
          tools: true
        })
      });

      if (!response.ok) continue;

      const reader = response.body?.getReader();
      if (!reader) continue;

      let fullText = '';
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(l => l.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.response) {
              fullText += json.response;
              onChunk(fullText);
            }
          } catch {}
        }
      }

      return fullText;
    } catch {
      continue;
    }
  }

  const fallback = `**local model unavailable**\n\nstart mlx server or ollama\n\nyour prompt: ${prompt}`;
  onChunk(fallback);
  return fallback;
};
