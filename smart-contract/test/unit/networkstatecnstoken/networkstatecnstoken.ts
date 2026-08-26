import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../../common/types";

const DAILY_MINT_LIMIT = ethers.parseEther("100");

async function deployCNSTokenFixture() {
  const [admin, minter, user1] = await ethers.getSigners();

  const CNSTokenFactory = await ethers.getContractFactory("CNSToken");
  const cnsToken = await CNSTokenFactory.deploy(admin.address, minter.address);

  return { cnsToken, admin, minter, user1 };
}

describe("CNSToken", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.minter = signers[1];
    this.signers.user1 = signers[2];

    this.loadFixture = loadFixture;
  });

  describe("Deployment", function () {
    it("Should deploy with correct roles", async function () {
      const { cnsToken, admin, minter } = await this.loadFixture(deployCNSTokenFixture);
      const DEFAULT_ADMIN_ROLE = await cnsToken.DEFAULT_ADMIN_ROLE();
      const MINTER_ROLE = await cnsToken.MINTER_ROLE();

      expect(await cnsToken.hasRole(DEFAULT_ADMIN_ROLE, admin.address)).equal(true);
      expect(await cnsToken.hasRole(MINTER_ROLE, minter.address)).equal(true);
    });

    it("Should set correct token name and symbol", async function () {
      const { cnsToken } = await this.loadFixture(deployCNSTokenFixture);
      expect(await cnsToken.name()).to.equal("CNS Token");
      expect(await cnsToken.symbol()).to.equal("CNS");
    });
  });

  describe("Minting", function () {
    it("Should allow minter to mint within daily limit", async function () {
      const { cnsToken, minter, user1 } = await this.loadFixture(deployCNSTokenFixture);

      await expect(cnsToken.connect(minter).mint(user1.address, DAILY_MINT_LIMIT))
        .to.emit(cnsToken, "Transfer")
        .withArgs(ethers.ZeroAddress, user1.address, DAILY_MINT_LIMIT);

      expect(await cnsToken.balanceOf(user1.address)).to.equal(DAILY_MINT_LIMIT);
    });

    it("Should prevent minting exceeding daily limit", async function () {
      const { cnsToken, minter, user1 } = await this.loadFixture(deployCNSTokenFixture);

      await cnsToken.connect(minter).mint(user1.address, DAILY_MINT_LIMIT);

      await expect(cnsToken.connect(minter).mint(user1.address, ethers.parseEther("1"))).to.be.revertedWith(
        "Exceeds daily mint limit",
      );
    });

    it("Should reset daily mint limit after one day (blocks)", async function () {
      const { cnsToken, minter, user1 } = await this.loadFixture(deployCNSTokenFixture);

      await cnsToken.connect(minter).mint(user1.address, DAILY_MINT_LIMIT);

      const BLOCKS_PER_DAY = 42772;
      await ethers.provider.send("hardhat_mine", [ethers.toQuantity(BLOCKS_PER_DAY)]);

      await expect(cnsToken.connect(minter).mint(user1.address, DAILY_MINT_LIMIT)).to.emit(cnsToken, "Transfer");
    });

    it("Should prevent non-minters from minting", async function () {
      const { cnsToken, user1 } = await this.loadFixture(deployCNSTokenFixture);
      const minterRole = await cnsToken.MINTER_ROLE();

      await expect(cnsToken.connect(user1).mint(user1.address, ethers.parseEther("10"))).to.be.revertedWith(
        `AccessControl: account ${user1.address.toLowerCase()} is missing role ${minterRole}`,
      );
    });

    it("Should prevent minting zero tokens", async function () {
      const { cnsToken, minter, user1 } = await this.loadFixture(deployCNSTokenFixture);

      await expect(cnsToken.connect(minter).mint(user1.address, 0)).to.be.revertedWith(
        "Mint amount must be greater than zero",
      );
    });

    it("Should prevent minting more than daily limit in one transaction", async function () {
      const { cnsToken, minter, user1 } = await this.loadFixture(deployCNSTokenFixture);

      await expect(cnsToken.connect(minter).mint(user1.address, ethers.parseEther("101"))).to.be.revertedWith(
        "Cannot mint more than daily limit",
      );
    });
  });
});
