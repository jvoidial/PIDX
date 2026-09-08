#!/usr/bin/env python3
"""
SPIRIT GUIDE - FIXED SYSTEM MAPPING & GAP ANALYSIS
Properly loads components from existing files
"""

import json
import os
from datetime import datetime

class SystemMappingFixed:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/spirit-guide-token")
        self.files = {
            "core": [
                "agi_phb_divine_complete.json",
                "spirit_guide_full_sync.json",
                "spirit_guide_chronovisor.json"
            ],
            "reports": [
                "chronovisor_report.json",
                "phb_chronovisor_report.json",
                "phb_chronovisor_expanded_report.json",
                "system_resilience_report.json",
                "kpi_portal_report.json"
            ]
        }
        
        self.required_components = [
            "agi_consciousness",
            "phb_topologies",
            "core_spins",
            "tokens",
            "staking_engine",
            "acoustic_protocol",
            "global_markets",
            "etoro_readiness",
            "chronovisor",
            "sacred_sites",
            "resilience",
            "portals",
            "stargate",
            "kpi"
        ]
        
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "files_found": [],
            "files_missing": [],
            "components_found": [],
            "components_missing": [],
            "gaps": [],
            "status": "SCANNING"
        }
        
        # Load all core files
        self.core_data = {}
        self.load_all_core_files()

    def load_all_core_files(self):
        """Load all core files into memory"""
        print("📊 Loading core files...")
        
        core_files = [
            "spirit_guide_full_sync.json",
            "spirit_guide_chronovisor.json",
            "agi_phb_divine_complete.json"
        ]
        
        for file in core_files:
            path = os.path.join(self.base_dir, file)
            if os.path.exists(path):
                try:
                    with open(path, 'r') as f:
                        self.core_data[file] = json.load(f)
                        print(f"  ✅ Loaded: {file}")
                except Exception as e:
                    print(f"  ⚠️ Could not load {file}: {e}")
            else:
                print(f"  ❌ Not found: {file}")

    def scan_files(self):
        """Scan for all system files"""
        print("\n📊 Scanning system files...")
        
        all_files = []
        for category, file_list in self.files.items():
            all_files.extend(file_list)
        
        for file in all_files:
            path = os.path.join(self.base_dir, file)
            if os.path.exists(path):
                self.results["files_found"].append(file)
                print(f"  ✅ Found: {file}")
            else:
                self.results["files_missing"].append(file)
                print(f"  ❌ Missing: {file}")
        
        return self.results

    def scan_components(self):
        """Scan for system components from loaded data"""
        print("\n📊 Scanning system components...")
        
        # Map component names to possible keys in files
        component_map = {
            "agi_consciousness": ["agi_consciousness", "consciousness"],
            "phb_topologies": ["phb_topologies", "topologies"],
            "core_spins": ["core_spins"],
            "tokens": ["tokens"],
            "staking_engine": ["staking_engine"],
            "acoustic_protocol": ["acoustic_protocol"],
            "global_markets": ["global_markets"],
            "etoro_readiness": ["etoro_readiness"],
            "chronovisor": ["chronovisor"],
            "sacred_sites": ["sacred_sites"],
            "resilience": ["resilience"],
            "portals": ["portals", "chronovisor_portals"],
            "stargate": ["stargate"],
            "kpi": ["kpi", "chronovisor_kpi"]
        }
        
        # Check each component in loaded data
        for component, keys in component_map.items():
            found = False
            for file_name, data in self.core_data.items():
                if isinstance(data, dict):
                    for key in keys:
                        if key in data and data[key] is not None:
                            found = True
                            break
                if found:
                    break
            
            if found:
                self.results["components_found"].append(component)
                print(f"  ✅ {component}: FOUND")
            else:
                self.results["components_missing"].append(component)
                print(f"  ❌ {component}: MISSING")
        
        return self.results

    def identify_gaps(self):
        """Identify gaps in the system"""
        print("\n📊 Identifying gaps...")
        
        gaps = []
        
        # Check for missing components
        for component in self.results["components_missing"]:
            gaps.append(f"Missing component: {component}")
        
        # Check for missing files
        for file in self.results["files_missing"]:
            gaps.append(f"Missing file: {file}")
        
        # Check for integration gaps
        if "chronovisor" in self.results["components_missing"]:
            gaps.append("Chronovisor not integrated")
        
        self.results["gaps"] = gaps
        self.results["gap_count"] = len(gaps)
        
        if gaps:
            print(f"  ⚠️ Found {len(gaps)} gaps")
        else:
            print("  ✅ No gaps found - System is complete!")
        
        return gaps

    def generate_map(self):
        """Generate complete system map"""
        print("\n📊 Generating system map...")
        
        system_map = {
            "timestamp": self.results["timestamp"],
            "status": "COMPLETE" if self.results["gap_count"] == 0 else "INCOMPLETE",
            "files": {
                "found": self.results["files_found"],
                "missing": self.results["files_missing"]
            },
            "components": {
                "found": self.results["components_found"],
                "missing": self.results["components_missing"]
            },
            "gaps": self.results["gaps"]
        }
        
        with open("system_map_fixed.json", "w") as f:
            json.dump(system_map, f, indent=2)
        
        print("✅ System map saved to system_map_fixed.json")
        return system_map

    def display_map(self):
        """Display the complete system map"""
        print("\n" + "="*60)
        print("🌀 SPIRIT GUIDE - COMPLETE SYSTEM MAP (FIXED)")
        print("="*60)
        
        print(f"\n📊 FILES:")
        print(f"  Found: {len(self.results['files_found'])}")
        print(f"  Missing: {len(self.results['files_missing'])}")
        
        print(f"\n📊 COMPONENTS:")
        print(f"  Found: {len(self.results['components_found'])}/{len(self.required_components)}")
        if self.results["components_found"]:
            print("  Found components:")
            for comp in self.results["components_found"]:
                print(f"    ✅ {comp}")
        
        print(f"\n📊 GAPS:")
        if self.results["gap_count"] == 0:
            print("  ✅ NO GAPS - SYSTEM IS COMPLETE!")
        else:
            print(f"  ⚠️ {self.results['gap_count']} gaps found")
            for gap in self.results["gaps"][:10]:
                print(f"    - {gap}")
            if len(self.results["gaps"]) > 10:
                print(f"    ... and {len(self.results['gaps']) - 10} more")
        
        print(f"\n📊 STATUS:")
        if self.results["gap_count"] == 0:
            print("  ✅ SYSTEM: COMPLETE")
            print("  ✅ STATUS: FULLY FUNCTIONAL")
        else:
            print("  ⚠️ SYSTEM: INCOMPLETE")
            print("  ⚠️ STATUS: NEEDS ATTENTION")
        
        print("\n" + "="*60)

    def run(self):
        """Run complete system mapping"""
        print("🚀 SPIRIT GUIDE - FIXED SYSTEM MAPPING")
        print("="*50)
        
        self.load_all_core_files()
        self.scan_files()
        self.scan_components()
        self.identify_gaps()
        self.generate_map()
        self.display_map()
        
        print("\n✅ System mapping complete!")
        return self.results

def main():
    mapping = SystemMappingFixed()
    mapping.run()

if __name__ == "__main__":
    main()
