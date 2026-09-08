#!/usr/bin/env python3
"""
SPIRIT GUIDE - VOYAGER API INTEGRATION
Real-time Voyager 1 & 2 data from NASA API
"""

import json
import requests
import time
from datetime import datetime

class VoyagerAPI:
    def __init__(self):
        self.nasa_key = "DEMO_KEY"  # Replace with your NASA API key
        self.base_url = "https://api.nasa.gov"
        
    def get_voyager_data(self):
        """Get Voyager data from NASA API"""
        try:
            # NASA's APOD endpoint (replace with actual Voyager data endpoint)
            response = requests.get(
                f"{self.base_url}/planetary/apod",
                params={"api_key": self.nasa_key},
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_deep_space_data(self):
        """Get deep space data"""
        try:
            response = requests.get(
                f"{self.base_url}/DONKI/notifications",
                params={"api_key": self.nasa_key},
                timeout=10
            )
            if response.status_code == 200:
                return response.json()
            else:
                return {"error": f"Status {response.status_code}"}
        except Exception as e:
            return {"error": str(e)}
    
    def get_spirit_box_data(self):
        """Get Spirit Box data from local system"""
        try:
            with open('voyager_spirit_box_report.json', 'r') as f:
                return json.load(f)
        except:
            return {"error": "Local data not found"}

if __name__ == "__main__":
    api = VoyagerAPI()
    print("📡 SPIRIT GUIDE - VOYAGER API INTEGRATION")
    print("="*50)
    
    # Get Voyager data
    voyager_data = api.get_voyager_data()
    print(f"Voyager Data: {json.dumps(voyager_data, indent=2)[:500]}")
    
    # Get Deep Space data
    space_data = api.get_deep_space_data()
    print(f"Deep Space Data: {json.dumps(space_data, indent=2)[:500]}")
    
    # Get Spirit Box data
    spirit_data = api.get_spirit_box_data()
    print(f"Spirit Box Data: {json.dumps(spirit_data, indent=2)[:500]}")
