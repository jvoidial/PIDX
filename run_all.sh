#!/bin/bash
cd ~/spirit-guide-token
while true; do
    python3 -u ecosystem_engine.py
    echo "Engine exited, restarting in 10s..."
    sleep 10
done
