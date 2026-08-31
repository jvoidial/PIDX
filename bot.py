#!/usr/bin/env python3
"""Clean bot - no .env, no push"""
import subprocess

RPC = "https://mainnet.base.org"
BOT = "0x52De127F9178D1df28F8eEd29899A48C1492F94c"

result = subprocess.run(["cast","balance",BOT,"--rpc-url",RPC],
                        capture_output=True,text=True)
bal = result.stdout.strip()
try:
    wei = int(bal, 16) if bal.startswith('0x') else int(bal)
    eth = wei / 10**18
    print(f"Bot: {eth:.6f} ETH")
    print(f"{'✅ Ready' if eth >= 0.001 else '⏳ Needs 0.001 ETH'}")
except:
    print("Could not read balance")
