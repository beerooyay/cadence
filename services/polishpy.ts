declare global {
  interface Window {
    polishpy?: {
      check: (filePath: string) => Promise<CmdResult>;
      format: (filePath: string) => Promise<CmdResult>;
      auto: (filePath: string) => Promise<CmdResult>;
      syntax: (filePath: string) => Promise<CmdResult>;
      semantic: (filePath: string) => Promise<CmdResult>;
      transform: (filePath: string, preview?: boolean) => Promise<CmdResult>;
      intent: (filePath: string) => Promise<CmdResult>;
      concept: (intent: string) => Promise<CmdResult>;
    };
    python?: {
      run: (filePath: string) => Promise<CmdResult>;
      runCode: (code: string) => Promise<CmdResult>;
    };
  }
}

interface CmdResult {
  success: boolean;
  output: string;
  error: string;
}

const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.polishpy;
};

export const polishpyCheck = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.check(filePath);
};

export const polishpyFormat = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.format(filePath);
};

export const polishpyAuto = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.auto(filePath);
};

export const polishpySyntax = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.syntax(filePath);
};

export const pythonRun = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron() || !window.python) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.python.run(filePath);
};

export const pythonRunCode = async (code: string): Promise<CmdResult> => {
  if (!isElectron() || !window.python) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.python.runCode(code);
};

export const polishpySemantic = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.semantic(filePath);
};

export const polishpyTransform = async (filePath: string, preview = false): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.transform(filePath, preview);
};

export const polishpyIntent = async (filePath: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.intent(filePath);
};

export const polishpyConcept = async (intent: string): Promise<CmdResult> => {
  if (!isElectron()) {
    return { success: false, output: '', error: 'not in electron' };
  }
  return window.polishpy!.concept(intent);
};
