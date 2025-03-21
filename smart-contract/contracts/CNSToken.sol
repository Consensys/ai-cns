//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.19;

import { AccessControl } from "@openzeppelin/contracts/access/AccessControl.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract CNSToken is ERC20, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    uint256 public constant DAILY_MINT_LIMIT = 100 * 10 ** 18; // 100 CNS tokens per day
    uint256 public lastMintBlock;
    uint256 public mintedToday;
    uint256 private constant BLOCKS_PER_DAY = 42772; // Approx. for Linea Sepolia Testnet

    constructor(address defaultAdmin, address minter) ERC20("CNS Token", "CNS") {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
    }

    function mint(address to, uint256 amount) public onlyRole(MINTER_ROLE) {
        require(amount > 0, "Mint amount must be greater than zero");
        require(amount <= DAILY_MINT_LIMIT, "Cannot mint more than daily limit");
        if (block.number >= lastMintBlock + BLOCKS_PER_DAY) {
            mintedToday = 0;
            lastMintBlock = block.number;
        }
        require(mintedToday + amount <= DAILY_MINT_LIMIT, "Exceeds daily mint limit");
        mintedToday += amount;
        _mint(to, amount);
    }
}
