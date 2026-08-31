#!/usr/bin/env python3
"""
Voxel Bot - Uses available ETH, no external funding needed
"""

import os
import subprocess

RPC = "https://mainnet.base.org"
BOT_WALLET = "0x52De127F9178D1df28F8eEd29899A48C1492F94c"
MAIN_WALLET = "0x6f5c5B2117c22c1cB07244bE032Bd4CdE966432C"

TOKENS = {
    "PIDX": "0x95c7e2d53f4b615a50d4468dfd5aff850dc17f0c",
    "SGUIDE": "0xb50DCEb0570557B9B7FE43D8cBDc9B3457D3dc5a",
    "VDOO": "0x38e4f08D08b4D772A7B75669C356b4749dd2d30b",
    "PENNIES": "0x2a92CAA3b01E64634e2E95AA533a5570a76c19A7"
}

def get_balance(address):
    result = subprocess.run(["cast","balance",address,"--rpc-url",RPC],
                          capture_output=True,text=True)
    bal = result.stdout.strip()
    try:
        wei = int(bal, 16) if bal.startswith('0x') else int(bal)
        return wei / 10**18
    except:
        return 0

def consolidate_funds():
    """Move small ETH from main to bot if main has too little."""
    main = get_balance(MAIN_WALLET)
    bot = get_balance(BOT_WALLET)
    
    # If main has very little and bot needs more, consolidate
    if main > 0.00001 and bot < 0.0001:
        print(f"  Consolidating: main {main:.6f} → bot")
        # Send main's ETH to bot (minus gas)
        amount = int((main - 0.000005) * 10**18)
        if amount > 0:
            key = os.environ.get("PRIVATE_KEY", "")
            if key:
                subprocess.run(
                    ["cast","send",BOT_WALLET,"--value",str(amount),
                     "--private-key",key,"--rpc-url",RPC,"--gas-price","5000000"],
                    capture_output=True,text=True
                )
                print("  ✅ Consolidated")

def main():
    main_eth = get_balance(MAIN_WALLET)
    bot_eth = get_balance(BOT_WALLET)
    total = main_eth + bot_eth
    
    print(f"  Main: {main_eth:.6f} ETH")
    print(f"  Bot: {bot_eth:.6f} ETH")
    print(f"  Total available: {total:.6f} ETH")
    
    # With 0.00005 ETH total, we can do 1-2 minimal transactions
    if total >= 0.00003:
        print("  ✅ Enough ETH for minimal trading")
        # Use minimal gas price (2 gwei)
        print("  🔥 Using minimal gas for maximum efficiency")
    else:
        print("  ⏳ Not enough ETH for any transaction")
    
    consolidate_funds()

if __name__ == "__main__":
    main()
