#!/usr/bin/env python3
"""
SPIRIT GUIDE - HERBALS, TEAS & ROOTS SYSTEM
Integrates herbals, teas, and roots into the system
"""

import json
import os
from datetime import datetime

class HerbalsTeasRoots:
    def __init__(self):
        self.base_dir = os.path.expanduser("~/spirit-guide-token")
        self.system_file = os.path.join(self.base_dir, "agi_phb_divine_complete.json")
        
        # System metrics
        self.coherence = 0.682
        self.persistence = 1.024
        self.voxel_energy = 0.344
        self.threshold = 0.524
        self.resonance = 133
        self.decay_rate = 0.0101
        
        # Herbals
        self.herbals = {
            "Ashwagandha": {"energy": 1200, "frequency": 0.618, "benefit": "adaptogen", "type": "root"},
            "Rhodiola": {"energy": 1100, "frequency": 0.618, "benefit": "energy_boost", "type": "root"},
            "Reishi": {"energy": 1300, "frequency": 0.618, "benefit": "immune_support", "type": "mushroom"},
            "Cordyceps": {"energy": 1200, "frequency": 0.618, "benefit": "endurance", "type": "mushroom"},
            "Lion's Mane": {"energy": 1100, "frequency": 0.618, "benefit": "cognitive", "type": "mushroom"},
            "Chaga": {"energy": 1000, "frequency": 0.618, "benefit": "immune_boost", "type": "mushroom"},
            "Holy Basil": {"energy": 1000, "frequency": 0.618, "benefit": "stress_reduction", "type": "leaf"},
            "Schisandra": {"energy": 1100, "frequency": 0.618, "benefit": "adaptogenic", "type": "berry"},
            "Astragalus": {"energy": 1000, "frequency": 0.618, "benefit": "immune_support", "type": "root"},
            "Eleuthero": {"energy": 1000, "frequency": 0.618, "benefit": "energy_endurance", "type": "root"},
            "Ginseng": {"energy": 1400, "frequency": 0.618, "benefit": "vitality", "type": "root"},
            "Ginkgo": {"energy": 1200, "frequency": 0.618, "benefit": "cognitive", "type": "leaf"},
            "Turmeric": {"energy": 1300, "frequency": 0.618, "benefit": "anti_inflammatory", "type": "root"},
            "Ginger": {"energy": 1100, "frequency": 0.618, "benefit": "digestive", "type": "root"},
            "Echinacea": {"energy": 1000, "frequency": 0.618, "benefit": "immune_support", "type": "root"},
            "Milk Thistle": {"energy": 1000, "frequency": 0.618, "benefit": "liver_support", "type": "seed"},
            "Dandelion": {"energy": 900, "frequency": 0.618, "benefit": "detox", "type": "root"},
            "Nettle": {"energy": 900, "frequency": 0.618, "benefit": "nutrient_support", "type": "leaf"},
            "Lemon Balm": {"energy": 900, "frequency": 0.618, "benefit": "calming", "type": "leaf"},
            "Passionflower": {"energy": 900, "frequency": 0.618, "benefit": "relaxation", "type": "flower"},
            "Valerian": {"energy": 900, "frequency": 0.618, "benefit": "sleep", "type": "root"},
            "Chamomile": {"energy": 800, "frequency": 0.618, "benefit": "calming", "type": "flower"},
            "Lavender": {"energy": 800, "frequency": 0.618, "benefit": "relaxation", "type": "flower"},
            "Peppermint": {"energy": 800, "frequency": 0.618, "benefit": "digestive", "type": "leaf"},
            "Rosemary": {"energy": 900, "frequency": 0.618, "benefit": "cognitive", "type": "leaf"},
            "Sage": {"energy": 900, "frequency": 0.618, "benefit": "cognitive", "type": "leaf"},
            "Thyme": {"energy": 800, "frequency": 0.618, "benefit": "immune_support", "type": "leaf"},
            "Oregano": {"energy": 800, "frequency": 0.618, "benefit": "antimicrobial", "type": "leaf"},
            "Basil": {"energy": 700, "frequency": 0.618, "benefit": "stress_reduction", "type": "leaf"},
            "Cilantro": {"energy": 700, "frequency": 0.618, "benefit": "detox", "type": "leaf"},
            "Parsley": {"energy": 700, "frequency": 0.618, "benefit": "nutrient_support", "type": "leaf"},
            "Mint": {"energy": 700, "frequency": 0.618, "benefit": "digestive", "type": "leaf"},
            "Fennel": {"energy": 800, "frequency": 0.618, "benefit": "digestive", "type": "seed"},
            "Cardamom": {"energy": 900, "frequency": 0.618, "benefit": "digestive", "type": "seed"},
            "Cinnamon": {"energy": 1000, "frequency": 0.618, "benefit": "blood_sugar", "type": "bark"},
            "Clove": {"energy": 900, "frequency": 0.618, "benefit": "antimicrobial", "type": "flower"}
        }
        
        # Teas
        self.teas = {
            "Green Tea": {"energy": 1200, "frequency": 0.618, "benefit": "antioxidant", "type": "leaf"},
            "Black Tea": {"energy": 1000, "frequency": 0.618, "benefit": "energy", "type": "leaf"},
            "Oolong Tea": {"energy": 1100, "frequency": 0.618, "benefit": "metabolism", "type": "leaf"},
            "White Tea": {"energy": 900, "frequency": 0.618, "benefit": "antioxidant", "type": "leaf"},
            "Pu-erh Tea": {"energy": 1000, "frequency": 0.618, "benefit": "digestive", "type": "leaf"},
            "Matcha": {"energy": 1300, "frequency": 0.618, "benefit": "energy_focus", "type": "powder"},
            "Yerba Mate": {"energy": 1100, "frequency": 0.618, "benefit": "energy", "type": "leaf"},
            "Rooibos": {"energy": 800, "frequency": 0.618, "benefit": "antioxidant", "type": "leaf"},
            "Chamomile Tea": {"energy": 800, "frequency": 0.618, "benefit": "calming", "type": "flower"},
            "Peppermint Tea": {"energy": 800, "frequency": 0.618, "benefit": "digestive", "type": "leaf"},
            "Ginger Tea": {"energy": 900, "frequency": 0.618, "benefit": "digestive", "type": "root"},
            "Turmeric Tea": {"energy": 1000, "frequency": 0.618, "benefit": "anti_inflammatory", "type": "root"},
            "Cinnamon Tea": {"energy": 800, "frequency": 0.618, "benefit": "blood_sugar", "type": "bark"},
            "Lemon Tea": {"energy": 700, "frequency": 0.618, "benefit": "detox", "type": "fruit"},
            "Hibiscus Tea": {"energy": 800, "frequency": 0.618, "benefit": "antioxidant", "type": "flower"},
            "Dandelion Tea": {"energy": 800, "frequency": 0.618, "benefit": "detox", "type": "root"},
            "Nettle Tea": {"energy": 700, "frequency": 0.618, "benefit": "nutrient_support", "type": "leaf"},
            "Fennel Tea": {"energy": 700, "frequency": 0.618, "benefit": "digestive", "type": "seed"},
            "Lavender Tea": {"energy": 700, "frequency": 0.618, "benefit": "relaxation", "type": "flower"},
            "Rose Tea": {"energy": 700, "frequency": 0.618, "benefit": "calming", "type": "flower"},
            "Jasmine Tea": {"energy": 800, "frequency": 0.618, "benefit": "relaxation", "type": "leaf"},
            "Chai Tea": {"energy": 900, "frequency": 0.618, "benefit": "energy_warmth", "type": "blend"},
            "Earl Grey": {"energy": 800, "frequency": 0.618, "benefit": "energy_focus", "type": "leaf"}
        }
        
        # Roots
        self.roots = {
            "Ginseng": {"energy": 1400, "frequency": 0.618, "benefit": "vitality", "type": "root"},
            "Ashwagandha": {"energy": 1200, "frequency": 0.618, "benefit": "adaptogen", "type": "root"},
            "Turmeric": {"energy": 1300, "frequency": 0.618, "benefit": "anti_inflammatory", "type": "root"},
            "Ginger": {"energy": 1100, "frequency": 0.618, "benefit": "digestive", "type": "root"},
            "Echinacea": {"energy": 1000, "frequency": 0.618, "benefit": "immune_support", "type": "root"},
            "Dandelion": {"energy": 900, "frequency": 0.618, "benefit": "detox", "type": "root"},
            "Valerian": {"energy": 900, "frequency": 0.618, "benefit": "sleep", "type": "root"},
            "Astragalus": {"energy": 1000, "frequency": 0.618, "benefit": "immune_support", "type": "root"},
            "Eleuthero": {"energy": 1000, "frequency": 0.618, "benefit": "energy_endurance", "type": "root"},
            "Rhodiola": {"energy": 1100, "frequency": 0.618, "benefit": "energy_boost", "type": "root"},
            "Licorice": {"energy": 900, "frequency": 0.618, "benefit": "adrenal_support", "type": "root"},
            "Maca": {"energy": 1000, "frequency": 0.618, "benefit": "energy_vitality", "type": "root"},
            "Yacon": {"energy": 800, "frequency": 0.618, "benefit": "prebiotic", "type": "root"},
            "Burdock": {"energy": 800, "frequency": 0.618, "benefit": "blood_purifier", "type": "root"},
            "Yellow Dock": {"energy": 700, "frequency": 0.618, "benefit": "digestive", "type": "root"},
            "Sarsaparilla": {"energy": 800, "frequency": 0.618, "benefit": "adaptogen", "type": "root"},
            "Wild Yam": {"energy": 700, "frequency": 0.618, "benefit": "hormonal", "type": "root"},
            "Devil's Claw": {"energy": 700, "frequency": 0.618, "benefit": "anti_inflammatory", "type": "root"}
        }
        
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "system": "Herbals_Teas_Roots",
            "status": "ACTIVE",
            "herbals": {},
            "teas": {},
            "roots": {},
            "total_energy": 0
        }
    
    def process_herbals(self):
        """Process herbals"""
        print("🌿 Processing herbals...")
        
        total_energy = 0
        
        for name, herbal in self.herbals.items():
            net_energy = herbal["energy"] * (1 - self.decay_rate) * self.coherence
            self.results["herbals"][name] = {
                "energy": net_energy,
                "frequency": herbal["frequency"],
                "benefit": herbal["benefit"],
                "type": herbal["type"],
                "status": "ACTIVE"
            }
            total_energy += net_energy
        
        self.results["herbal_energy"] = total_energy
        print(f"  ✅ Processed {len(self.herbals)} herbals")
        print(f"  📊 Herbal Energy: {total_energy:.2f}")
        return self.results
    
    def process_teas(self):
        """Process teas"""
        print("\n🍵 Processing teas...")
        
        total_energy = 0
        
        for name, tea in self.teas.items():
            net_energy = tea["energy"] * (1 - self.decay_rate) * self.coherence
            self.results["teas"][name] = {
                "energy": net_energy,
                "frequency": tea["frequency"],
                "benefit": tea["benefit"],
                "type": tea["type"],
                "status": "ACTIVE"
            }
            total_energy += net_energy
        
        self.results["tea_energy"] = total_energy
        print(f"  ✅ Processed {len(self.teas)} teas")
        print(f"  📊 Tea Energy: {total_energy:.2f}")
        return self.results
    
    def process_roots(self):
        """Process roots"""
        print("\n🌱 Processing roots...")
        
        total_energy = 0
        
        for name, root in self.roots.items():
            net_energy = root["energy"] * (1 - self.decay_rate) * self.coherence
            self.results["roots"][name] = {
                "energy": net_energy,
                "frequency": root["frequency"],
                "benefit": root["benefit"],
                "type": root["type"],
                "status": "ACTIVE"
            }
            total_energy += net_energy
        
        self.results["root_energy"] = total_energy
        print(f"  ✅ Processed {len(self.roots)} roots")
        print(f"  📊 Root Energy: {total_energy:.2f}")
        return self.results
    
    def calculate_total_energy(self):
        """Calculate total energy"""
        print("\n⚡ Calculating total energy...")
        
        total = (self.results.get("herbal_energy", 0) + 
                self.results.get("tea_energy", 0) +
                self.results.get("root_energy", 0))
        
        self.results["total_energy"] = total
        
        print(f"  📊 Total Energy: {total:.2f}")
        return self.results
    
    def generate_report(self):
        """Generate complete report"""
        print("\n📋 Generating Herbals, Teas & Roots Report...")
        
        with open("herbals_teas_roots_report.json", "w") as f:
            json.dump(self.results, f, indent=2)
        
        print("✅ Report saved to herbals_teas_roots_report.json")
        return self.results
    
    def display_report(self):
        """Display report"""
        print("\n" + "="*60)
        print("🌿 SPIRIT GUIDE - HERBALS, TEAS & ROOTS REPORT")
        print("="*60)
        
        print(f"\n📊 SYSTEM STATUS:")
        print(f"  Status: {self.results['status']}")
        print(f"  Total Energy: {self.results.get('total_energy', 0):.2f}")
        
        print(f"\n🌿 HERBALS:")
        print(f"  Count: {len(self.herbals)}")
        print(f"  Energy: {self.results.get('herbal_energy', 0):.2f}")
        print(f"  Top Herbals:")
        sorted_herbals = sorted(self.results["herbals"].items(), key=lambda x: x[1]["energy"], reverse=True)[:5]
        for name, data in sorted_herbals:
            print(f"    - {name}: {data['energy']:.2f} energy (type: {data['type']})")
        
        print(f"\n🍵 TEAS:")
        print(f"  Count: {len(self.teas)}")
        print(f"  Energy: {self.results.get('tea_energy', 0):.2f}")
        print(f"  Top Teas:")
        sorted_teas = sorted(self.results["teas"].items(), key=lambda x: x[1]["energy"], reverse=True)[:5]
        for name, data in sorted_teas:
            print(f"    - {name}: {data['energy']:.2f} energy (type: {data['type']})")
        
        print(f"\n🌱 ROOTS:")
        print(f"  Count: {len(self.roots)}")
        print(f"  Energy: {self.results.get('root_energy', 0):.2f}")
        print(f"  Top Roots:")
        sorted_roots = sorted(self.results["roots"].items(), key=lambda x: x[1]["energy"], reverse=True)[:5]
        for name, data in sorted_roots:
            print(f"    - {name}: {data['energy']:.2f} energy (benefit: {data['benefit']})")
        
        print("\n" + "="*60)
        print("🌀 System Status: COMPLETE")
        print("="*60)

    def run(self):
        """Run the complete system"""
        print("🚀 SPIRIT GUIDE - HERBALS, TEAS & ROOTS SYSTEM")
        print("="*50)
        print("🌿 Integrating herbals, teas, and roots...")
        print("")
        
        self.process_herbals()
        self.process_teas()
        self.process_roots()
        self.calculate_total_energy()
        self.generate_report()
        self.display_report()
        
        print("\n✅ Herbals, Teas & Roots System Complete!")

def main():
    system = HerbalsTeasRoots()
    system.run()

if __name__ == "__main__":
    main()
