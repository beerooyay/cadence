nova ide - polishpy integration

terminal-native ide with local ai model integration for python code quality

architecture
  stack
    react 18 + typescript + vite
    lucide react icons
    local ai models: nuextract 2b, qwen3 4b
    python quality: polishpy cli (black, ruff, mypy)

  tiered processing
    tier 1: polishpy cli (instant, regex)
    tier 2: nuextract 2b (2-3s, json ghost suggestions)
    tier 3: qwen3 4b (conversational, chat)

services
  polishpyService.ts
    polishpyCLI(code, mode)
      wraps polishpy cli
      returns { formatted, issues, success }

    analyzeWithNuExtract(code, manifest)
      local model analysis
      returns ghost suggestion or null

    generateAIResponseStream(prompt, context, manifest, onChunk)
      qwen3-4b stream
      ready for local model

    executePolishPyCommand(command, args)
      terminal execution

usage
  installation
    cd ide
    npm install
    npm run dev

  terminal commands
    polishpy init
    polishpy check <file>
    polishpy auto
    clear

  ui actions
    polish button (auto-fix)
    syntax button (diagnostic)
    ghost dock (accept suggestions)
    chat (conversational ai)

model integration
  cache location
    ~/.cache/huggingface/hub/

  expected models
    numind/nuextract-tiny-v1.5
    qwen/qwen3-4b-instruct-2507

  loading strategy
    models load on-demand
    zero-temperature inference
    json schema enforcement

project structure
  ide/
    app.tsx                 # state management
    types.ts                # interfaces
    constants.tsx           # initial filesystem
    services/
      polishpyService.ts    # local model hooks
    components/
      editor.tsx            # code + terminal
      aipanel.tsx           # chat
      sidebar.tsx           # file explorer
      statusbar.tsx         # indicators

polishpy backend
  cli: python -m polishpy [command]
    format
    lint
    typecheck
    check
    auto
    nova (watch mode)
    init

status
  all infrastructure in place
  mocks ready for local model wiring
