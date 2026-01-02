# cadence

a custom-built ide powered by local ai models trained on polishpy.

---

## what is cadence?

cadence is a lightweight, terminal-native code editor built from scratch with react, electron, and apple silicon optimized language models. it runs entirely local - no cloud apis, no telemetry, no subscriptions.

the cadence model is fine-tuned on polishpy, a python code quality framework that enforces clean, typed, minimal code. this means cadence understands python deeply - not just syntax, but style, structure, and intent.

---

## features

- **local llm** - qwen3-4b running on mlx (apple silicon optimized)
- **tool calling** - read files, write files, execute commands, list directories
- **conversation memory** - remembers context across your session
- **polishpy integration** - automatic type checking, formatting, linting
- **terminal** - full pty terminal with custom prompt
- **file explorer** - browse, create, edit files
- **theming** - dark/light/dawn modes with accent colors

---

## stack

- react 19 + typescript + vite
- electron 39
- tailwindcss 4
- xterm.js
- mlx-lm (apple silicon inference)
- flask (local model server)

---

## models

cadence uses two local models via mlx:

| model        | size | purpose                             |
|--------------|------|-------------------------------------|
| qwen3-4b     | 4bit | chat, code generation, tool calling |
| llama-3.2-3b | 4bit | fallback, lighter tasks             |

models load on demand and auto-unload after 5 minutes of inactivity.

---

## tools

the cadence model has access to:

```text
readfile   - read file contents
writefile  - write to files  
execute    - run shell commands
listdir    - list directory contents
```

---

## polishpy

polishpy is the code quality backbone of cadence. it enforces:

- black formatting
- ruff linting  
- mypy type checking
- import organization
- trailing whitespace removal

cadence was trained to understand and generate polishpy-compliant code.

---

## install

```bash
git clone https://github.com/beerooyay/cadence
cd cadence
npm install
pip install mlx-lm flask flask-cors
npm run electron-dev
```

---

## build

```bash
npm run dist-mac-arm
```

---

## requirements

- macos (apple silicon recommended)
- node 18+
- python 3.10+
- ~8gb ram for model inference

---

## license

mit

---

built by blaize
