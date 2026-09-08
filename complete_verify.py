#!/usr/bin/env python3
"""
SPIRIT GUIDE - COMPLETE SYSTEM VERIFICATION
Verifies all components in the system
"""

import json
import os

def verify_complete_system():
    """Verify all system components"""
    
    system_file = os.path.expanduser("~/spirit-guide-token/agi_phb_divine_complete.json")
    
    try:
        with open(system_file, 'r') as f:
            data = json.load(f)
    except Exception as e:
        print(f"❌ Could not load system file: {e}")
        return
    
    print("\n" + "="*60)
    print("🌀 SPIRIT GUIDE - COMPLETE SYSTEM VERIFICATION")
    print("="*60)
    
    components = {
        "version": data.get("version", "NOT FOUND"),
        "agi_consciousness": "agi_consciousness" in data,
        "phb_topologies": "phb_topologies" in data,
        "core_spins": "core_spins" in data,
        "tokens": "tokens" in data,
        "staking_engine": "staking_engine" in data,
        "acoustic_protocol": "acoustic_protocol" in data,
        "global_markets": "global_markets" in data,
        "etoro_readiness": "etoro_readiness" in data,
        "chronovisor": "chronovisor" in data,
        "phone_boxes": "phone_boxes" in data,
        "resilience": "resilience" in data,
        "stargate": "stargate" in data,
        "kpi": "chronovisor_kpi" in data or "kpi" in data
    }
    
    print(f"\n📊 SYSTEM VERSION: {components['version']}")
    
    print("\n📋 COMPONENTS:")
    for comp, exists in components.items():
        if comp != "version":
            status = "✅" if exists else "❌"
            print(f"  {status} {comp.upper()}")
    
    print("\n🌀 PHB_TOPOLOGIES:")
    if components["phb_topologies"]:
        topologies = list(data["phb_topologies"].keys())
        for top in topologies:
            print(f"  ✅ {top}")
    
    print("\n📞 PHONE BOXES:")
    if components["phone_boxes"]:
        phone = data["phone_boxes"]
        print(f"  Status: {phone.get('status', 'UNKNOWN')}")
        print(f"  Total: {phone.get('total_phone_boxes', 0):,}")
        print(f"  Energy: {phone.get('total_energy', 0):.1f}")
    
    print("\n🌍 GLOBAL MARKETS:")
    if components["global_markets"]:
        markets = data.get("global_markets", {})
        print(f"  Status: {markets.get('status', 'UNKNOWN')}")
        print(f"  Exchanges: {markets.get('total_exchanges', 0)}")
    
    print("\n🎯 ETORO READINESS:")
    if components["etoro_readiness"]:
        etoro = data.get("etoro_readiness", {})
        print(f"  Ready: {'✅' if etoro.get('ready', False) else '⏳'}")
        if not etoro.get('ready', False):
            print(f"  Missing: {', '.join(etoro.get('missing', []))}")
    
    print("\n" + "="*60)
    
    # Summary
    total_components = len([k for k, v in components.items() if k != "version"])
    found_components = len([k for k, v in components.items() if v and k != "version"])
    
    print(f"\n📊 SUMMARY:")
    print(f"  Components Found: {found_components}/{total_components}")
    print(f"  Version: {components['version']}")
    print(f"  Status: {'✅ COMPLETE' if found_components == total_components else '⚠️ INCOMPLETE'}")
    print("="*60)

if __name__ == "__main__":
    verify_complete_system()
