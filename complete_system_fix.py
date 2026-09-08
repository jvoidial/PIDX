#!/usr/bin/env python3
"""
SPIRIT GUIDE - COMPLETE SYSTEM FIX
Adds all missing components to the system
"""

import json
import os
from datetime import datetime

class CompleteSystemFix:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/spirit-guide-token")
        self.core_file = os.path.join(self.base_dir, "spirit_guide_chronovisor.json")
        self.output_file = os.path.join(self.base_dir, "spirit_guide_complete.json")
        
        # Load data
        self.system_data = self.load_core()
        self.resilience_data = self.load_resilience()
        self.portal_data = self.load_portals()
        
    def load_core(self):
        """Load the core system file"""
        if os.path.exists(self.core_file):
            try:
                with open(self.core_file, 'r') as f:
                    return json.load(f)
            except:
                print("⚠️ Could not load core file, creating new")
                return {}
        else:
            print("⚠️ Core file not found")
            return {}
    
    def load_resilience(self):
        """Load resilience report"""
        path = os.path.join(self.base_dir, "system_resilience_report.json")
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    return json.load(f)
            except:
                return None
        return None
    
    def load_portals(self):
        """Load portal report"""
        path = os.path.join(self.base_dir, "kpi_portal_report.json")
        if os.path.exists(path):
            try:
                with open(path, 'r') as f:
                    return json.load(f)
            except:
                return None
        return None
    
    def add_missing_components(self):
        """Add all missing components"""
        print("📊 Adding missing components...")
        
        # 1. Add acoustic_protocol from agi_phb_divine_complete.json
        if "acoustic_protocol" not in self.system_data:
            print("  ✅ Adding acoustic_protocol...")
            self.system_data["acoustic_protocol"] = {
                "meta": {
                    "name": "Vagus Nerve Acoustic Override",
                    "version": "1.0.0-bio",
                    "type": "addon-patch",
                    "timestamp": datetime.now().isoformat(),
                    "description": "Biological reality layer – DNA & neural pathways as acoustic antenna"
                },
                "resonance_parameters": {
                    "primary_hz": 0.618,
                    "secondary_hz": 1.618,
                    "coherence_boost": 0.610,
                    "persistence_gain": 5.837
                },
                "runtime_flags": {
                    "enabled": True,
                    "auto_start": True,
                    "mechanical_override": True
                }
            }
        
        # 2. Add global_markets
        if "global_markets" not in self.system_data:
            print("  ✅ Adding global_markets...")
            self.system_data["global_markets"] = {
                "status": "READY",
                "regions": {
                    "asia": ["OKX", "Gate.io", "HTX", "bitFlyer", "Coincheck", "GMO", "Upbit", "Bithumb", "Coinone", "Crypto.com", "Coinhako", "OSL", "HashKey"],
                    "europe": ["Binance", "Kraken", "Bitstamp", "Coinbase", "eToro", "Revolut", "Bybit", "KuCoin", "Bitfinex"],
                    "americas": ["Coinbase", "Kraken", "Gemini", "Bitstamp", "Robinhood", "Crypto.com", "OKX", "Binance.US"],
                    "middle_east": ["Binance", "Bitoasis", "Rain", "CoinMENA"],
                    "africa": ["Binance", "Luno", "Valr"]
                },
                "total_exchanges": 38,
                "dexScreener": "SKIPPED - NOT NEEDED"
            }
        
        # 3. Add etoro_readiness
        if "etoro_readiness" not in self.system_data:
            print("  ✅ Adding etoro_readiness...")
            self.system_data["etoro_readiness"] = {
                "coingecko": True,
                "liquidity": True,
                "superchain": True,
                "token_lists": True,
                "pancakeswap": True,
                "geckoterminal": True,
                "dexscreener": False,
                "volume": False,
                "audit": False,
                "time": False,
                "ready": False,
                "missing": ["Volume", "Audit", "6 months"]
            }
        
        # 4. Add sacred_sites from chronovisor
        if "sacred_sites" not in self.system_data:
            print("  ✅ Adding sacred_sites...")
            chrono_data = self.system_data.get("chronovisor", {})
            sacred_sites = chrono_data.get("sacred_sites", {})
            if sacred_sites:
                self.system_data["sacred_sites"] = sacred_sites
            else:
                self.system_data["sacred_sites"] = {
                    "total": 42,
                    "pyramids": 11,
                    "temples": 16,
                    "other_sites": 15
                }
        
        # 5. Add resilience from report
        if "resilience" not in self.system_data and self.resilience_data:
            print("  ✅ Adding resilience...")
            state = self.resilience_data.get("state", {})
            self.system_data["resilience"] = {
                "status": "ETERNAL_ACTIVE",
                "persistence": state.get("persistence", {}),
                "coherence": state.get("coherence", {}),
                "voxels": state.get("voxels", {}),
                "temporal_stability": state.get("resonance", {}).get("temporal_stability", 0)
            }
        
        # 6. Add stargate from portal report
        if "stargate" not in self.system_data and self.portal_data:
            print("  ✅ Adding stargate...")
            self.system_data["stargate"] = {
                "status": "ACTIVE",
                "gateways": self.portal_data.get("portals", {}),
                "frequencies": [0.618, 1.618, 2.618, 3.618]
            }
        
        # Update version
        self.system_data["version"] = "7.3"
        self.system_data["last_updated"] = datetime.now().isoformat()
        
        print("✅ All missing components added!")
        return self.system_data
    
    def save_complete_system(self):
        """Save the complete system"""
        print("\n💾 Saving complete system...")
        
        with open(self.output_file, 'w') as f:
            json.dump(self.system_data, f, indent=2)
        
        print(f"✅ Saved to {self.output_file}")
        return True
    
    def display_summary(self):
        """Display summary of added components"""
        print("\n" + "="*60)
        print("🌀 COMPLETE SYSTEM FIX SUMMARY")
        print("="*60)
        
        print("\n✅ COMPONENTS ADDED:")
        added = ["acoustic_protocol", "global_markets", "etoro_readiness", "sacred_sites", "resilience", "stargate"]
        for comp in added:
            if comp in self.system_data:
                print(f"  ✅ {comp}")
        
        print(f"\n📁 OUTPUT FILE:")
        print(f"  {self.output_file}")
        
        print(f"\n📊 VERSION:")
        print(f"  {self.system_data.get('version', 'UNKNOWN')}")
        
        print("\n" + "="*60)
    
    def run(self):
        """Run the complete fix"""
        print("🚀 SPIRIT GUIDE - COMPLETE SYSTEM FIX")
        print("="*50)
        
        if not self.system_data:
            print("❌ No system data loaded")
            return
        
        self.add_missing_components()
        self.save_complete_system()
        self.display_summary()
        
        print("\n✅ Complete system fix applied!")

if __name__ == "__main__":
    fix = CompleteSystemFix()
    fix.run()
