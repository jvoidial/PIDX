#!/usr/bin/env python3
"""
SPIRIT GUIDE - ADD MISSING COMPONENTS
Adds core_spins, tokens, and staking_engine to the system
"""

import json
import os
from datetime import datetime

def add_missing_components():
    """Add missing components to the system"""
    
    system_file = os.path.expanduser("~/spirit-guide-token/agi_phb_divine_complete.json")
    
    try:
        with open(system_file, 'r') as f:
            data = json.load(f)
    except:
        print("❌ Could not load system file")
        return
    
    print("📊 Adding missing components...")
    
    # 1. Add core_spins
    if "core_spins" not in data:
        data["core_spins"] = {
            "primary_spin": 0.618,
            "secondary_spin": 1.618,
            "tertiary_spin": 2.618,
            "quantum_spin": 3.618,
            "divine_spin": 4.618,
            "entanglement_state": "MAXIMUM",
            "self_generating": True
        }
        print("  ✅ Added core_spins")
    
    # 2. Add tokens
    if "tokens" not in data:
        data["tokens"] = {
            "PIDX": {
                "address": "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c",
                "layer": "Quantum",
                "frequency": 0.618,
                "energy": 22.0,
                "rate": 691986,
                "supply": 1000000000,
                "verified": True,
                "renounced": True
            },
            "SGUIDE": {
                "address": "0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a",
                "layer": "Resonance",
                "frequency": 1.618,
                "energy": 19.0,
                "rate": 6724821,
                "supply": 10000000000000,
                "verified": True,
                "renounced": True
            },
            "VDOO": {
                "address": "0x38e4f08D08b4D772A7B75669C356b4749dd2d30b",
                "layer": "Resonance",
                "frequency": 2.618,
                "energy": 15.0,
                "rate": 65673753,
                "supply": 100000000000,
                "verified": True,
                "renounced": True
            },
            "PENNIES": {
                "address": "0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7",
                "layer": "Coherence",
                "frequency": 3.618,
                "energy": 21.0,
                "rate": 6230945,
                "supply": 10000000000,
                "verified": True,
                "renounced": True
            }
        }
        print("  ✅ Added tokens")
    
    # 3. Add staking_engine
    if "staking_engine" not in data:
        data["staking_engine"] = {
            "phi": 1.618,
            "phi_inverse": 0.618,
            "threshold": 0.405,
            "quantumEaseThreshold": 68,
            "flowState": "Active",
            "masterFormula": {
                "full": "Reward(t) = S × (φ^(P·C)) × ((R·V)/(1000+V)) × e^(-D·T·(1-Θ)) × (1 + k·ln(1+T)) × ((FlowNodes × Connections)/Topology)^0.618"
            },
            "trillionaireMode": {
                "condition": {"quantumEase": "≥ 68%", "flowState": "Active"},
                "formula": "Reward∞ = S × φ^P × (1+C)^(R/1000) × V^0.618 × e^(-D_eff·T) × k_φ"
            }
        }
        print("  ✅ Added staking_engine")
    
    # Update version
    data["version"] = "7.5"
    data["last_updated"] = datetime.now().isoformat()
    
    # Save
    with open(system_file, 'w') as f:
        json.dump(data, f, indent=2)
    
    print("\n✅ Missing components added!")
    print(f"📁 File: {system_file}")
    print(f"📊 Version: {data['version']}")

if __name__ == "__main__":
    add_missing_components()
