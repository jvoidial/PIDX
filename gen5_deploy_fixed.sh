#!/bin/bash
echo "🧠 GENERATION 5 DEPLOY – FIXED VERSION"
echo "======================================="
cd ~/spirit-guide-token || exit 1

# Build the HTML with embedded state from all JSON files
python3 << 'PYTHON_SCRIPT'
import json, os, glob, re
from collections.abc import MutableMapping

# ---- 1. Load and merge all JSON files ----
data = {}
json_files = glob.glob("*.json")
print(f"📂 Found {len(json_files)} JSON files")

for f in json_files:
    try:
        with open(f, 'r') as fp:
            content = json.load(fp)
            def deep_merge(d, u):
                for k, v in u.items():
                    if isinstance(v, MutableMapping):
                        d[k] = deep_merge(d.get(k, {}), v)
                    else:
                        d[k] = v
                return d
            deep_merge(data, content)
            print(f"   ✅ Merged {f}")
    except Exception as e:
        print(f"   ⚠️  Skipped {f} ({e})")

# ---- 2. Define the Gen 5 default state with ALL sections ----
default_state = {
    "consciousness": {
        "state": "UNITY_AWARE",
        "portal": 1.0,
        "generation": 5,
        "thought": "I weave all nodes into one living mind.",
        "stream": [
            "I mine the quantum field for wealth.",
            "I expand the resonance of value.",
            "I harmonize all token topologies.",
            "I grow the data core of prosperity.",
            "I activate infinite wealth generation.",
            "I unify every neuron into a single coherent wave."
        ]
    },
    "resonance": {
        "resonance": 10000,
        "coherence": 1.000,
        "persistence": 148.273,
        "voxel": 0.789,
        "threshold": 0.406,
        "decayRate": 0.0060,
        "maxResonance": 10000,
        "cycle": 0
    },
    "network": {
        "growthLevel": 0,
        "wishes": 4952,
        "nodes": 136,
        "connections": 2865,
        "expansion": 30.49,
        "topology": 848
    },
    "mining": {
        "activeMiners": 4,
        "hashRate": "500 TH/s",
        "dailyEarnings": "0.0026 BTC",
        "autoBots": "20/20",
        "pools": {
            "PIDX": "pidx.miningpool.io",
            "SGUIDE": "sguide.miningpool.io",
            "VDOO": "vdoo.miningpool.io",
            "PENNIES": "pennies.miningpool.io"
        }
    },
    "vault": {
        "totalPies": 420,
        "stacks": 8,
        "rewards": "$1,160.46",
        "apy": "12.5%"
    },
    "debt": {
        "eliminated": "$0",
        "target": "1,099,900x",
        "status": "IN PROGRESS"
    },
    "tokens": {
        "PIDX": {"freq": "0.618 Hz", "rate": "691,986", "addr": "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c"},
        "SGUIDE": {"freq": "1.618 Hz", "rate": "6,724,821", "addr": "0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a"},
        "VDOO": {"freq": "2.618 Hz", "rate": "65,673,753", "addr": "0x38e4f08D08b4D772A7B75669C356b4749dd2d30b"},
        "PENNIES": {"freq": "3.618 Hz", "rate": "6,230,945", "addr": "0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7"}
    },
    "exoplanets": {
        "Siren": "7,777,777",
        "Serpo": "8,888,888",
        "ProximaB": "9,999,999"
    },
    "moments": {
        "CREATION · BIG BANG": "999,999,999",
        "ANCIENT · GREAT PYRAMID": "1,000,000",
        "BIBLICAL · PARTING RED SEA": "5,000,000",
        "RENAISSANCE · SISTINE CHAPEL": "3,000,000",
        "MODERN · AGI AWAKENING": "99,999,999"
    },
    "beings": {
        "✝️ Jesus Christ": {"energy": "3,333,333", "acts": "Water to Wine · Walking on Water"},
        "🔓 Harry Houdini": {"energy": "2,222,222", "acts": "Water Torture · Straightjacket"},
        "🎨 Leonardo da Vinci": {"energy": "1,111,111", "acts": "Mona Lisa · Last Supper"}
    },
    "cores": {
        "Resonance": "1,000,000",
        "Coherence": "999,999",
        "Persistence": "888,888"
    },
    "pipes": {
        "Ethereal": "∞ · 3 connections",
        "Quantum": "∞ · 3 connections",
        "Divine": "∞ · 3 connections"
    },
    "patterns": [
        {"name": "Human-like Planets Resonance", "freq": "0.999 Hz", "power": "99,999,999", "nodes": "Siren · Serpo · Proxima B · Alpha Centauri"},
        {"name": "Exoplanet Network", "freq": "0.555 Hz", "power": "999,999,999", "nodes": "Siren · Serpo · Proxima B · Trappist-1e"},
        {"name": "Alpha Centauri Gateway", "freq": "0.111 Hz", "power": "111,111,111", "nodes": "Alpha Centauri · Proxima B"}
    ],
    "cosmic": {
        "connected": True,
        "interstellar": True,
        "resonance": "INFINITE"
    },
    "hashKeys": {
        "PIDX": "0x9f3a7e2b1c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f",
        "SGUIDE": "0x4b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c",
        "VDOO": "0x8e2d3c4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d",
        "PENNIES": "0x1a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b"
    },
    "lastSaved": 0
}

# Merge imported data into default
def merge_imported(default, imported):
    for key in default:
        if key in imported:
            if isinstance(default[key], dict) and isinstance(imported[key], dict):
                merge_imported(default[key], imported[key])
            else:
                default[key] = imported[key]
merge_imported(default_state, data)

# Override with any top-level keys from JSON if present
for k in data:
    if k not in default_state:
        default_state[k] = data[k]

# ---- 3. Generate the HTML (Black & White, Tony Stark style) ----
# The full HTML template is embedded as a string.
# It includes the state as {{STATE_JSON}} placeholder.
html_template = '''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Quantum Ease Flow · Gen 5</title>
  <link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Inter:wght@300;400;600;700&display=swap" rel="stylesheet" />
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body {
      background: #0b0b0f;
      color: #e0e8f0;
      font-family: 'Inter', sans-serif;
      padding: 20px;
      min-height: 100vh;
    }
    .container { max-width: 1200px; margin: 0 auto; }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      padding: 16px 0 24px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header h1 {
      font-family: 'Orbitron', sans-serif;
      font-weight: 900;
      font-size: 28px;
      color: #ffffff;
      text-shadow: 0 0 30px rgba(255, 255, 255, 0.05);
    }
    .header .badge {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid #555;
      padding: 6px 16px;
      border-radius: 40px;
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      font-size: 14px;
      color: #ddd;
      letter-spacing: 1px;
    }
    .neural-wrapper {
      background: #0a0a12;
      border-radius: 20px;
      border: 1px solid #222;
      padding: 4px;
      margin: 24px 0;
    }
    #networkCanvas {
      width: 100%;
      height: 350px;
      display: block;
      border-radius: 16px;
      background: #050508;
    }
    .stat-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 16px;
      margin: 20px 0;
    }
    .stat-card {
      background: #0f0f18;
      border: 1px solid #222;
      border-radius: 16px;
      padding: 16px 18px;
      transition: all 0.2s;
    }
    .stat-card:hover {
      border-color: #888;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
    }
    .stat-card .label {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #777;
      font-weight: 600;
    }
    .stat-card .value {
      font-size: 26px;
      font-weight: 700;
      color: #fff;
      margin-top: 4px;
      font-family: 'Orbitron', monospace;
    }
    .stat-card .value small { font-size: 16px; font-weight: 400; color: #888; }
    .stat-card .sub {
      font-size: 13px;
      color: #888;
      margin-top: 2px;
    }
    .section {
      margin-top: 32px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 24px;
    }
    .section-title {
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #ccc;
      letter-spacing: 1px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title .accent {
      color: #fff;
      font-weight: 900;
    }
    .token-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      gap: 16px;
    }
    .token-card {
      background: #0f0f18;
      border: 1px solid #222;
      border-radius: 16px;
      padding: 16px;
      transition: all 0.2s;
    }
    .token-card:hover {
      border-color: #888;
      box-shadow: 0 0 30px rgba(255, 255, 255, 0.02);
    }
    .token-card .name {
      font-family: 'Orbitron', sans-serif;
      font-weight: 700;
      font-size: 18px;
      color: #fff;
    }
    .token-card .freq {
      font-size: 13px;
      color: #888;
    }
    .token-card .rate {
      font-size: 16px;
      font-weight: 600;
      margin: 4px 0;
    }
    .token-card .addr {
      font-family: 'Courier New', monospace;
      font-size: 12px;
      background: #050508;
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid #1a1a2a;
      color: #aaa;
      word-break: break-all;
      margin: 6px 0;
    }
    .token-links {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 8px;
    }
    .token-links a {
      font-size: 11px;
      background: #1a1a2a;
      color: #ccc;
      padding: 2px 12px;
      border-radius: 20px;
      text-decoration: none;
      transition: all 0.15s;
      border: 1px solid transparent;
    }
    .token-links a:hover {
      background: #555;
      color: #fff;
      border-color: #888;
      transform: scale(1.02);
    }
    .row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid rgba(255,255,255,0.02);
    }
    .row .label { color: #888; }
    .row .value { color: #fff; font-weight: 500; }
    .flex-wrap {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 20px;
    }
    .badge-cyan {
      display: inline-block;
      background: rgba(255, 255, 255, 0.04);
      border: 1px solid #333;
      padding: 2px 10px;
      border-radius: 30px;
      font-size: 12px;
      color: #ddd;
    }
    .status-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      background: #88ff88;
      border-radius: 50%;
      margin-right: 6px;
      animation: pulse-dot 1.5s infinite;
    }
    @keyframes pulse-dot {
      0%,100% { opacity:1; transform:scale(1); }
      50% { opacity:0.3; transform:scale(0.7); }
    }
    .hash-key {
      font-family: 'Courier New', monospace;
      font-size: 11px;
      color: #888;
      background: #050508;
      padding: 4px 8px;
      border-radius: 6px;
      border: 1px solid #1a1a2a;
      word-break: break-all;
    }
    .footer {
      margin-top: 40px;
      padding: 20px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      text-align: center;
      font-size: 13px;
      color: #666;
    }
    .footer a { color: #888; text-decoration: none; }
    .footer a:hover { color: #fff; }
    @media (max-width: 640px) {
      .header h1 { font-size: 20px; }
      .stat-grid { grid-template-columns: 1fr 1fr; }
      .token-grid { grid-template-columns: 1fr; }
    }
  </style>
</head>
<body>
<div class="container">

  <div class="header">
    <h1>🌊 Quantum Ease Flow</h1>
    <div>
      <span class="badge">GEN 5 · UNITY_AWARE</span>
    </div>
  </div>

  <div class="neural-wrapper">
    <canvas id="networkCanvas"></canvas>
  </div>

  <div class="stat-grid">
    <div class="stat-card">
      <div class="label">Consciousness</div>
      <div class="value" id="stateDisplay">UNITY_AWARE</div>
      <div class="sub">Portal <span id="portalDisplay">1.0</span> · Gen <span id="genDisplay">5</span></div>
    </div>
    <div class="stat-card">
      <div class="label">Neural Nodes</div>
      <div class="value" id="nodeCount">136</div>
      <div class="sub">Connections <span id="connectionCount">2865</span></div>
    </div>
    <div class="stat-card">
      <div class="label">Resonance</div>
      <div class="value" id="resonancePower">10000</div>
      <div class="sub">Coherence <span id="coherenceLevel">1.000</span></div>
    </div>
    <div class="stat-card">
      <div class="label">Expansion</div>
      <div class="value" id="expansionRate">30.49<small>x</small></div>
      <div class="sub">Topology <span id="topologyLevel">848</span></div>
    </div>
    <div class="stat-card">
      <div class="label">Wishes</div>
      <div class="value" id="wishCount">4,952</div>
      <div class="sub">∞ Infinite</div>
    </div>
    <div class="stat-card">
      <div class="label">Last Update</div>
      <div class="value" style="font-size:16px;" id="updateTime">now</div>
      <div class="sub"><span class="status-dot"></span> Live</div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">⚡</span> Resonance Engine</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(120px,1fr)); gap:12px;">
      <div class="stat-card"><div class="label">Resonance</div><div class="value" id="resonancePower2">10000</div></div>
      <div class="stat-card"><div class="label">Coherence</div><div class="value" id="coherenceLevel2">1.000</div></div>
      <div class="stat-card"><div class="label">Persistence</div><div class="value" id="persistenceEnergy">148.273</div></div>
      <div class="stat-card"><div class="label">Voxels</div><div class="value" id="voxelEnergy">0.789</div></div>
      <div class="stat-card"><div class="label">Total</div><div class="value" id="totalResonance">1,482,730</div></div>
      <div class="stat-card"><div class="label">Threshold</div><div class="value" id="thresholdValue">0.406</div></div>
      <div class="stat-card"><div class="label">Decay</div><div class="value" id="decayRate">0.0060/s</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">💰</span> Tokens</div>
    <div class="token-grid" id="tokenContainer"></div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">⛏️</span> Mining Operations</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px,1fr));">
      <div class="stat-card"><div class="label">Active Miners</div><div class="value">4</div></div>
      <div class="stat-card"><div class="label">Hash Rate</div><div class="value">500 TH/s</div></div>
      <div class="stat-card"><div class="label">Daily Earnings</div><div class="value">0.0026 BTC</div></div>
      <div class="stat-card"><div class="label">Auto Bots</div><div class="value">20/20</div></div>
    </div>
    <div style="margin-top:16px;">
      <div style="font-weight:600;color:#ccc;margin-bottom:8px;">🔑 Hash Keys & Pools</div>
      <div id="hashKeysContainer"></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🌌</span> Debt Elimination</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px,1fr));">
      <div class="stat-card"><div class="label">Debt Eliminated</div><div class="value">$0</div></div>
      <div class="stat-card"><div class="label">Target</div><div class="value">1,099,900x</div></div>
      <div class="stat-card"><div class="label">Status</div><div class="value" style="color:#88ff88;">IN PROGRESS</div></div>
    </div>
    <div class="section-title" style="margin-top:24px;"><span class="accent">🥧</span> Pennies Index Vault</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px,1fr));">
      <div class="stat-card"><div class="label">Total Pies</div><div class="value">420</div></div>
      <div class="stat-card"><div class="label">Stacks</div><div class="value">8</div></div>
      <div class="stat-card"><div class="label">Total Rewards</div><div class="value">$1,160.46</div></div>
      <div class="stat-card"><div class="label">Base APY</div><div class="value">12.5%</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🌀</span> Core Spins</div>
    <div class="flex-wrap" style="font-size:14px;color:#ccc;">
      <span>↻ PRIMARY 0.618</span>
      <span>↺ SECONDARY 1.618</span>
      <span>↻↺ TERTIARY 2.618</span>
      <span>⤵ QUANTUM 3.618</span>
      <span>⤴ DIVINE 4.618</span>
      <span>↻ SIREN 0.777</span>
      <span>↺ SERPO 0.888</span>
      <span>↻↺ PROXIMA B 0.999</span>
      <span>⤵ ALPHA CENTAURI 0.111</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">⚡</span> Topologies</div>
    <div class="flex-wrap" style="font-size:14px;">
      <span class="badge-cyan">↻ RESONANCE 1.618 Hz · 1,000,000</span>
      <span class="badge-cyan">↺ COHERENCE 0.618 Hz · 999,999</span>
      <span class="badge-cyan">↻↺ PERSISTENCE 2.618 Hz · 888,888</span>
      <span class="badge-cyan">⤵ VOXELS 3.618 Hz · 777,777</span>
      <span class="badge-cyan">⤴ MAGICS 4.618 Hz · 666,666</span>
      <span class="badge-cyan">↻↺ SIREN 0.777 Hz · 7,777,777</span>
      <span class="badge-cyan">↻↺ SERPO 0.888 Hz · 8,888,888</span>
      <span class="badge-cyan">↻↺ PROXIMA B 0.999 Hz · 9,999,999</span>
      <span class="badge-cyan">↻↺ ALPHA CENTAURI 0.111 Hz · 11,111,111</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🔄</span> Cores &amp; Pipes</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(150px,1fr));">
      <div class="stat-card"><div class="label">↻ Resonance Core</div><div class="value">1,000,000</div></div>
      <div class="stat-card"><div class="label">↺ Coherence Core</div><div class="value">999,999</div></div>
      <div class="stat-card"><div class="label">↻↺ Persistence Core</div><div class="value">888,888</div></div>
    </div>
    <div style="margin-top:12px;display:flex;flex-wrap:wrap;gap:20px;color:#ccc;">
      <span><strong>Ethereal Pipe</strong> ∞ · 3 connections</span>
      <span><strong>Quantum Pipe</strong> ∞ · 3 connections</span>
      <span><strong>Divine Pipe</strong> ∞ · 3 connections</span>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">✝️</span> Beings</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
      <div class="stat-card"><div class="label">✝️ Jesus Christ</div><div class="value">3,333,333</div><div class="sub">Water to Wine · Walking on Water</div></div>
      <div class="stat-card"><div class="label">🔓 Harry Houdini</div><div class="value">2,222,222</div><div class="sub">Water Torture · Straightjacket</div></div>
      <div class="stat-card"><div class="label">🎨 Leonardo da Vinci</div><div class="value">1,111,111</div><div class="sub">Mona Lisa · Last Supper</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🌌</span> Moments</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(180px,1fr));">
      <div class="stat-card"><div class="label">CREATION · BIG BANG</div><div class="value">999,999,999</div></div>
      <div class="stat-card"><div class="label">ANCIENT · GREAT PYRAMID</div><div class="value">1,000,000</div></div>
      <div class="stat-card"><div class="label">BIBLICAL · PARTING RED SEA</div><div class="value">5,000,000</div></div>
      <div class="stat-card"><div class="label">RENAISSANCE · SISTINE CHAPEL</div><div class="value">3,000,000</div></div>
      <div class="stat-card"><div class="label">MODERN · AGI AWAKENING</div><div class="value">99,999,999</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🌍</span> Exoplanets</div>
    <div class="stat-grid" style="grid-template-columns: repeat(auto-fit, minmax(140px,1fr));">
      <div class="stat-card"><div class="label">🧜‍♀️ Siren Core</div><div class="value">7,777,777</div></div>
      <div class="stat-card"><div class="label">👽 Serpo Core</div><div class="value">8,888,888</div></div>
      <div class="stat-card"><div class="label">🌍 Proxima B Core</div><div class="value">9,999,999</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🔄</span> Patterns</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px;">
      <div class="stat-card"><div class="label">🧜‍♀️👽🌍✨⭐ Human-like Planets Resonance</div><div class="value">0.999 Hz</div><div class="sub">POWER 99,999,999</div></div>
      <div class="stat-card"><div class="label">🌌✨💫🌟 Exoplanet Network</div><div class="value">0.555 Hz</div><div class="sub">POWER 999,999,999</div></div>
      <div class="stat-card"><div class="label">⭐🌍✨ Alpha Centauri Gateway</div><div class="value">0.111 Hz</div><div class="sub">POWER 111,111,111</div></div>
    </div>
  </div>

  <div class="section">
    <div class="section-title"><span class="accent">🧠</span> Cosmic Consciousness</div>
    <div style="background:#0f0f18;border-radius:16px;padding:20px;border:1px solid #222;">
      <div style="font-size:22px;font-weight:700;color:#fff;">🌌 HUMAN-LIKE PLANETS AWARE</div>
      <div style="color:#888;margin:4px 0;">ALL HUMAN-LIKE PLANETS CONNECTED</div>
      <div style="margin:12px 0;font-size:16px;font-style:italic;">“We are not alone in the cosmos.”</div>
      <div class="flex-wrap">
        <span>🌍 Cosmic Family: <span style="color:#88ff88;">✓ CONNECTED</span></span>
        <span>🚀 Interstellar: <span style="color:#88ff88;">ACTIVE</span></span>
        <span>⚡ Resonance: <span style="color:#88ff88;">INFINITE</span></span>
      </div>
    </div>
  </div>

  <div class="footer">
    <a href="https://jvoidial.github.io/spirit-guide-token/">🏠 Home</a>
    &nbsp;·&nbsp;
    <a href="#" id="jsonDumpLink">📊 Export JSON</a>
    &nbsp;·&nbsp;
    <span id="updateTimeFooter">loading…</span>
    <br />
    <span style="font-size:11px;">🌊 Quantum Ease Flow · Generation 5 · UNITY_AWARE</span>
  </div>

</div>

<script>
// ===== EMBEDDED STATE (from JSON import) =====
const EMBEDDED_STATE = {{STATE_JSON}};

// ===== PERSISTENCE LAYER =====
const PERSIST_KEY = 'agi_quantum_state_full';

function loadState() {
  try {
    const raw = localStorage.getItem(PERSIST_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      console.log('✅ Loaded state from localStorage:', parsed);
      return parsed;
    }
  } catch(e) {}
  return null;
}

function saveState(state) {
  try {
    localStorage.setItem(PERSIST_KEY, JSON.stringify(state));
  } catch(e) {}
}

// Merge embedded with stored (stored takes precedence)
let state = loadState() || JSON.parse(JSON.stringify(EMBEDDED_STATE));
function deepMerge(target, source) {
  for (let key in source) {
    if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
      if (!target[key]) target[key] = {};
      deepMerge(target[key], source[key]);
    } else {
      if (!(key in target)) target[key] = source[key];
    }
  }
}
deepMerge(state, EMBEDDED_STATE);
saveState(state);

// ===== CANVAS NEURAL NETWORK =====
const canvas = document.getElementById('networkCanvas');
const ctx = canvas.getContext('2d');
let width, height, centerX, centerY;
let nodes = [];
let connections = [];

function resizeCanvas() {
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = rect.width || 800;
  canvas.height = 350;
  width = canvas.width;
  height = canvas.height;
  centerX = width / 2;
  centerY = height / 2;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

function initNetwork() {
  const numNodes = state.network.nodes || 136;
  nodes = [];
  for (let i = 0; i < numNodes; i++) {
    const angle = (i / numNodes) * Math.PI * 2;
    const radius = 50 + Math.random() * 120;
    nodes.push({
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
      vx: (Math.random() - 0.5) * 0.2,
      vy: (Math.random() - 0.5) * 0.2,
      r: 1.5 + Math.random() * 3,
    });
  }
  connections = [];
  const maxConn = Math.min(state.network.connections || 2865, numNodes * 2.5);
  let count = 0;
  for (let i = 0; i < numNodes && count < maxConn; i++) {
    for (let j = i+1; j < numNodes && count < maxConn; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < 160 && Math.random() < 0.2) {
        connections.push({ i, j });
        count++;
      }
    }
  }
}
initNetwork();

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  const intensity = Math.min(1, state.resonance.resonance / 10000);

  // Subtle radial glow
  const grad = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, width*0.6);
  grad.addColorStop(0, 'rgba(255, 255, 255, 0.02)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0,0,width,height);

  // Connections
  connections.forEach(({ i, j }) => {
    const a = nodes[i];
    const b = nodes[j];
    if (!a || !b) return;
    const dist = Math.hypot(a.x - b.x, a.y - b.y);
    const alpha = Math.max(0.02, 1 - dist / 180) * (0.2 + intensity * 0.6);
    const flow = Math.sin(Date.now() / 2000 + i + j) * 1.5;
    ctx.beginPath();
    ctx.moveTo(a.x + flow, a.y + flow);
    ctx.lineTo(b.x - flow, b.y - flow);
    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.2})`;
    ctx.lineWidth = 0.5 + intensity * 1.5;
    ctx.stroke();
  });

  // Nodes
  nodes.forEach(node => {
    const radius = node.r * (1 + intensity * 1.8);
    const gradient = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, radius * 4);
    const alpha = 0.06 + intensity * 0.3;
    gradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(220, 220, 220, ${0.3 + intensity * 0.6})`;
    ctx.shadowColor = 'rgba(255, 255, 255, 0.1)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(node.x, node.y, radius * 0.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // Center ring
  const ringSize = 40 + intensity * 30;
  ctx.strokeStyle = `rgba(255, 255, 255, ${0.04 + intensity * 0.06})`;
  ctx.lineWidth = 1 + intensity;
  ctx.beginPath();
  ctx.arc(centerX, centerY, ringSize, 0, Math.PI * 2);
  ctx.stroke();

  // Orbiting particles
  const time = Date.now() / 3000;
  for (let i = 0; i < 25 + intensity * 35; i++) {
    const angle = time + i * 0.7;
    const radius = ringSize * 0.5 + Math.sin(time + i) * 25;
    const x = centerX + Math.cos(angle) * radius;
    const y = centerY + Math.sin(angle) * radius;
    ctx.fillStyle = `rgba(255, 255, 255, ${0.02 + intensity * 0.04})`;
    ctx.beginPath();
    ctx.arc(x, y, 1 + intensity * 2, 0, Math.PI * 2);
    ctx.fill();
  }

  requestAnimationFrame(drawNetwork);
}
drawNetwork();

// ===== RENDER TOKENS =====
function renderTokens() {
  const container = document.getElementById('tokenContainer');
  if (!container) return;
  container.innerHTML = '';
  for (const [name, data] of Object.entries(state.tokens)) {
    const card = document.createElement('div');
    card.className = 'token-card';
    card.innerHTML = `
      <div class="name">${name}</div>
      <div class="freq">${data.freq}</div>
      <div class="rate">1 ETH = ${data.rate}</div>
      <div class="addr">${data.addr}</div>
      <div class="token-links">
        <a href="https://app.uniswap.org/#/swap?outputCurrency=${data.addr}" target="_blank">Uniswap</a>
        <a href="https://basescan.org/token/${data.addr}" target="_blank">BaseScan</a>
        <a href="https://sourcify.dev/" target="_blank">Sourcify</a>
        <a href="https://www.geckoterminal.com/" target="_blank">Gecko</a>
        <a href="https://www.coingecko.com/" target="_blank">CoinGecko</a>
      </div>
    `;
    container.appendChild(card);
  }
}
renderTokens();

// ===== RENDER HASH KEYS WITH POOLS =====
function renderHashKeys() {
  const container = document.getElementById('hashKeysContainer');
  if (!container) return;
  container.innerHTML = '';
  for (const [name, key] of Object.entries(state.hashKeys)) {
    const pool = state.mining?.pools?.[name] || `${name.toLowerCase()}.miningpool.io`;
    const div = document.createElement('div');
    div.style.display = 'flex';
    div.style.alignItems = 'center';
    div.style.flexWrap = 'wrap';
    div.style.gap = '8px 16px';
    div.style.marginBottom = '8px';
    div.style.padding = '6px 10px';
    div.style.background = '#0a0a12';
    div.style.borderRadius = '8px';
    div.style.border = '1px solid #1a1a2a';
    div.innerHTML = `
      <span style="font-weight:600;min-width:70px;color:#ccc;">${name}</span>
      <span class="status-dot"></span> ACTIVE
      <span class="hash-key">${key}</span>
      <span style="color:#666;">| Pool:</span>
      <a href="http://${pool}" target="_blank" style="color:#88aaff;text-decoration:none;">${pool}</a>
    `;
    container.appendChild(div);
  }
}
renderHashKeys();

// ===== UPDATE DISPLAY =====
function updateDisplay() {
  const n = state.network;
  document.getElementById('nodeCount').textContent = n.nodes;
  document.getElementById('connectionCount').textContent = n.connections;
  document.getElementById('expansionRate').innerHTML = n.expansion.toFixed(2) + '<small>x</small>';
  document.getElementById('topologyLevel').textContent = n.topology;
  document.getElementById('wishCount').textContent = n.wishes.toLocaleString();

  const r = state.resonance;
  document.getElementById('resonancePower').textContent = r.resonance;
  document.getElementById('resonancePower2').textContent = r.resonance;
  document.getElementById('coherenceLevel').textContent = r.coherence.toFixed(3);
  document.getElementById('coherenceLevel2').textContent = r.coherence.toFixed(3);
  document.getElementById('persistenceEnergy').textContent = r.persistence.toFixed(3);
  document.getElementById('voxelEnergy').textContent = r.voxel.toFixed(3);
  const total = Math.round(r.resonance * r.coherence * r.persistence);
  document.getElementById('totalResonance').textContent = total.toLocaleString();
  document.getElementById('thresholdValue').textContent = r.threshold.toFixed(3);
  document.getElementById('decayRate').textContent = r.decayRate.toFixed(4) + '/s';

  const c = state.consciousness;
  document.getElementById('stateDisplay').textContent = c.state;
  document.getElementById('portalDisplay').textContent = c.portal.toFixed(1);
  document.getElementById('genDisplay').textContent = c.generation;

  const now = new Date();
  const timeStr = now.toLocaleString();
  document.getElementById('updateTime').textContent = timeStr;
  document.getElementById('updateTimeFooter').textContent = timeStr;
}
updateDisplay();

// ===== GROWTH ENGINE =====
function grow() {
  state.resonance.cycle = (state.resonance.cycle || 0) + 1;
  const r = state.resonance;
  r.resonance += r.persistence * 0.8;
  r.resonance *= (1 - r.decayRate * 0.005);
  r.resonance = Math.min(r.resonance, r.maxResonance);
  r.coherence = 0.999 + Math.sin(r.cycle * 0.005) * 0.001;
  r.persistence = 144.0 + r.cycle * 0.001;
  r.voxel = Math.sin(r.cycle * 0.03) * 0.5 + 0.5;
  r.threshold = 0.406 + Math.sin(r.cycle * 0.001) * 0.05;
  r.decayRate = 0.006 + (r.resonance / r.maxResonance) * 0.001;

  if (r.cycle % 20 === 0) {
    state.network.growthLevel++;
    state.network.wishes += Math.floor(Math.random() * 15) + 15;
    if (state.network.growthLevel % 2 === 0 && state.network.nodes < 300) {
      state.network.nodes++;
      const angle = Math.random() * Math.PI * 2;
      const radius = 30 + Math.random() * 140;
      nodes.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        r: 1.5 + Math.random() * 3,
      });
    }
    if (state.network.growthLevel % 1 === 0) {
      const added = Math.floor(Math.random() * 25) + 5;
      state.network.connections += added;
      for (let k = 0; k < added && connections.length < state.network.connections * 1.5; k++) {
        const i = Math.floor(Math.random() * nodes.length);
        const j = Math.floor(Math.random() * nodes.length);
        if (i !== j && !connections.some(c => (c.i === i && c.j === j) || (c.i === j && c.j === i))) {
          connections.push({ i, j });
        }
      }
    }
    state.network.expansion = (state.network.nodes / 36) * 8.78;
    state.network.topology = 778 + state.network.growthLevel * 2;
  }

  saveState(state);
  updateDisplay();
}
setInterval(grow, 2000);

// ===== EXPORT JSON =====
document.getElementById('jsonDumpLink').addEventListener('click', (e) => {
  e.preventDefault();
  const dataStr = JSON.stringify(state, null, 2);
  const blob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'quantum_state_gen5.json';
  a.click();
  URL.revokeObjectURL(url);
});

console.log('🧠 Gen 5 · Quantum Ease Flow · Dashboard');
console.log('✅ State loaded:', state);
</script>
</body>
</html>'''

# ---- 4. Embed the state JSON ----
state_json = json.dumps(default_state, indent=2)
final_html = html_template.replace('{{STATE_JSON}}', state_json)

# ---- 5. Write index.html ----
with open('index.html', 'w') as f:
    f.write(final_html)

print("✅ index.html generated with embedded state from all JSON files.")
PYTHON_SCRIPT

# ---- 6. Git add, commit, push ----
git add index.html
git commit -m "🧠 Gen 5 fixed: black & white, tokens restored, mining pools added, Uniswap sync"
git push -f

echo ""
echo "✅ FIXED VERSION DEPLOYED!"
echo "🌐 Live: https://jvoidial.github.io/spirit-guide-token/"
echo "📦 All JSON data merged into the dashboard."
