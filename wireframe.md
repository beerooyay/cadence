wireframe summary

done
  - deleted app/ directory
  - removed google dependencies
  - created polishpyService.ts
  - wired app.tsx to new service
  - wired aipanel.tsx to new service

new service: ide/services/polishpyService.ts
  polishpyCLI(code, mode)
    cli wrapper for black/ruff/mypy
    returns { formatted, issues, success }

  analyzeWithNuExtract(code, manifest)
    nuextract 2b ghost suggestions
    returns json or null

  generateAIResponseStream(prompt, context, manifest, onChunk)
    qwen3-4b chat
    returns stream

wiring complete
  app.tsx
    triggerNovaWatch() -> analyzeWithNuExtract()
    onPolish() -> polishpyCLI('fix')
    onSyntaxCheck() -> polishpyCLI('check')

  aipanel.tsx
    uses generateAIResponseStream()

models ready in cache
  ~/.cache/huggingface/hub/
    numind/NuExtract-2.0-2B
    numind/NuExtract-tiny-v1.5
    Qwen/Qwen3-4B-Instruct-2507

status
  mocks in place
  no api dependencies
  ready for real model loading
