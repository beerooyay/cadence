polishpy integration notes

changes made

1. removed app directory
   deleted entire app/ directory
   kept ide/ as foundation

2. service layer updates
   ide/services/polishpyService.ts (new)
   replaced geminiService.ts with polishpyService.ts

   functions:
   - polishpyCLI(code, mode)
     wrapper for python -m polishpy check/fix
     regex-based typing import detection
     returns { formatted, issues, success }

   - analyzeWithNuExtract(code, manifest)
     local model analysis (nuextract 2b / tiny)
     ghost suggestions via json schema
     returns { original, suggested, description } or null

   - generateAIResponseStream(prompt, context, manifest, onChunk)
     qwen3-4b conversational flow
     mock streaming for development

   - executePolishPyCommand(command, args)
     terminal command execution
     returns stdout + success status

3. import updates
   app.tsx: geminiService -> polishpyService
   aipanel.tsx: geminiService -> polishpyService

4. function replacements in app.tsx
   triggerNovaWatch() -> analyzeWithNuExtract()
   onPolish() -> polishpyCLI('fix')
   onSyntaxCheck() -> polishpyCLI('check')

5. package.json update
   removed @google/genai dependency
   kept: react, react-dom, lucide-react

6. index.html update
   removed @google/genai from importmap

7. documentation
   updated readme.md
   added integration_notes.md
   updated metadata.json

architecture
  nova ide
    editor (terminal)
    sidebar (explorer)
    aipanel (chat)

    polishpyCLI (tier 1 - instant)
    nuextract (tier 2 - 2-3s)
    qwen3-4b (tier 3 - conversational)

    huggingface cache
      nuextract-tiny
      qwen3-4b-instruct

tiered pipeline
  tier 1: regex pattern matching, typing imports, trailing spaces
  tier 2: local model inference, json ghost suggestions
  tier 3: conversational ai, chat, explanation

next steps
  1. install transformers (python or js)
  2. load models from ~/.cache/huggingface/hub/
  3. use child_process.spawn in polishpyCLI()
  4. replace mocks with real model calls

verification
  ls -la | grep app
  ls -la ide/services/polishpyService.ts
  grep -r "google" ide/
  cat ide/package.json | grep google

status: ready
all infrastructure in place
next: implement real model loading
