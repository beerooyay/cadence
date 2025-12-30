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

/**
 * polishpy cli wrapper via spawn
 * executes: python -m polishpy check --stdin
 */
export const polishpyCLI = async (code: string, mode: 'check' | 'fix' = 'check'): Promise<{
  formatted: string;
  issues: string[];
  success: boolean;
}> => {
  try {
    // mock response for now - will be wired to actual cli
    // in production: spawn python process, pipe code via stdin, parse stdout
    const issues: string[] = [];

    // check for obvious missing imports (simple regex scan)
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

    // basic formatting check (trailing spaces)
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
  } catch (error) {
    return {
      formatted: code,
      issues: ['cli execution failed'],
      success: false
    };
  }
};

/**
 * nuextract 2b - structured analysis via local model
 * uses numind/nuextract-2.0-2b or nuextract-tiny-v1.5 from local cache
 * forces json output for ghost suggestions
 */
export const analyzeWithNuExtract = async (code: string, manifest: string = ''): Promise<{
  original: string;
  suggested: string;
  description: string;
} | null> => {
  // mock: in production, this would load nuextract-tiny-v1.5 from huggingface cache
  // and run with forced json schema + zero temperature

  // simulate detection of obvious issues
  const issues: string[] = [];

  const typePattern = /:\s*(List|Dict|Set|Tuple|Optional|Union|Any|Callable|Iterator|Generator|Iterable)/g;
  const returnPattern = /->\s*(List|Dict|Set|Tuple|Optional|Union|Any|Callable|Iterator|Generator|Iterable)/g;

  const found = new Set<string>();
  let match;
  while ((match = typePattern.exec(code)) !== null) found.add(match[1]);
  while ((match = returnPattern.exec(code)) !== null) found.add(match[1]);

  if (found.size > 0) {
    issues.push(`missing typing imports: ${Array.from(found).sort().join(', ')}`);
  }

  const lines = code.split('\n');
  const hasTrailingSpaces = lines.some(l => l !== l.trimEnd());
  if (hasTrailingSpaces) {
    issues.push('trailing spaces');
  }

  if (issues.length === 0) {
    return null;
  }

  // generate suggested fix
  let suggested = code;
  if (found.size > 0) {
    const hasTypingImport = code.includes('from typing import');
    if (!hasTypingImport) {
      const missing = Array.from(found).sort().join(', ');
      suggested = `from typing import ${missing}\n\n${suggested}`;
    }
  }

  if (hasTrailingSpaces) {
    suggested = suggested.split('\n').map(l => l.trimEnd()).join('\n');
  }

  return {
    original: code,
    suggested: suggested,
    description: issues.join(', ')
  };
};

/**
 * qwen3-4b - conversational ai & task execution
 * uses qwen/qwen3-4b-instruct-2507 from local cache
 */
export const generateAIResponseStream = async (
  prompt: string,
  context: string,
  manifest: string,
  onChunk: (text: string) => void
): Promise<string> => {
  // mock stream - in production this would load qwen3-4b from local cache
  // for now, return a helpful response about the pipeline

  const mockResponses = [
    `**qwen3-4b analysis**\n\nbased on the manifest:\n${manifest}\n\ni see active context:\n${context.substring(0, 200)}...\n\nhow can i help polish this code?`,
    `**polishpy integration**\n\ni am running locally from huggingface cache:\n- nuextract-tiny-v1.5 (structured analysis)\n- qwen3-4b-instruct (conversational)\n\nuse polish button for formatting, syntax for diagnostics.`,
    `**nova watch alert**\n\ndetected: missing typing imports in active buffer.\nrun syntax check to see details, or polish to auto-fix.`
  ];

  let fullText = mockResponses[Math.floor(Math.random() * mockResponses.length)];

  // simulate streaming
  for (let i = 0; i <= fullText.length; i += Math.floor(Math.random() * 5) + 1) {
    onChunk(fullText.substring(0, i));
    await new Promise(r => setTimeout(r, 10));
  }

  return fullText;
};

/**
 * execute polishpy cli command directly (for terminal)
 * spawns: python -m polishpy [command] [args]
 */
export const executePolishPyCommand = async (command: string, args: string[] = []): Promise<{
  output: string;
  success: boolean;
}> => {
  // mock implementation - would use child_process.spawn in production
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        output: `executing: python -m polishpy ${command} ${args.join(' ')}\nresult: ok\nmock output`,
        success: true
      });
    }, 100);
  });
};
