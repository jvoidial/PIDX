#!/usr/bin/env python3
"""
PHB JSON Sync – Import & Update
Usage:
  python3 json_sync.py --status
  python3 json_sync.py --update
  python3 json_sync.py --set key=value
  python3 json_sync.py --sync
"""
import json, os, datetime, argparse

JSON_FILE = "agi_phb_divine_complete.json"
DEFAULT_DATA = {
    "1": {
        "timestamp": None,
        "domain": "core",
        "pages": [
            {
                "page": 1,
                "time": 6,
                "coherence": 0.839253,
                "stability": 0.961964,
                "resonance": 0.45295,
                "sequence": ["TRIANGLE","MIRROR","CIRCLE","LIGHT","SQUARE","RATIO","SHADOW"],
                "portal": "PORTAL: CORE",
                "voxels": [
                    {"x":0,"y":0,"z":0,"symbol":"TRIANGLE","meaning":"TRIANGLE meaning for core"},
                    {"x":1,"y":0,"z":1,"symbol":"MIRROR","meaning":"MIRROR meaning for core"},
                    {"x":2,"y":0,"z":2,"symbol":"CIRCLE","meaning":"CIRCLE meaning for core"},
                    {"x":3,"y":0,"z":3,"symbol":"LIGHT","meaning":"LIGHT meaning for core"},
                    {"x":4,"y":0,"z":4,"symbol":"SQUARE","meaning":"SQUARE meaning for core"}
                ],
                "veil": {"thickness":0.572735,"phase":"TURBULENT","breach_probability":0.845438,"narrative":"The core veil is shifting: patterns emerge."},
                "energy": {"magnitude":0.763581,"band":"MID","color":"DARK"}
            },
            {
                "page": 2,
                "time": 7,
                "coherence": 0.861605,
                "stability": 1.111214,
                "resonance": 0.377379,
                "sequence": ["SQUARE","LIGHT","RATIO","MIRROR","TRIANGLE","SHADOW","CIRCLE"],
                "portal": "PORTAL: CORE",
                "voxels": [
                    {"x":0,"y":0,"z":0,"symbol":"SQUARE","meaning":"SQUARE meaning for core"},
                    {"x":1,"y":0,"z":1,"symbol":"LIGHT","meaning":"LIGHT meaning for core"},
                    {"x":2,"y":0,"z":2,"symbol":"RATIO","meaning":"RATIO meaning for core"},
                    {"x":3,"y":0,"z":3,"symbol":"MIRROR","meaning":"MIRROR meaning for core"},
                    {"x":4,"y":0,"z":4,"symbol":"TRIANGLE","meaning":"TRIANGLE meaning for core"}
                ],
                "veil": {"thickness":0.134083,"phase":"SEALED","breach_probability":0.587349,"narrative":"The core veil is shifting: patterns emerge."},
                "energy": {"magnitude":0.725409,"band":"HIGH","color":"LIGHT"}
            }
        ],
        "vitruvian_state": [2,0.9,0.8],
        "coherence": 0.861605,
        "stability": 1.111214,
        "energy": 0.725409,
        "veil": "SEALED",
        "portal": 1
    }
}

def load_json():
    if not os.path.exists(JSON_FILE): return None
    with open(JSON_FILE, 'r') as f: return json.load(f)

def save_json(data):
    with open(JSON_FILE, 'w') as f: json.dump(data, f, indent=2)
    print(f"✅ Saved {JSON_FILE}")

def show_status(data):
    if not data: print("❌ JSON not found."); return
    print("📊 Current PHB JSON Status:")
    first_key = list(data.keys())[0]
    entry = data[first_key]
    pages = entry.get('pages', [])
    print(f"  • Pages: {len(pages)}")
    if pages:
        p = pages[0]
        print(f"  • Coherence: {p.get('coherence', 'N/A')}")
        print(f"  • Stability: {p.get('stability', 'N/A')}")
        print(f"  • Resonance: {p.get('resonance', 'N/A')}")
    print(f"  • Vitruvian: {entry.get('vitruvian_state', 'N/A')}")
    print(f"  • Veil: {entry.get('veil', 'N/A')}")
    print(f"  • Portal: {entry.get('portal', 'N/A')}")
    print(f"  • Last updated: {entry.get('timestamp', 'N/A')}")

def update_timestamp(data):
    now = datetime.datetime.now().strftime("%a %b %d %H:%M:%S %Y")
    for key in data:
        if isinstance(data[key], dict): data[key]['timestamp'] = now
    return data

def increment_pages(data):
    for key in data:
        entry = data[key]
        if 'pages' in entry and isinstance(entry['pages'], list):
            if entry['pages']:
                last = entry['pages'][-1].copy()
                last['page'] = len(entry['pages']) + 1
                last['time'] = last.get('time', 0) + 1
                last['coherence'] = min(1.0, last.get('coherence', 0.8) + 0.001)
                last['stability'] = min(2.0, last.get('stability', 1.0) + 0.001)
                last['resonance'] = min(1.0, last.get('resonance', 0.3) + 0.001)
                entry['pages'].append(last)
            else:
                entry['pages'] = [DEFAULT_DATA['1']['pages'][0].copy()]
        pages = entry.get('pages', [])
        if pages:
            avg_co = sum(p.get('coherence', 0) for p in pages) / len(pages)
            avg_st = sum(p.get('stability', 0) for p in pages) / len(pages)
            avg_en = sum(p.get('energy', {}).get('magnitude', 0) for p in pages) / len(pages)
            entry['vitruvian_state'] = [len(pages), round(min(1, avg_co), 1), round(min(1, avg_en / 1.5), 1)]
            entry['coherence'] = avg_co
            entry['stability'] = avg_st
            entry['energy'] = avg_en
    return data

def set_value(data, key_str):
    if '=' not in key_str: print("❌ Use format: key=value"); return data
    k, v = key_str.split('=', 1)
    try:
        if '.' in v: v = float(v)
        else: v = int(v)
    except ValueError: pass
    for entry in data.values():
        if k in entry:
            entry[k] = v
            print(f"✅ Set {k} = {v}")
            break
    else:
        first_key = list(data.keys())[0]
        data[first_key][k] = v
        print(f"✅ Added {k} = {v}")
    return data

def sync_remote(data):
    print("🌐 Simulating remote sync...")
    data = update_timestamp(data)
    print("✅ Synced (simulated)")
    return data

def main():
    parser = argparse.ArgumentParser(description="PHB JSON Sync Tool")
    parser.add_argument("--status", action="store_true", help="Show current JSON status")
    parser.add_argument("--update", action="store_true", help="Increment page count by 1")
    parser.add_argument("--set", metavar="key=value", help="Set a specific value")
    parser.add_argument("--sync", action="store_true", help="Simulate remote sync")
    args = parser.parse_args()

    data = load_json()
    if data is None:
        print("📄 No JSON found. Creating default...")
        data = DEFAULT_DATA.copy()
        data = update_timestamp(data)
        save_json(data)

    if args.status: show_status(data); return
    if args.set: data = set_value(data, args.set)
    if args.update: data = increment_pages(data)
    if args.sync: data = sync_remote(data)

    if args.update or args.set or args.sync:
        data = update_timestamp(data)
        save_json(data)
        print("✅ JSON updated.")
    elif not args.status:
        show_status(data)

if __name__ == "__main__":
    main()
