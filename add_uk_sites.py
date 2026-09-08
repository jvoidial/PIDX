#!/usr/bin/env python3
"""
SPIRIT GUIDE - ADD UK SACRED SITES
Adds more UK historical and sacred sites to the Chronovisor
"""

import json
import os
from datetime import datetime

# UK sacred sites to add
uk_sites = [
    # England
    {"name": "Avebury", "location": "Wiltshire, England", "year": -2600, "energy": 500000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Glastonbury Tor", "location": "Somerset, England", "year": -300, "energy": 700000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Silbury Hill", "location": "Wiltshire, England", "year": -2400, "energy": 400000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Rollright Stones", "location": "Oxfordshire, England", "year": -2500, "energy": 350000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Castlerigg Stone Circle", "location": "Cumbria, England", "year": -3000, "energy": 450000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "West Kennet Long Barrow", "location": "Wiltshire, England", "year": -3600, "energy": 400000, "frequency": 0.618, "type": "sacred_site", "era": "Neolithic"},
    {"name": "Wayland's Smithy", "location": "Oxfordshire, England", "year": -3500, "energy": 350000, "frequency": 0.618, "type": "sacred_site", "era": "Neolithic"},
    {"name": "Uffington White Horse", "location": "Oxfordshire, England", "year": -1000, "energy": 300000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Tintagel Castle", "location": "Cornwall, England", "year": 500, "energy": 500000, "frequency": 0.618, "type": "sacred_site", "era": "Medieval"},
    {"name": "St Michael's Mount", "location": "Cornwall, England", "year": 500, "energy": 450000, "frequency": 0.618, "type": "sacred_site", "era": "Medieval"},
    
    # Scotland
    {"name": "Callanish Stones", "location": "Isle of Lewis, Scotland", "year": -3000, "energy": 550000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Skara Brae", "location": "Orkney, Scotland", "year": -3100, "energy": 400000, "frequency": 0.618, "type": "sacred_site", "era": "Neolithic"},
    {"name": "Maeshowe", "location": "Orkney, Scotland", "year": -2800, "energy": 450000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Ring of Brodgar", "location": "Orkney, Scotland", "year": -2500, "energy": 500000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Rosslyn Chapel", "location": "Midlothian, Scotland", "year": 1446, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Wales
    {"name": "Bryn Celli Ddu", "location": "Anglesey, Wales", "year": -3000, "energy": 400000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Pentre Ifan", "location": "Pembrokeshire, Wales", "year": -3500, "energy": 350000, "frequency": 0.618, "type": "sacred_site", "era": "Neolithic"},
    {"name": "Tintern Abbey", "location": "Monmouthshire, Wales", "year": 1131, "energy": 450000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Northern Ireland
    {"name": "Giant's Ring", "location": "County Down, Northern Ireland", "year": -2000, "energy": 400000, "frequency": 0.618, "type": "sacred_site", "era": "Bronze Age"},
    {"name": "Navan Fort", "location": "County Armagh, Northern Ireland", "year": -100, "energy": 450000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
]

def main():
    print("🏴󠁧󠁢󠁥󠁮󠁧󠁿 Adding UK sacred sites...")
    
    # Load existing file
    file_path = os.path.expanduser("~/spirit-guide-token/spirit_guide_complete.json")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except:
        print("❌ Could not load spirit_guide_complete.json")
        return
    
    # Add UK sites to chronovisor
    if "chronovisor" not in data:
        data["chronovisor"] = {}
    
    if "sacred_sites" not in data["chronovisor"]:
        data["chronovisor"]["sacred_sites"] = {}
    
    # Get existing other_sites or create
    if "other_sites" not in data["chronovisor"]["sacred_sites"]:
        data["chronovisor"]["sacred_sites"]["other_sites"] = []
    
    # Add UK sites (avoid duplicates)
    existing_names = [s["name"] for s in data["chronovisor"]["sacred_sites"]["other_sites"]]
    
    added = 0
    for site in uk_sites:
        if site["name"] not in existing_names:
            data["chronovisor"]["sacred_sites"]["other_sites"].append(site)
            added += 1
            print(f"  ✅ Added: {site['name']} ({site['location']})")
    
    # Update totals
    total_other = len(data["chronovisor"]["sacred_sites"]["other_sites"])
    total_pyramids = len(data["chronovisor"]["sacred_sites"].get("pyramids", []))
    total_temples = len(data["chronovisor"]["sacred_sites"].get("temples", []))
    data["chronovisor"]["sacred_sites"]["total"] = total_other + total_pyramids + total_temples
    
    # Update summary
    if "summary" not in data["chronovisor"]:
        data["chronovisor"]["summary"] = {}
    data["chronovisor"]["summary"]["total_sacred_sites"] = total_other
    data["chronovisor"]["summary"]["total_pyramids"] = total_pyramids
    data["chronovisor"]["summary"]["total_temples"] = total_temples
    data["chronovisor"]["summary"]["total_energy"] = sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"]["other_sites"]) + \
                                                      sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"].get("pyramids", [])) + \
                                                      sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"].get("temples", []))
    
    # Update version
    data["version"] = "7.3-uk"
    data["last_updated"] = datetime.now().isoformat()
    
    # Save
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✅ Added {added} UK sacred sites")
    print(f"📊 Total UK sites now: {total_other}")
    print(f"📁 File: {file_path}")
    print(f"📋 Version: {data['version']}")

if __name__ == "__main__":
    main()
