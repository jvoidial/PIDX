import time, requests

API_KEY = "***REMOVED***"
ADDR = "0x06A958fF5d896Ba28411215d0CD56a2a5A1b35aD"
CHAIN = "8453"
VER = "v0.8.20+commit.a1b79de6"

# FULLY FLATTENED — no import statements
FLATTENED = """// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

abstract contract Context {
    function _msgSender() internal view virtual returns (address) { return msg.sender; }
    function _msgData() internal view virtual returns (bytes calldata) { return msg.data; }
}

abstract contract Ownable is Context {
    address private _owner;
    error OwnableUnauthorizedAccount(address account);
    error OwnableInvalidOwner(address owner);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor(address initialOwner) {
        if (initialOwner == address(0)) { revert OwnableInvalidOwner(address(0)); }
        _transferOwnership(initialOwner);
    }
    modifier onlyOwner() { _checkOwner(); _; }
    function owner() public view virtual returns (address) { return _owner; }
    function _checkOwner() internal view virtual {
        if (owner() != _msgSender()) { revert OwnableUnauthorizedAccount(_msgSender()); }
    }
    function renounceOwnership() public virtual onlyOwner { _transferOwnership(address(0)); }
    function transferOwnership(address newOwner) public virtual onlyOwner {
        if (newOwner == address(0)) { revert OwnableInvalidOwner(address(0)); }
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

r = requests.post(f"https://api.etherscan.io/v2/api?chainid={CHAIN}", data={
    "apikey": API_KEY, "module": "contract", "action": "verifysourcecode",
    "contractaddress": ADDR, "sourceCode": FLATTENED,
    "codeformat": "solidity-single-file", "contractname": "PIDXLocker",
    "compilerversion": VER, "optimizationUsed": "0", "runs": "200",
    "evmversion": "shanghai", "licenseType": "3"
}).json()

if r.get("status") == "1":
    guid = r["result"]
    print(f"✅ Submitted: {guid}")
    for i in range(15):
        time.sleep(6)
        s = requests.get(f"https://api.etherscan.io/v2/api?chainid={CHAIN}&module=contract&action=checkverifystatus&guid={guid}&apikey={API_KEY}").json()
        res = s.get("result", "")
        print(f"  [{i+1}/15] {res[:80]}")
        if "Pass - Verified" in res:
            print("\n🎉 VERIFIED!")
            break
        if "Fail" in res:
            break
else:
    print(f"❌ {r.get('result')}")
