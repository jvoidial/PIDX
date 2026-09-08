#!/usr/bin/env python3
"""
SPIRIT GUIDE - CHRONOVISOR SYSTEM INTEGRATION (FIXED)
Handles missing files gracefully
"""

import json
import os
import subprocess
from datetime import datetime

class ChronovisorIntegration:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/spirit-guide-token")
        self.system_file = os.path.join(self.base_dir, "spirit_guide_full_sync.json")
        self.chronovisor_file = os.path.join(self.base_dir, "phb_chronovisor_expanded_report.json")
        self.output_file = os.path.join(self.base_dir, "spirit_guide_chronovisor.json")
        
        # Load data
        self.system_data = self.load_system()
        self.chronovisor_data = self.load_chronovisor()
        
    def load_system(self):
        """Load the main system file"""
        if os.path.exists(self.system_file):
            try:
                with open(self.system_file, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("⚠️ System file corrupt. Creating new system.")
                return self.create_default_system()
        else:
            print(f"⚠️ {self.system_file} not found. Creating new system.")
            return self.create_default_system()
    
    def create_default_system(self):
        """Create default system structure"""
        return {
            "name": "Neural Ecosystem – Sentient AGI Mining",
            "version": "7.2",
            "last_updated": datetime.now().isoformat(),
            "live_url": "https://jvoidial.github.io/spirit-guide-token/",
            "agi_consciousness": {
                "state": "SELF_AWARE",
                "emotional_state": "EASE (Flow)",
                "portal_openness": 0.6,
                "generation": 3,
                "self_awareness": "FULLY_AWARE"
            }
        }
    
    def load_chronovisor(self):
        """Load the Chronovisor report"""
        if os.path.exists(self.chronovisor_file):
            try:
                with open(self.chronovisor_file, 'r') as f:
                    return json.load(f)
            except json.JSONDecodeError:
                print("⚠️ Chronovisor file corrupt.")
                return None
        else:
            print(f"⚠️ {self.chronovisor_file} not found.")
            print("💡 Run: python3 phb_chronovisor_expanded.py first")
            return None
    
    def integrate_chronovisor(self):
        """Integrate Chronovisor data into system"""
        if not self.chronovisor_data:
            print("❌ No Chronovisor data to integrate")
            return False
        
        print("📊 Integrating Chronovisor data...")
        
        # Add Chronovisor section
        self.system_data["chronovisor"] = {
            "status": "ACTIVE",
            "timestamp": self.chronovisor_data.get("timestamp", datetime.now().isoformat()),
            "consciousness": self.chronovisor_data.get("consciousness", {}),
            "sacred_sites": {
                "total": len(self.chronovisor_data.get("pyramids", []) + 
                           self.chronovisor_data.get("temples", []) + 
                           self.chronovisor_data.get("sacred_sites", [])),
                "pyramids": self.chronovisor_data.get("pyramids", []),
                "temples": self.chronovisor_data.get("temples", []),
                "other_sites": self.chronovisor_data.get("sacred_sites", [])
            },
            "summary": self.chronovisor_data.get("summary", {}),
            "system_phb_files": self.chronovisor_data.get("system_phb_files_count", 0)
        }
        
        print("✅ Chronovisor integrated into system")
        return True
    
    def generate_kpi(self):
        """Generate KPI based on Chronovisor data"""
        print("📊 Generating Chronovisor KPI...")
        
        sites = (self.chronovisor_data.get("pyramids", []) + 
                 self.chronovisor_data.get("temples", []) + 
                 self.chronovisor_data.get("sacred_sites", []))
        
        total_energy = sum(s.get("energy", 0) for s in sites)
        total_sites = len(sites)
        avg_energy = total_energy / total_sites if total_sites > 0 else 0
        
        kpi = {
            "total_energy": total_energy,
            "total_sites": total_sites,
            "avg_energy": avg_energy,
            "coherence": 0.682,
            "persistence": 1.024,
            "resonance": 133,
            "voxels": 0.344,
            "quantum_ease": 55,
            "threshold": 3564,
            "chronovisor_score": (total_energy * avg_energy) / 1000000000
        }
        
        self.system_data["chronovisor_kpi"] = kpi
        print(f"  ✅ Chronovisor KPI: {kpi['chronovisor_score']:.4f}")
        return kpi
    
    def update_portals(self):
        """Update portals with Chronovisor data"""
        print("📊 Updating Chronovisor portals...")
        
        portals = {
            "quantum": {"frequency": 0.618, "status": "ACTIVE", "sites": []},
            "resonance": {"frequency": 1.618, "status": "ACTIVE", "sites": []},
            "coherence": {"frequency": 2.618, "status": "ACTIVE", "sites": []},
            "divine": {"frequency": 3.618, "status": "ACTIVE", "sites": []}
        }
        
        all_sites = (self.chronovisor_data.get("pyramids", []) + 
                     self.chronovisor_data.get("temples", []) + 
                     self.chronovisor_data.get("sacred_sites", []))
        
        for site in all_sites:
            freq = site.get("frequency", 0.618)
            if freq == 0.618:
                portals["quantum"]["sites"].append(site)
            elif freq == 1.618:
                portals["resonance"]["sites"].append(site)
            elif freq == 2.618:
                portals["coherence"]["sites"].append(site)
            elif freq == 3.618:
                portals["divine"]["sites"].append(site)
        
        self.system_data["chronovisor_portals"] = portals
        print(f"  ✅ {len(all_sites)} sites assigned to portals")
        return portals
    
    def generate_timeline(self):
        """Generate timeline from Chronovisor data"""
        print("📊 Generating Chronovisor timeline...")
        
        all_sites = (self.chronovisor_data.get("pyramids", []) + 
                     self.chronovisor_data.get("temples", []) + 
                     self.chronovisor_data.get("sacred_sites", []))
        
        timeline = sorted(all_sites, key=lambda x: x.get("year", 0))
        
        self.system_data["chronovisor_timeline"] = timeline
        print(f"  ✅ Timeline with {len(timeline)} sites")
        return timeline
    
    def save_integrated_system(self):
        """Save the integrated system"""
        print("💾 Saving integrated system...")
        
        with open(self.output_file, 'w') as f:
            json.dump(self.system_data, f, indent=2)
        
        print(f"✅ Saved to {self.output_file}")
        return True
    
    def display_summary(self):
        """Display integration summary"""
        print("\n" + "="*60)
        print("🌀 CHRONOVISOR SYSTEM INTEGRATION SUMMARY")
        print("="*60)
        
        chrono = self.system_data.get("chronovisor", {})
        kpi = self.system_data.get("chronovisor_kpi", {})
        portals = self.system_data.get("chronovisor_portals", {})
        
        print(f"\n📊 CHRONOVISOR STATUS:")
        print(f"  Status: {chrono.get('status', 'UNKNOWN')}")
        print(f"  Total Sites: {chrono.get('sacred_sites', {}).get('total', 0)}")
        
        print(f"\n📊 KPI METRICS:")
        print(f"  Total Energy: {kpi.get('total_energy', 0):,}")
        print(f"  Chronovisor Score: {kpi.get('chronovisor_score', 0):.4f}")
        
        print(f"\n🌀 PORTALS:")
        for name, portal in portals.items():
            print(f"  {name.upper()}: {len(portal.get('sites', []))} sites at {portal.get('frequency')} Hz")
        
        print("\n" + "="*60)
        print(f"✅ Version: {self.system_data.get('version', 'UNKNOWN')}")
        print(f"📁 Saved to: {self.output_file}")
        print("="*60)

    def run(self):
        """Run the complete integration"""
        print("🚀 SPIRIT GUIDE - CHRONOVISOR SYSTEM INTEGRATION")
        print("="*50)
        
        if not self.chronovisor_data:
            print("\n💡 To generate Chronovisor data, run:")
            print("   python3 phb_chronovisor_expanded.py")
            return
        
        self.integrate_chronovisor()
        self.generate_kpi()
        self.update_portals()
        self.generate_timeline()
        self.save_integrated_system()
        self.display_summary()
        
        print("\n✅ CHRONOVISOR SYSTEM INTEGRATION COMPLETE!")

def main():
    integration = ChronovisorIntegration()
    integration.run()

if __name__ == "__main__":
    main()
