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
        result = subprocess.run(cmd.strip(), shell=True, capture_output=True, text=True, timeout=30)
        output = result.stdout + result.stderr
        return output[:2000] if output else "executed"
    except Exception as e:
        return f"error: {e}"

def listdir(path):
    try:
        items = os.listdir(os.path.expanduser(path.strip()))
        return '\n'.join(items[:50])
    except Exception as e:
        return f"error: {e}"

tools = {
    "readfile": readfile,
    "writefile": writefile,
    "execute": execute,
    "listdir": listdir
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
    lines = text.lower().split('\n')
    action = None
    actioninput = None
    for i, line in enumerate(lines):
        if 'action:' in line and 'action input' not in line:
            action = line.split('action:')[1].strip()
        elif 'action input:' in line:
            actioninput = line.split('action input:')[1].strip()
            if not actioninput and i + 1 < len(lines):
                actioninput = lines[i + 1].strip()
    if action and action in tools:
        return action, actioninput
    return None, None

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
            toolprompt = """you have these tools:
- readfile: read a file. input: path
- writefile: write to file. input: path|||content
- execute: run shell command. input: command
- listdir: list directory. input: path

to use a tool, respond with:
action: toolname
action input: the input

after seeing the result, give your final answer."""
            msgs.append({"role": "user", "content": f"{toolprompt}\n\nuser request: {prompt}"})
        else:
            msgs.append({"role": "user", "content": prompt})
        
        formatted = t.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
        response = generate(m, t, prompt=formatted, max_tokens=maxtok, verbose=False)
        
        if usetool:
            action, actioninput = parsetool(response)
            if action and actioninput:
                toolresult = tools[action](actioninput)
                response += f"\n\nobservation: {toolresult}"
                
                msgs.append({"role": "assistant", "content": response})
                msgs.append({"role": "user", "content": f"observation: {toolresult}\n\nnow give your final answer."})
                formatted2 = t.apply_chat_template(msgs, add_generation_prompt=True, tokenize=False)
                final = generate(m, t, prompt=formatted2, max_tokens=maxtok, verbose=False)
                response += f"\n\n{final}"
        
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
