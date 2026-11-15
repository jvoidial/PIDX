import time
import requests

# --- Configuration ---
API_KEY = "***REMOVED***"
CONTRACT_ADDRESS = "0x01830E8ffA9c0a5d4c61C79aa642b18836F871b3"
COMPILER_VERSION = "v0.8.38+commit.9f9d1c2c"  # Matches the '08260033' metadata
CHAIN_ID = "8453"  # Base Mainnet

# The exact flattened source code
SOURCE_CODE = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }
    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

abstract contract Ownable is Context {
    address private _owner;
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(initialOwner);
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }
    function owner() public view virtual returns (address) {
        return _owner;
    }
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) {
            revert OwnableUnauthorizedAccount(_msgSender());
        }
    }
    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) {
            revert OwnableInvalidOwner(address(0));
        }
        _transferOwnership(newOwner);
    }
    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

interface IERC721 {
    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);
    function balanceOf(address owner) external view returns (uint256 balance);
    function ownerOf(uint256 tokenId) external view returns (address owner);
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external;
    function safeTransferFrom(address from, address to, uint256 tokenId) external;
    function transferFrom(address from, address to, uint256 tokenId) external;
    function approve(address to, uint256 tokenId) external;
    function setApprovalForAll(address operator, bool approved) external;
    function getApproved(uint256 tokenId) external view returns (address operator);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
}

interface IERC721Receiver {
    function onERC721Received(address operator, address from, uint256 tokenId, bytes calldata data) external returns (bytes4);
}

contract PIDXLocker is IERC721Receiver, Ownable {
    struct LockData {
        address owner;
        uint256 unlockTime;
        bool isLocked;
    }
    mapping(address => mapping(uint256 => LockData)) public locks;
    event PositionLocked(address indexed nftContract, uint256 indexed tokenId, address indexed owner, uint256 unlockTime);
    event PositionWithdrawn(address indexed nftContract, uint256 indexed tokenId, address indexed owner);

    constructor() Ownable(msg.sender) {}

    function lockPosition(address nftContract, uint256 tokenId, uint256 lockDuration) external {
        IERC721 nft = IERC721(nftContract);
        require(nft.ownerOf(tokenId) == msg.sender, "Not your NFT");
        require(lockDuration >= 1 days, "Min 1 day");
        nft.safeTransferFrom(msg.sender, address(this), tokenId);
        locks[nftContract][tokenId] = LockData(msg.sender, block.timestamp + lockDuration, true);
        emit PositionLocked(nftContract, tokenId, msg.sender, block.timestamp + lockDuration);
    }

    function withdrawPosition(address nftContract, uint256 tokenId) external {
        LockData memory data = locks[nftContract][tokenId];
        require(data.isLocked && data.owner == msg.sender, "Not locked by you");
        require(block.timestamp >= data.unlockTime, "Still locked");
        delete locks[nftContract][tokenId];
        IERC721(nftContract).safeTransferFrom(address(this), msg.sender, tokenId);
        emit PositionWithdrawn(nftContract, tokenId, msg.sender);
    }

    function onERC721Received(address, address, uint256, bytes calldata) external pure override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}"""

# V2 API Base URL
BASE_URL = "https://api.etherscan.io/v2/api"

def verify():
    print("🚀 Submitting verification to Etherscan V2 API (Base)...")
    
    payload = {
        "apikey": API_KEY,
        "module": "contract",
        "action": "verifysourcecode",
        "contractaddress": CONTRACT_ADDRESS,
        "sourceCode": SOURCE_CODE,
        "codeformat": "solidity-single-file",
        "contractname": "PIDXLocker",
        "compilerversion": COMPILER_VERSION,
        "optimizationUsed": "0",
        "runs": "200",
        "evmversion": "shanghai",
        "licenseType": "3",  # MIT License
        "chainid": CHAIN_ID
    }

    # Send POST request to the V2 endpoint
    response = requests.post(BASE_URL, data=payload).json()

    if response.get("status") == "1":
        guid = response.get("result")
        print(f"✅ Code submitted successfully! GUID: {guid}")
        print("⏳ Waiting for BaseScan to compile and verify...")

        for i in range(20):
            time.sleep(5)
            check_params = {
                "apikey": API_KEY,
                "module": "contract",
                "action": "checkverifystatus",
                "guid": guid,
                "chainid": CHAIN_ID
            }
            check_res = requests.get(BASE_URL, params=check_params).json()
            result = check_res.get("result", "")

            if result == "Pass - Verified":
                print("\n🎉 SUCCESS! Contract is now verified on BaseScan!")
                return
            elif "Pending" in result:
                print(f"   Still processing... ({i+1}/20)")
            elif "Fail" in result or "Error" in result:
                print(f"\n❌ Verification failed: {result}")
                return

        print("\n⚠️ Verification is taking longer than expected. Check BaseScan manually.")
    else:
        print(f"\n❌ Error submitting code: {response.get('result')}")
        if "Already Verified" in str(response.get('result')):
            print("Note: The contract is already verified.")

if __name__ == "__main__":
    verify()
