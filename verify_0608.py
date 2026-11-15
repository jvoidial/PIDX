import time, requests
API_KEY = "***REMOVED***"
CONTRACT = "0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD"
CHAIN = "8453"
VER = "v0.8.20+commit.a1b79de6"

with open("PIDX_source.sol" if __import__("os").path.exists("PIDX_source.sol") else "contracts/PIDXLocker.sol", "r") as f:
    SRC = f.read()

url = f"https://api.etherscan.io/v2/api?chainid={CHAIN}"
r = requests.post(url, data={
    "apikey": API_KEY, "module": "contract", "action": "verifysourcecode",
    "contractaddress": CONTRACT, "sourceCode": SRC, "codeformat": "solidity-single-file",
    "contractname": "PIDXLocker", "compilerversion": VER,
    "optimizationUsed": "0", "runs": "200", "evmversion": "shanghai", "licenseType": "3"
}).json()

if r.get("status") == "1":
    guid = r["result"]
    print(f"✅ Submitted. GUID: {guid}")
    for i in range(20):
        time.sleep(6)
        s = requests.get(f"https://api.etherscan.io/v2/api?chainid={CHAIN}&module=contract&action=checkverifystatus&guid={guid}&apikey={API_KEY}").json()
        res = s.get("result", "")
        print(f"   [{i+1}/20] {res}")
        if "Pass - Verified" in res:
            print("🎉 VERIFIED!")
            break
        if "Fail" in res:
            break
else:
    print(f"❌ {r.get('result')}")
