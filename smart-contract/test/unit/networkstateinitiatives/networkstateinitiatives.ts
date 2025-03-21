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

  describe("Testing", function () {
    beforeEach(async function () {
      const { networkStateInitiatives, networkStateInitiativesAddress, owner } = await this.loadFixture(
        deployNetworkStateInitiativesFixture,
      );
      this.networkStateInitiatives = networkStateInitiatives;
      this.networkStateInitiativesAddress = networkStateInitiativesAddress;
      this.owner = owner;

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

    it("should return a created initiative", async function () {
      const initiative = await this.networkStateInitiatives.initiatives(0);
      expect(initiative.ideator).to.equal(this.signers.admin.address);
      expect(initiative.title).to.equal("a crypto passport");
      expect(initiative.description).to.equal("this is a zk passport");
      expect(initiative.category).to.equal("digital identity");
      expect(initiative.status).to.equal("IDEATION");
      expect(initiative.score).to.equal(50);
    });

    it("should initialize voter credits on first vote", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 1);
      const userCredits = await this.networkStateInitiatives.userCredits(this.signers.user1.address);
      expect(userCredits).to.be.lessThan(100);
    });

    it("should deduct correct quadratic cost when voting", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 3);
      const userCredits = await this.networkStateInitiatives.userCredits(this.signers.user1.address);
      expect(userCredits).to.equal(100 - 3 * 3); // 100 - 9 = 91
    });

    it("should prevent a user from voting twice on the same initiative", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 1);
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 2),
      ).to.be.revertedWith("Already voted on this initiative");
    });

    it("should allow owner to update user credits", async function () {
      await this.networkStateInitiatives.connect(this.signers.admin).updateUserCredits(this.signers.user1.address, 50);
      const userCredits = await this.networkStateInitiatives.userCredits(this.signers.user1.address);
      expect(userCredits).to.equal(50);
    });

    it("should prevent a user from exceeding their max credit limit when voting", async function () {
      await expect(
        this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 11), // 11*11 = 121 exceeds max credits
      ).to.be.revertedWith("Not enough credits");
    });

    it("should allow different users to vote on the same initiative", async function () {
      await this.networkStateInitiatives.connect(this.signers.user1).upvote(this.initiative.id, 2);
      await this.networkStateInitiatives.connect(this.signers.user2).downvote(this.initiative.id, 3);
      const initiative = await this.networkStateInitiatives.initiatives(0);
      expect(initiative.upvotes).to.equal(2);
      expect(initiative.downvotes).to.equal(3);
    });

    it("should correctly update status of an initiative", async function () {
      let initiative = await this.networkStateInitiatives.initiatives(0);
      await this.networkStateInitiatives.connect(this.signers.admin).updateStatus(initiative.id, "CAPITAL_ALLOCATION");
      initiative = await this.networkStateInitiatives.initiatives(0);
      expect(initiative.status).to.equal("CAPITAL_ALLOCATION");
    });
  });
});
