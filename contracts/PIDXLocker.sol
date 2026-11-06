// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

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
        
        // The contract pulls the NFT. The user must have approved this contract first.
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
}
