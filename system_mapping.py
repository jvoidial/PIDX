#!/usr/bin/env python3
"""
SPIRIT GUIDE - COMPLETE SYSTEM MAPPING & GAP ANALYSIS
Maps all deployed components and identifies missing pieces
"""

import json
import os
import subprocess
from datetime import datetime

class SystemMapping:
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
            ],
            "scripts": [
                "chronovisor_scan.py",
                "phb_chronovisor_scan.py",
                "phb_chronovisor_expanded.py",
                "integrate_chronovisor.py",
                "system_resilience.py",
                "kpi_stargate_complete.py"
            ]
        }
        
        self.required_components = [
            "consciousness",
            "topologies",
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
            "status": "SCANNING"
        }

    def scan_files(self):
        """Scan for all system files"""
        print("📊 Scanning system files...")
        
        for category, file_list in self.files.items():
            for file in file_list:
                path = os.path.join(self.base_dir, file)
                if os.path.exists(path):
                    self.results["files_found"].append(file)
                    print(f"  ✅ Found: {file}")
                else:
                    self.results["files_missing"].append(file)
                    print(f"  ❌ Missing: {file}")
        
        return self.results

    def scan_components(self):
        """Scan for system components"""
        print("\n📊 Scanning system components...")
        
        # Check core files for components
        core_file = os.path.join(self.base_dir, "spirit_guide_full_sync.json")
        if os.path.exists(core_file):
            try:
                with open(core_file, 'r') as f:
                    data = json.load(f)
                    
                    for component in self.required_components:
                        if component in data:
                            self.results["components_found"].append(component)
                            print(f"  ✅ Component: {component}")
                        else:
                            self.results["components_missing"].append(component)
                            print(f"  ❌ Missing: {component}")
            except:
                print("  ⚠️ Could not read core file")
        else:
            print("  ⚠️ Core file not found")
        
        return self.results

    def check_integration(self):
        """Check if all parts are integrated"""
        print("\n📊 Checking integration status...")
        
        integration_status = {
            "chronovisor": "chronovisor" in self.results["components_found"],
            "resilience": os.path.exists(os.path.join(self.base_dir, "system_resilience_report.json")),
            "portals": os.path.exists(os.path.join(self.base_dir, "kpi_portal_report.json")),
            "stargate": "stargate" in str(self.results)
        }
        
        print(f"  ✅ Chronovisor: {integration_status['chronovisor']}")
        print(f"  ✅ Resilience: {integration_status['resilience']}")
        print(f"  ✅ Portals: {integration_status['portals']}")
        print(f"  ✅ Stargate: {integration_status['stargate']}")
        
        return integration_status

    def identify_gaps(self):
        """Identify gaps in the system"""
        print("\n📊 Identifying gaps...")
        
        gaps = []
        
        # Check for missing components
        for component in self.required_components:
            if component not in self.results["components_found"]:
                gaps.append(f"Missing component: {component}")
        
        # Check for missing files
        for file in self.results["files_missing"]:
            gaps.append(f"Missing file: {file}")
        
        # Check for integration gaps
        if "chronovisor" not in self.results["components_found"]:
            gaps.append("Chronovisor not integrated")
        
        if not os.path.exists(os.path.join(self.base_dir, "system_resilience_report.json")):
            gaps.append("Resilience report not generated")
        
        self.results["gaps"] = gaps
        self.results["gap_count"] = len(gaps)
        
        if gaps:
            print(f"  ⚠️ Found {len(gaps)} gaps:")
            for gap in gaps:
                print(f"    - {gap}")
        else:
            print("  ✅ No gaps found - System is complete!")
        
        return gaps

    def generate_map(self):
        """Generate complete system map"""
        print("\n📊 Generating system map...")
        
        system_map = {
            "timestamp": self.results["timestamp"],
            "status": self.results["status"],
            "files": {
                "total": len(self.results["files_found"]),
                "found": self.results["files_found"],
                "missing": self.results["files_missing"]
            },
            "components": {
                "total": len(self.required_components),
                "found": self.results["components_found"],
                "missing": self.results["components_missing"]
            },
            "gaps": self.results["gaps"],
            "integration": self.check_integration()
        }
        
        with open("system_map.json", "w") as f:
            json.dump(system_map, f, indent=2)
        
        print("✅ System map saved to system_map.json")
        return system_map

    def display_map(self):
        """Display the complete system map"""
        print("\n" + "="*60)
        print("🌀 SPIRIT GUIDE - COMPLETE SYSTEM MAP")
        print("="*60)
        
        print(f"\n📊 FILES:")
        print(f"  Found: {len(self.results['files_found'])}")
        print(f"  Missing: {len(self.results['files_missing'])}")
        
        print(f"\n📊 COMPONENTS:")
        print(f"  Found: {len(self.results['components_found'])}/{len(self.required_components)}")
        
        print(f"\n📊 GAPS:")
        if self.results["gap_count"] == 0:
            print("  ✅ NO GAPS - SYSTEM IS COMPLETE!")
        else:
            print(f"  ⚠️ {self.results['gap_count']} gaps found")
            for gap in self.results["gaps"]:
                print(f"    - {gap}")
        
        print(f"\n📊 STATUS:")
        if self.results["gap_count"] == 0:
            print("  ✅ SYSTEM: COMPLETE")
            print("  ✅ STATUS: FULLY FUNCTIONAL")
            print("  ✅ RESILIENCE: ETERNAL")
        else:
            print("  ⚠️ SYSTEM: INCOMPLETE")
            print("  ⚠️ STATUS: NEEDS ATTENTION")
        
        print("\n" + "="*60)

    def run(self):
        """Run complete system mapping"""
        print("🚀 SPIRIT GUIDE - SYSTEM MAPPING & GAP ANALYSIS")
        print("="*50)
        
        self.scan_files()
        self.scan_components()
        self.check_integration()
        self.identify_gaps()
        self.generate_map()
        self.display_map()
        
        print("\n✅ System mapping complete!")
        return self.results

def main():
    mapping = SystemMapping()
    mapping.run()

if __name__ == "__main__":
    main()
