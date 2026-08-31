#!/usr/bin/env python3
"""Secure Voxel Bot - uses env vars directly, no .env file"""
import os
import subprocess

RPC = "https://mainnet.base.org"
BOT_WALLET = "0x52De127F9178D1df28F8eEd29899A48C1492F94c"

def get_balance(address):
    result = subprocess.run(["cast","balance",address,"--rpc-url",RPC],
                          capture_output=True,text=True)
    bal = result.stdout.strip()
    try:
        wei = int(bal, 16) if bal.startswith('0x') else int(bal)
        return wei / 10**18
    except:
        return 0

def main():
    bot_eth = get_balance(BOT_WALLET)
    print(f"Bot wallet: {bot_eth:.6f} ETH")
    print(f"Status: {'✅ Ready' if bot_eth >= 0.001 else '⏳ Needs 0.001 ETH'}")

if __name__ == "__main__":
    main()
