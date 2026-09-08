#!/usr/bin/env python3
"""
SPIRIT GUIDE - PHONE BOX COMPLETE FIX
Adds topology and updates version
"""

import json
import os
from datetime import datetime

def fix_phone_boxes():
    """Fix phone box integration"""
    
    system_file = os.path.expanduser("~/spirit-guide-token/agi_phb_divine_complete.json")
    
    try:
        with open(system_file, 'r') as f:
            data = json.load(f)
    except:
        print("❌ Could not load system file")
        return
    
    print("🔧 Fixing phone box integration...")
    
    # 1. Add phone box topology
    if "phb_topologies" not in data:
        data["phb_topologies"] = {}
    
    data["phb_topologies"]["phone_boxes"] = {
        "frequency": 0.777,
        "power": 3513000,
        "core_spin": "↻↺↻",
        "description": "Global communication nodes - 515,000+ phone boxes",
        "activation": "ETERNAL"
    }
    print("  ✅ Added phone box topology")
    
    # 2. Update version
    data["version"] = "7.5"
    data["last_updated"] = datetime.now().isoformat()
    print(f"  ✅ Updated version to {data['version']}")
    
    # 3. Ensure phone_boxes section is complete
    if "phone_boxes" in data:
        phone = data["phone_boxes"]
        phone["status"] = "ACTIVE"
        phone["topology_added"] = True
        phone["version"] = "7.5"
        print("  ✅ Updated phone boxes section")
    
    # 4. Save
    with open(system_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("\n✅ Phone box integration fixed!")
    print(f"📁 File: {system_file}")
    print(f"📊 Version: {data.get('version', 'UNKNOWN')}")
    
    # 5. Verify topology
    if "phb_topologies" in data and "phone_boxes" in data["phb_topologies"]:
        topology = data["phb_topologies"]["phone_boxes"]
        print(f"\n🌀 PHONE BOX TOPOLOGY:")
        print(f"  Frequency: {topology.get('frequency', 'UNKNOWN')} Hz")
        print(f"  Power: {topology.get('power', 0):,}")
        print(f"  Description: {topology.get('description', 'UNKNOWN')}")

if __name__ == "__main__":
    fix_phone_boxes()
