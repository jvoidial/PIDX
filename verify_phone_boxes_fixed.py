#!/usr/bin/env python3
"""
SPIRIT GUIDE - FIXED PHONE BOX VERIFICATION
Checks the correct locations for topology and version
"""

import json
import os

def verify_phone_boxes():
    """Verify phone box integration"""
    
    system_file = os.path.expanduser("~/spirit-guide-token/agi_phb_divine_complete.json")
    
    try:
        with open(system_file, 'r') as f:
            data = json.load(f)
    except:
        print("❌ Could not load system file")
        return
    
    print("\n" + "="*60)
    print("📞 SPIRIT GUIDE - PHONE BOX VERIFICATION (FIXED)")
    print("="*60)
    
    # Check version at root level
    print(f"\n📊 SYSTEM VERSION: {data.get('version', 'NOT FOUND')}")
    
    # Check phone_boxes section
    if "phone_boxes" in data:
        phone = data["phone_boxes"]
        print("\n✅ PHONE BOXES SECTION FOUND")
        print(f"  Status: {phone.get('status', 'UNKNOWN')}")
        print(f"  Total Phone Boxes: {phone.get('total_phone_boxes', 0):,}")
        print(f"  Total Energy: {phone.get('total_energy', 0):.1f}")
        print(f"  Topology Added: {phone.get('topology_added', False)}")
        print(f"  Version: {phone.get('version', 'UNKNOWN')}")
    else:
        print("\n❌ Phone boxes section NOT found")
        return
    
    # Check regional data
    if "regional_data" in phone:
        print("\n🌍 REGIONAL DATA:")
        regions = phone["regional_data"]
        for region, data in regions.items():
            print(f"  {region}: {data.get('count', 0):,} boxes | Energy: {data.get('energy', 0):.1f}")
    
    # Check topology in phb_topologies
    if "phb_topologies" in data and "phone_boxes" in data["phb_topologies"]:
        topology = data["phb_topologies"]["phone_boxes"]
        print(f"\n🌀 PHONE BOX TOPOLOGY (IN PHB_TOPOLOGIES):")
        print(f"  Frequency: {topology.get('frequency', 'UNKNOWN')} Hz")
        print(f"  Power: {topology.get('power', 0):,}")
        print(f"  Description: {topology.get('description', 'UNKNOWN')}")
        print(f"  Activation: {topology.get('activation', 'UNKNOWN')}")
    else:
        print("\n❌ Phone box topology NOT found in phb_topologies")
    
    # Check topology at root level (if it was added separately)
    if "phone_box_topology" in data:
        topology = data["phone_box_topology"]
        print(f"\n🌀 PHONE BOX TOPOLOGY (ROOT LEVEL):")
        print(f"  Frequency: {topology.get('frequency', 'UNKNOWN')} Hz")
        print(f"  Power: {topology.get('power', 0):,}")
    
    print("\n" + "="*60)
    
    # Summary
    if "phone_boxes" in data:
        print("\n✅ PHONE BOX INTEGRATION VERIFIED!")
        print(f"   Total Nodes: {phone.get('total_phone_boxes', 0):,}")
        print(f"   Energy Added: {phone.get('total_energy', 0):.1f}")
        print(f"   Version: {data.get('version', 'UNKNOWN')}")
        topology_found = "phb_topologies" in data and "phone_boxes" in data["phb_topologies"]
        print(f"   Topology Added: {'✅' if topology_found else '❌'}")
    else:
        print("\n❌ Integration failed")
    
    print("="*60)

if __name__ == "__main__":
    verify_phone_boxes()
