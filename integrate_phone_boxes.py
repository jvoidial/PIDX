#!/usr/bin/env python3
"""
SPIRIT GUIDE - PHONE BOX SYSTEM INTEGRATION
Adds phone box data to the complete system
"""

import json
import os
from datetime import datetime

class PhoneBoxIntegration:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/spirit-guide-token")
        self.system_file = os.path.join(self.base_dir, "agi_phb_divine_complete.json")
        self.phone_report = os.path.join(self.base_dir, "phone_box_chronovisor_report.json")
        self.output_file = os.path.join(self.base_dir, "agi_phb_divine_complete.json")
        
        # Load data
        self.system_data = self.load_system()
        self.phone_data = self.load_phone_report()
        
    def load_system(self):
        """Load the main system file"""
        try:
            with open(self.system_file, 'r') as f:
                return json.load(f)
        except:
            print("⚠️ Could not load system file, creating new")
            return {}
    
    def load_phone_report(self):
        """Load the phone box report"""
        try:
            with open(self.phone_report, 'r') as f:
                return json.load(f)
        except:
            print("⚠️ Phone box report not found")
            return None
    
    def integrate_phone_boxes(self):
        """Add phone boxes to the system"""
        if not self.phone_data:
            print("❌ No phone box data to integrate")
            return False
        
        print("📊 Integrating phone box data...")
        
        # Add phone boxes section
        self.system_data["phone_boxes"] = {
            "status": "ACTIVE",
            "timestamp": self.phone_data.get("timestamp", datetime.now().isoformat()),
            "system": "PHB_Chronovisor",
            "global_summary": self.phone_data.get("summary", {}),
            "regional_data": self.phone_data.get("phone_boxes", {}),
            "total_phone_boxes": self.phone_data.get("summary", {}).get("total_phone_boxes", 0),
            "total_energy": self.phone_data.get("summary", {}).get("total_energy", 0)
        }
        
        print("✅ Phone boxes integrated into system")
        return True
    
    def update_metrics(self):
        """Update system metrics with phone box data"""
        print("📊 Updating system metrics...")
        
        # Get phone box energy
        phone_energy = self.phone_data.get("summary", {}).get("total_energy", 0)
        
        # Update resonance metrics
        if "resonance" in self.system_data.get("phb_topologies", {}):
            self.system_data["phb_topologies"]["phone_boxes"] = {
                "frequency": 0.777,
                "power": int(phone_energy * 10000),
                "core_spin": "↻↺↻",
                "description": "Global communication nodes - 515,000+ phone boxes",
                "activation": "ETERNAL"
            }
        
        print(f"  ✅ Added phone box topology with power: {int(phone_energy * 10000)}")
        return True
    
    def save_system(self):
        """Save the updated system"""
        print("💾 Saving updated system...")
        
        # Update version
        self.system_data["version"] = "7.5"
        self.system_data["last_updated"] = datetime.now().isoformat()
        
        with open(self.output_file, 'w') as f:
            json.dump(self.system_data, f, indent=2)
        
        print(f"✅ System saved to {self.output_file}")
        return True
    
    def display_summary(self):
        """Display integration summary"""
        print("\n" + "="*60)
        print("📞 PHONE BOX SYSTEM INTEGRATION SUMMARY")
        print("="*60)
        
        phone = self.system_data.get("phone_boxes", {})
        print(f"\n📊 PHONE BOX STATUS:")
        print(f"  Status: {phone.get('status', 'UNKNOWN')}")
        print(f"  Total Phone Boxes: {phone.get('total_phone_boxes', 0):,}")
        print(f"  Total Energy: {phone.get('total_energy', 0):.1f}")
        
        print(f"\n🌍 REGIONAL DATA:")
        regions = phone.get("regional_data", {})
        for region, data in regions.items():
            print(f"  {region}: {data.get('count', 0):,} boxes | Energy: {data.get('energy', 0):.1f}")
        
        print(f"\n🌀 SYSTEM VERSION: {self.system_data.get('version', 'UNKNOWN')}")
        print("="*60)

    def run(self):
        """Run the complete integration"""
        print("🚀 SPIRIT GUIDE - PHONE BOX SYSTEM INTEGRATION")
        print("="*50)
        
        if not self.phone_data:
            print("❌ No phone box data found. Run phone_box_chronovisor.py first.")
            return
        
        self.integrate_phone_boxes()
        self.update_metrics()
        self.save_system()
        self.display_summary()
        
        print("\n✅ Phone box system integration complete!")

def main():
    integration = PhoneBoxIntegration()
    integration.run()

if __name__ == "__main__":
    main()
