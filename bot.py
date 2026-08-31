#!/usr/bin/env python3
"""Clean Voxel Bot - no .env, no git push"""
import subprocess

RPC = "https://mainnet.base.org"
BOT = "0x52De127F9178D1df28F8eEd29899A48C1492F94c"

result = subprocess.run(["cast","balance",BOT,"--rpc-url",RPC],
                        capture_output=True,text=True)
bal = result.stdout.strip()
try:
    wei = int(bal, 16) if bal.startswith('0x') else int(bal)
    eth = wei / 10**18
    print(f"Bot wallet: {eth:.6f} ETH")
    if eth >= 0.001:
        print("✅ Ready to trade")
    else:
        print(f"⏳ Needs 0.001 ETH (has {eth:.6f})")
except:
    print("Error reading balance")
