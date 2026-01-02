#!/usr/bin/env python3
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from mlx_lm import load, generate
import json
import os
import subprocess
import time
import gc

app = Flask(__name__)
CORS(app)

models = {
    "qwen": "mlx-community/Qwen3-4B-4bit",
    "llama": "mlx-community/Llama-3.2-3B-Instruct-4bit"
}

cache = {}
history = []
active = "qwen"
lastused = {}

def readfile(path):
    try:
        with open(os.path.expanduser(path.strip()), 'r') as f:
            return f.read()[:4000]
    except Exception as e:
        return f"error: {e}"

def writefile(args):
    try:
        parts = args.split('|||')
        path = parts[0].strip()
        content = parts[1] if len(parts) > 1 else ''
        with open(os.path.expanduser(path), 'w') as f:
            f.write(content)
        return f"wrote to {path}"
    except Exception as e:
        return f"error: {e}"

def execute(cmd):
    try:
        result = subprocess.run(
            cmd.strip(), 
            shell=True, 
            capture_output=True, 
            text=True, 
            timeout=30,
            cwd=os.path.expanduser('~')
        )
        output = result.stdout + result.stderr
        if not output.strip():
            if result.returncode == 0:
                output = "[completed successfully]"
            else:
                output = f"[exit code: {result.returncode}]"
        return output.strip()[:2000]
    except subprocess.TimeoutExpired:
        return "error: command timed out after 30s"
    except Exception as e:
        return f"error: {e}"

def listdir(path):
    try:
        items = os.listdir(os.path.expanduser(path.strip()))
        return '\n'.join(items[:50])
    except Exception as e:
        return f"error: {e}"

def webfetch(url):
    try:
        import urllib.request
        import re
        req = urllib.request.Request(url.strip(), headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            html = resp.read().decode('utf-8', errors='ignore')[:8000]
            text = re.sub(r'<script[^>]*>.*?</script>', '', html, flags=re.DOTALL)
            text = re.sub(r'<style[^>]*>.*?</style>', '', text, flags=re.DOTALL)
            text = re.sub(r'<[^>]+>', ' ', text)
            text = re.sub(r'\s+', ' ', text).strip()
            return text[:3000]
    except Exception as e:
        return f"error: {e}"

def websearch(query):
    return f"https://www.google.com/search?q={query.replace(' ', '+')}"

tools = {
    "readfile": readfile,
    "writefile": writefile,
    "execute": execute,
    "listdir": listdir,
    "webfetch": webfetch,
    "websearch": websearch
}

def getmodel(name):
    global cache, lastused
    now = time.time()
    for m in list(cache.keys()):
        if m != name and now - lastused.get(m, now) > 300:
            print(f"unloading {m}")
            del cache[m]
            gc.collect()
    if name not in cache:
        print(f"loading {models[name]}")
        cache[name] = load(models[name])
        print("loaded")
    lastused[name] = now
    return cache[name]

def parsetool(text):
    lines = text.split('\n')
    action = None
    actioninput = None
    cutoff = len(text)
    for i, line in enumerate(lines):
        lower = line.lower()
        if 'action:' in lower and 'action input' not in lower:
            action = line.split(':',1)[1].strip().lower()
        elif 'action input:' in lower:
            actioninput = line.split(':',1)[1].strip()
            if not actioninput and i + 1 < len(lines):
                actioninput = lines[i + 1].strip()
            cutoff = text.lower().find('action input:') + len('action input:') + len(actioninput or '')
            break
    if action and action in tools:
        return action, actioninput, cutoff
    return None, None, len(text)

@app.route('/api/generate', methods=['POST'])
def gen():
    global history, active
    data = request.json
    prompt = data.get('prompt', '')
    system = data.get('system', '')
    usetool = data.get('tools', False)
    maxtok = data.get('max_tokens', 512)
    stream = data.get('stream', False)
    
    try:
        m, t = getmodel(active)
        
        msgs = []
        if system:
            msgs.append({"role": "system", "content": system})
        
        for h in history[-20:]:
            msgs.append({"role": h['role'], "content": h['content']})
        
        if usetool:
            toolprompt = """tools available:
- readfile: read file contents. input: absolute filepath
- writefile: write to file. input: path|||content  
- execute: run shell command. input: command (use python3, absolute paths)
- listdir: list directory. input: absolute path
- webfetch: fetch webpage text. input: full url (https://...)
- websearch: search the web. input: search query

YOU CAN SEARCH THE WEB using webfetch and websearch tools.

format:
action: toolname
action input: input

STOP after action input. system provides observation.
use absolute paths like /Users/...
if error occurs, explain the error and offer to fix it.
CRITICAL: keep <think> blocks under 30 words MAX. be extremely concise. no rambling."""
            msgs.append({"role": "user", "content": f"{toolprompt}\n\nrequest: {prompt}"})
        else:
            msgs.append({"role": "user", "content": prompt})
        
        formatted = t.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        response = generate(m, t, prompt=formatted, max_tokens=maxtok, verbose=False)
        
        if usetool:
            action, actioninput, cutoff = parsetool(response)
            print(f"[tool] parsed: action={action}, input={actioninput}")
            if action and actioninput:
                response = response[:cutoff].strip()
                print(f"[tool] executing {action}({actioninput})")
                toolresult = tools[action](actioninput)
                print(f"[tool] result: {toolresult[:200] if len(toolresult) > 200 else toolresult}")
                
                msgs.append({"role": "assistant", "content": response})
                iserror = 'error' in toolresult.lower() or 'traceback' in toolresult.lower() or 'exception' in toolresult.lower()
                if iserror:
                    msgs.append({"role": "user", "content": f"tool result (ERROR):\n{toolresult}\n\nexplain the error simply. offer a fix. ask if user wants you to fix and retry. lowercase, concise."})
                else:
                    msgs.append({"role": "user", "content": f"tool result:\n{toolresult}\n\nbrief summary. offer next steps if relevant. lowercase, concise."})
                formatted2 = t.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
                final = generate(m, t, prompt=formatted2, max_tokens=400, verbose=False)
                response += f"\n\nobservation: {toolresult}\n\n{final}"
        
        history.append({"role": "user", "content": prompt})
        history.append({"role": "assistant", "content": response})
        if len(history) > 40:
            history = history[-40:]
        
        if stream:
            def streamgen():
                yield json.dumps({"response": response}) + "\n"
            return Response(streamgen(), mimetype='application/json')
        return jsonify({"response": response})
    except Exception as e:
        import traceback
        traceback.print_exc()
        return jsonify({"response": f"error: {e}"})

@app.route('/api/models', methods=['GET'])
def listmodels():
    return jsonify({"models": list(models.keys()), "active": active})

@app.route('/api/models/<name>', methods=['POST'])
def setmodel(name):
    global active
    if name not in models:
        return jsonify({"error": "invalid model"}), 400
    active = name
    getmodel(name)
    return jsonify({"active": active, "model": models[active]})

@app.route('/api/memory', methods=['GET'])
def getmemory():
    return jsonify({"messages": history})

@app.route('/api/memory', methods=['DELETE'])
def clearmemory():
    global history
    history = []
    return jsonify({"status": "cleared"})

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok", "model": models.get(active, "none"), "active": active})

if __name__ == '__main__':
    getmodel(active)
    app.run(host='127.0.0.1', port=11435, threaded=True)
