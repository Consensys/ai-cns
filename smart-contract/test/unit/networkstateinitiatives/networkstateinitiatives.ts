import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../../common/types";
import { deployNetworkStateInitiativesFixture } from "./networkstateinitiatives.fixture";

describe("NetworkStateInitiatives", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user1 = signers[1];
    this.signers.user2 = signers[2];

    this.loadFixture = loadFixture;
  });

  describe("Deployment", function () {
    it("should set correct initial values", async function () {
      const { networkStateInitiatives, owner } = await this.loadFixture(deployNetworkStateInitiativesFixture);

      expect(await networkStateInitiatives.networkStateTreasury()).to.equal(
        "0x01F8e269CADCD36C945F012d2EeAe814c42D1159",
      );
      expect(await networkStateInitiatives.owner()).to.equal(owner.address);
    });
  });

  describe("Initiatives Management", function () {
    beforeEach(async function () {
      const { networkStateInitiatives } = await this.loadFixture(deployNetworkStateInitiativesFixture);
      this.networkStateInitiatives = networkStateInitiatives;

      this.tags = ["crypto", "passport", "identity"];
      await this.networkStateInitiatives
        .connect(this.signers.admin)
        .createInitiatives(
          this.signers.admin.address,
          "a crypto passport",
          "this is a zk passport",
          "digital identity",
          this.tags,
          50,
        );
      this.initiative = await this.networkStateInitiatives.initiatives(0);
    });

    it("should allocate funds correctly and forward treasury share", async function () {
      const fundAmount = ethers.parseEther("1");
      const treasuryShare = fundAmount / BigInt(10);
      const initiativeShare = fundAmount - treasuryShare;

      await expect(
        this.networkStateInitiatives
          .connect(this.signers.user1)
          .allocateFund(this.initiative.id, { value: fundAmount }),
      ).to.changeEtherBalance(await this.networkStateInitiatives.networkStateTreasury(), treasuryShare);

      const updatedInitiative = await this.networkStateInitiatives.initiatives(0);
      expect(updatedInitiative.funding).to.equal(initiativeShare);
    });

    it("should update initiative score correctly", async function () {
      await this.networkStateInitiatives.connect(this.signers.admin).updateScore(this.initiative.id, 80);
      const updatedInitiative = await this.networkStateInitiatives.initiatives(0);
      expect(updatedInitiative.score).to.equal(80);
    });

    it("should withdraw initiative funding correctly", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 10); // become instigator
      const fundAmount = ethers.parseEther("1");
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: fundAmount });
      await this.networkStateInitiatives
        .connect(this.signers.admin)
        .updateStatus(this.initiative.id, "CAPITAL_ALLOCATION");

      await expect(
        this.networkStateInitiatives.connect(this.signers.admin).withdrawInitiativeFunding(this.initiative.id),
      ).to.changeEtherBalance(this.signers.admin, ethers.parseEther("0.9"));

      const updatedInitiative = await this.networkStateInitiatives.initiatives(0);
      expect(updatedInitiative.funding).to.equal(0);
    });

    it("should revert initiative funding withdrawal by non-instigator", async function () {
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).withdrawInitiativeFunding(this.initiative.id),
      ).to.be.revertedWith("Only instigator can withdraw");
    });

    it("should allow emergency withdrawal by owner", async function () {
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: ethers.parseEther("1") });

      await expect(this.networkStateInitiatives.connect(this.signers.admin).withdrawEmergency()).to.changeEtherBalance(
        this.signers.admin,
        ethers.parseEther("0.9"),
      );
    });

    it("should revert emergency withdrawal by non-owner", async function () {
      await expect(this.networkStateInitiatives.connect(this.signers.user1).withdrawEmergency()).to.be.revertedWith(
        "Only owner can call this",
      );
    });

    it("should auto-initialize credits if user has none", async function () {
      await this.networkStateInitiatives.connect(this.signers.user2).upvote(this.initiative.id, 1);
      const credits = await this.networkStateInitiatives.userCredits(this.signers.user2.address);
      expect(credits).to.equal(99);
    });

    it("should revert if vote cost exceeds user credits", async function () {
      await this.networkStateInitiatives.updateUserCredits(this.signers.user1.address, 4);
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 3),
      ).to.be.revertedWith("Not enough credits");
    });

    it("should revert voting with zero votes", async function () {
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 0),
      ).to.be.revertedWith("Votes number must be greater than zero");
    });

    it("should update score successfully", async function () {
      await this.networkStateInitiatives.updateScore(this.initiative.id, 80);
      const updated = await this.networkStateInitiatives.initiatives(0);
      expect(updated.score).to.equal(80);
    });

    it("should add and remove team member", async function () {
      await this.networkStateInitiatives.addTeamMember(this.initiative.id, this.signers.user1.address);
      await this.networkStateInitiatives.initiatives(0);

      await this.networkStateInitiatives.removeTeamMember(this.initiative.id, this.signers.user1.address);
      await this.networkStateInitiatives.initiatives(0);
    });

    it("should allocate fund and split to treasury", async function () {
      const balanceBefore = await ethers.provider.getBalance(await this.networkStateInitiatives.networkStateTreasury());

      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: ethers.parseEther("1") });

      const updated = await this.networkStateInitiatives.initiatives(0);
      expect(updated.funding).to.equal(ethers.parseEther("0.9"));

      const balanceAfter = await ethers.provider.getBalance(await this.networkStateInitiatives.networkStateTreasury());
      expect(balanceAfter).to.be.gt(balanceBefore);
    });

    it("should allow instigator to withdraw funding", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 10); // become instigator
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .updateStatus(this.initiative.id, "CAPITAL_ALLOCATION");
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: ethers.parseEther("1") });

      const balanceBefore = await ethers.provider.getBalance(this.signers.user1.address);
      const tx = await this.networkStateInitiatives
        .connect(this.signers.user1)
        .withdrawInitiativeFunding(this.initiative.id);
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(this.signers.user1.address);

      expect(balanceAfter).to.be.closeTo(
        balanceBefore + ethers.parseEther("0.9") - BigInt(gasUsed),
        ethers.parseEther("0.01"),
      );
    });

    it("should revert withdrawal by non-instigator", async function () {
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: ethers.parseEther("1") });
      await expect(
        this.networkStateInitiatives.connect(this.signers.user2).withdrawInitiativeFunding(this.initiative.id),
      ).to.be.revertedWith("Only instigator can withdraw");
    });

    it("should allow emergency withdrawal by owner", async function () {
      await this.networkStateInitiatives
        .connect(this.signers.user1)
        .allocateFund(this.initiative.id, { value: ethers.parseEther("1") });

      const balanceBefore = await ethers.provider.getBalance(this.signers.admin.address);
      const tx = await this.networkStateInitiatives.connect(this.signers.admin).withdrawEmergency();
      const receipt = await tx.wait();
      const gasUsed = receipt.gasUsed * receipt.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(this.signers.admin.address);

      expect(balanceAfter).to.be.closeTo(
        balanceBefore + ethers.parseEther("0.9") - BigInt(gasUsed),
        ethers.parseEther("0.01"),
      );
    });

    it("should revert emergency withdrawal if not owner", async function () {
      await expect(this.networkStateInitiatives.connect(this.signers.user1).withdrawEmergency()).to.be.revertedWith(
        "Only owner can call this",
      );
    });

    it("should revert updateUserCredits over max limit", async function () {
      await expect(this.networkStateInitiatives.updateUserCredits(this.signers.user1.address, 101)).to.be.revertedWith(
        "Credit balance cannot exceed max limit",
      );
    });

    it("should handle downvoting correctly and deduct quadratic credits", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).downvote(this.initiative.id, 2);
      const credits = await this.networkStateInitiatives.userCredits(this.signers.user1.address);
      expect(credits).to.equal(96); // 100 - (2*2)
    });

    it("should prevent double downvoting", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).downvote(this.initiative.id, 1);
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).downvote(this.initiative.id, 1),
      ).to.be.revertedWith("Already voted on this initiative");
    });

    it("should allow owner to update network state treasury address", async function () {
      const newTreasury = ethers.Wallet.createRandom().address;
      await this.networkStateInitiatives.connect(this.signers.admin).updateNetworkStateTreasury(newTreasury);
      expect(await this.networkStateInitiatives.networkStateTreasury()).to.equal(newTreasury);
    });

    it("should revert treasury update by non-owner", async function () {
      const newTreasury = ethers.Wallet.createRandom().address;
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).updateNetworkStateTreasury(newTreasury),
      ).to.be.revertedWith("Only owner can call this");
    });

    it("should revert treasury update with zero address", async function () {
      await expect(
        this.networkStateInitiatives.connect(this.signers.admin).updateNetworkStateTreasury(ethers.ZeroAddress),
      ).to.be.revertedWith("Invalid address");
    });
    it("should reject invalid status updates", async function () {
      await expect(
        this.networkStateInitiatives.connect(this.signers.admin).updateStatus(this.initiative.id, "INVALID_STATUS"),
      ).to.be.revertedWith("Invalid status");
    });
  });
});
