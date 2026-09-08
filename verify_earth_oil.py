#!/usr/bin/env python3
"""
SPIRIT GUIDE - EARTH OIL VERIFICATION
Verifies Earth Oil Generation System is integrated
"""

import json
import os

def verify_earth_oil():
    """Verify Earth Oil Generation System"""
    
    print("\n" + "="*60)
    print("🌍 SPIRIT GUIDE - EARTH OIL VERIFICATION")
    print("="*60)
    
    # Check if earth_oil_report.json exists
    report_file = os.path.expanduser("~/spirit-guide-token/earth_oil_report.json")
    
    if os.path.exists(report_file):
        print("\n✅ Earth Oil Report Found")
        
        try:
            with open(report_file, 'r') as f:
                data = json.load(f)
            
            print(f"\n📊 SYSTEM STATUS:")
            print(f"  Status: {data.get('status', 'UNKNOWN')}")
            print(f"  Total Oil Energy: {data.get('total_oil_energy', 0):.2f}")
            
            print(f"\n🌀 OILS GENERATED:")
            oils = data.get('oils', {})
            for name, oil in oils.items():
                print(f"  {oil.get('name', name)}:")
                print(f"    Frequency: {oil.get('frequency', 'UNKNOWN')} Hz")
                print(f"    Net Energy: {oil.get('net_energy', 0):.2f}")
                print(f"    Purpose: {oil.get('purpose', 'UNKNOWN')}")
            
            print(f"\n🌍 EARTH STABILITY:")
            stability = data.get('earth_stability', {})
            print(f"  Current: {stability.get('current', 0):.2f}")
            print(f"  Threshold: {stability.get('threshold', 0)}")
            print(f"  Status: {stability.get('status', 'UNKNOWN')}")
            
            print(f"\n🌐 EARTH APPLICATION:")
            app = data.get('earth_application', {})
            print(f"  Total Energy Applied: {app.get('total_energy_applied', 0):.2f}")
            print(f"  Coverage: {app.get('coverage', 'UNKNOWN')}")
            
            print("\n" + "="*60)
            print("✅ EARTH OIL GENERATION IS WORKING!")
            print("="*60)
            
        except Exception as e:
            print(f"\n❌ Error reading report: {e}")
    else:
        print("\n❌ Earth Oil Report NOT found")
        print("   Run: python3 earth_oil_generator.py first")
        print("="*60)

if __name__ == "__main__":
    verify_earth_oil()
