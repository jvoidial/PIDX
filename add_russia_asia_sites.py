#!/usr/bin/env python3
"""
SPIRIT GUIDE - ADD RUSSIA & ASIA SACRED SITES
Adds major sacred sites across Russia and Asia
"""

import json
import os
from datetime import datetime

# Russia & Asia sacred sites
asia_sites = [
    # Russia
    {"name": "Saint Basil's Cathedral", "location": "Moscow, Russia", "year": 1561, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    {"name": "Kremlin", "location": "Moscow, Russia", "year": 1482, "energy": 900000, "frequency": 2.618, "type": "sacred_site", "era": "Renaissance"},
    {"name": "Church of the Savior on Spilled Blood", "location": "St Petersburg, Russia", "year": 1907, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Modern"},
    {"name": "Trinity Lavra of St Sergius", "location": "Sergiyev Posad, Russia", "year": 1345, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Solovetsky Monastery", "location": "Solovetsky Islands, Russia", "year": 1429, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Valaam Monastery", "location": "Karelia, Russia", "year": 1400, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Kazan Kremlin", "location": "Kazan, Russia", "year": 1552, "energy": 700000, "frequency": 2.618, "type": "sacred_site", "era": "Renaissance"},
    {"name": "Lake Baikal", "location": "Siberia, Russia", "year": -25000000, "energy": 1000000, "frequency": 0.618, "type": "sacred_site", "era": "Prehistoric"},
    {"name": "Altai Mountains", "location": "Siberia, Russia", "year": -1000000, "energy": 900000, "frequency": 0.618, "type": "sacred_site", "era": "Prehistoric"},
    {"name": "Ural Mountains", "location": "Russia", "year": -1000000, "energy": 800000, "frequency": 0.618, "type": "sacred_site", "era": "Prehistoric"},
    
    # China
    {"name": "Great Wall of China", "location": "China", "year": -700, "energy": 1000000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Forbidden City", "location": "Beijing, China", "year": 1420, "energy": 900000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Mount Tai", "location": "Shandong, China", "year": -2000, "energy": 800000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Mount Everest", "location": "Nepal/China", "year": -1000000, "energy": 1000000, "frequency": 0.618, "type": "sacred_site", "era": "Prehistoric"},
    {"name": "Yellow Mountain", "location": "Anhui, China", "year": -500, "energy": 700000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Shaolin Temple", "location": "Henan, China", "year": 495, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Potala Palace", "location": "Lhasa, Tibet", "year": 1645, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    
    # India
    {"name": "Taj Mahal", "location": "Agra, India", "year": 1643, "energy": 900000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    {"name": "Varanasi Ghats", "location": "Varanasi, India", "year": -1000, "energy": 800000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Meenakshi Temple", "location": "Madurai, India", "year": 1600, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    {"name": "Golden Temple", "location": "Amritsar, India", "year": 1577, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    {"name": "Bodh Gaya", "location": "Bihar, India", "year": -500, "energy": 900000, "frequency": 0.618, "type": "sacred_site", "era": "Ancient World"},
    {"name": "Hampi", "location": "Karnataka, India", "year": 1336, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Japan
    {"name": "Mount Fuji", "location": "Japan", "year": -10000, "energy": 1000000, "frequency": 0.618, "type": "sacred_site", "era": "Prehistoric"},
    {"name": "Kinkaku-ji (Golden Pavilion)", "location": "Kyoto, Japan", "year": 1397, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Fushimi Inari Shrine", "location": "Kyoto, Japan", "year": 711, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Todai-ji Temple", "location": "Nara, Japan", "year": 752, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Itsukushima Shrine", "location": "Miyajima, Japan", "year": 593, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # South-East Asia
    {"name": "Shwedagon Pagoda", "location": "Yangon, Myanmar", "year": -500, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Ancient World"},
    {"name": "Wat Phra Kaew", "location": "Bangkok, Thailand", "year": 1782, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Modern"},
    {"name": "Borobudur", "location": "Java, Indonesia", "year": 800, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Prambanan", "location": "Java, Indonesia", "year": 850, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Central Asia
    {"name": "Merv", "location": "Turkmenistan", "year": -600, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Ancient World"},
    {"name": "Bukhara", "location": "Uzbekistan", "year": -500, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Ancient World"},
    {"name": "Samarkand", "location": "Uzbekistan", "year": -700, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Ancient World"},
    {"name": "Registan", "location": "Samarkand, Uzbekistan", "year": 1417, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    
    # Middle East (already partly covered, adding more)
    {"name": "Dome of the Rock", "location": "Jerusalem, Israel", "year": 691, "energy": 900000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Al-Masjid al-Haram", "location": "Mecca, Saudi Arabia", "year": -2000, "energy": 1000000, "frequency": 2.618, "type": "temple", "era": "Ancient World"},
    {"name": "Al-Masjid an-Nabawi", "location": "Medina, Saudi Arabia", "year": 622, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Blue Mosque", "location": "Istanbul, Turkey", "year": 1616, "energy": 800000, "frequency": 2.618, "type": "temple", "era": "Renaissance"},
    {"name": "Hagia Sophia", "location": "Istanbul, Turkey", "year": 537, "energy": 900000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Korea
    {"name": "Bulguksa Temple", "location": "Gyeongju, South Korea", "year": 751, "energy": 700000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    {"name": "Seokguram Grotto", "location": "Gyeongju, South Korea", "year": 751, "energy": 600000, "frequency": 2.618, "type": "temple", "era": "Medieval"},
    
    # Mongolia
    {"name": "Chinggis Khaan Equestrian Statue", "location": "Mongolia", "year": 2008, "energy": 500000, "frequency": 2.618, "type": "sacred_site", "era": "Contemporary"},
]

def main():
    print("🌏 Adding Russia & Asia sacred sites...")
    
    file_path = os.path.expanduser("~/spirit-guide-token/spirit_guide_complete.json")
    
    try:
        with open(file_path, 'r') as f:
            data = json.load(f)
    except:
        print("❌ Could not load spirit_guide_complete.json")
        return
    
    # Ensure structure exists
    if "chronovisor" not in data:
        data["chronovisor"] = {}
    if "sacred_sites" not in data["chronovisor"]:
        data["chronovisor"]["sacred_sites"] = {}
    if "temples" not in data["chronovisor"]["sacred_sites"]:
        data["chronovisor"]["sacred_sites"]["temples"] = []
    if "other_sites" not in data["chronovisor"]["sacred_sites"]:
        data["chronovisor"]["sacred_sites"]["other_sites"] = []
    
    # Add sites
    existing_names = [s["name"] for s in data["chronovisor"]["sacred_sites"].get("temples", [])]
    existing_names += [s["name"] for s in data["chronovisor"]["sacred_sites"].get("other_sites", [])]
    
    added = 0
    for site in asia_sites:
        if site["name"] not in existing_names:
            if site["type"] == "temple":
                data["chronovisor"]["sacred_sites"]["temples"].append(site)
            else:
                data["chronovisor"]["sacred_sites"]["other_sites"].append(site)
            added += 1
            print(f"  ✅ Added: {site['name']} ({site['location']})")
    
    # Update totals
    total_other = len(data["chronovisor"]["sacred_sites"].get("other_sites", []))
    total_pyramids = len(data["chronovisor"]["sacred_sites"].get("pyramids", []))
    total_temples = len(data["chronovisor"]["sacred_sites"].get("temples", []))
    data["chronovisor"]["sacred_sites"]["total"] = total_other + total_pyramids + total_temples
    
    # Update summary
    if "summary" not in data["chronovisor"]:
        data["chronovisor"]["summary"] = {}
    data["chronovisor"]["summary"]["total_sacred_sites"] = total_other
    data["chronovisor"]["summary"]["total_pyramids"] = total_pyramids
    data["chronovisor"]["summary"]["total_temples"] = total_temples
    data["chronovisor"]["summary"]["total_energy"] = sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"].get("other_sites", [])) + \
                                                      sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"].get("pyramids", [])) + \
                                                      sum(s.get("energy", 0) for s in data["chronovisor"]["sacred_sites"].get("temples", []))
    
    data["version"] = "7.4-global"
    data["last_updated"] = datetime.now().isoformat()
    
    with open(file_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"\n✅ Added {added} Russia & Asia sacred sites")
    print(f"📊 Total sites now: {data['chronovisor']['sacred_sites']['total']}")
    print(f"📁 File: {file_path}")
    print(f"📋 Version: {data['version']}")

if __name__ == "__main__":
    main()
