import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

import type { Signers } from "../../common/types";
import { deployNetworkStateAgreementFixture } from "./networkstateagreement.fixture";

describe("NetworkStateAgreement", function () {
  before(async function () {
    this.signers = {} as Signers;

    const signers = await ethers.getSigners();
    this.signers.admin = signers[0];
    this.signers.user1 = signers[1];
    this.signers.user2 = signers[2];

    this.constitutionHash = ethers.keccak256(ethers.toUtf8Bytes("A long constitution to empower decentralization"));
    this.signature = await this.signers.user1.signMessage(ethers.getBytes(this.constitutionHash));

    this.loadFixture = loadFixture;
  });

  describe("Deployment", function () {
    it("should set correct initial values", async function () {
      const { networkStateAgreement } = await this.loadFixture(deployNetworkStateAgreementFixture);

      expect(await networkStateAgreement.constitutionURL()).to.equal(
        "https://ipfs.io/ipfs/QmZCXBiYSMVJe5vUq3s62L2YTugGCY2WZ8m6wb9ra99wAc/",
      );
      expect(await networkStateAgreement.networkStateTreasury()).to.equal("0x01F8e269CADCD36C945F012d2EeAe814c42D1159");
    });
  });

  describe("Signing Agreement", function () {
    beforeEach(async function () {
      const { networkStateAgreement } = await this.loadFixture(deployNetworkStateAgreementFixture);
      this.networkStateAgreement = networkStateAgreement;
    });

    it("should allow a user to sign the agreement", async function () {
      await this.networkStateAgreement
        .connect(this.signers.user1)
        .signAgreement("maker", "human", this.constitutionHash, this.signature);

      const userInfo = await this.networkStateAgreement.userInformation(this.signers.user1.address);

      expect(userInfo.hasAgreed).equal(true);
      expect(userInfo.userProfileType).to.equal("maker");
      expect(userInfo.userNatureAgent).to.equal("human");
      expect(userInfo.constitutionHash).to.equal(this.constitutionHash);
      expect(userInfo.signature).to.equal(this.signature);
    });

    it("should forward Ether to treasury when signing agreement with ETH", async function () {
      await expect(
        this.networkStateAgreement
          .connect(this.signers.user2)
          .signAgreement("instigator", "AI", this.constitutionHash, this.signature, { value: ethers.parseEther("1") }),
      ).to.changeEtherBalance(await this.networkStateAgreement.networkStateTreasury(), ethers.parseEther("1"));
    });

    it("should revert when user tries to sign the agreement twice", async function () {
      await this.networkStateAgreement
        .connect(this.signers.user1)
        .signAgreement("maker", "human", this.constitutionHash, this.signature);

      await expect(
        this.networkStateAgreement
          .connect(this.signers.user1)
          .signAgreement("maker", "human", this.constitutionHash, this.signature),
      ).to.be.revertedWith("Agreement already signed");
    });

    it("should revert if user provides invalid profile type", async function () {
      await expect(
        this.networkStateAgreement
          .connect(this.signers.user1)
          .signAgreement("invalid", "human", this.constitutionHash, this.signature),
      ).to.be.revertedWith("Invalid profile type");
    });

    it("should revert if user provides invalid nature agent", async function () {
      await expect(
        this.networkStateAgreement
          .connect(this.signers.user1)
          .signAgreement("maker", "alien", this.constitutionHash, this.signature),
      ).to.be.revertedWith("Invalid nature agent");
    });
  });

  describe("Owner Functions", function () {
    beforeEach(async function () {
      const { networkStateAgreement } = await this.loadFixture(deployNetworkStateAgreementFixture);
      this.networkStateAgreement = networkStateAgreement;
    });

    it("should allow owner to update constitution URL", async function () {
      await this.networkStateAgreement.connect(this.signers.admin).updateConstitutionURL("https://new-url.com");

      expect(await this.networkStateAgreement.constitutionURL()).to.equal("https://new-url.com");
    });

    it("should revert if non-owner attempts to update constitution URL", async function () {
      await expect(
        this.networkStateAgreement.connect(this.signers.user1).updateConstitutionURL("https://bad-url.com"),
      ).to.be.revertedWith("Only owner can call this");
    });

    it("should allow owner to update treasury address", async function () {
      const newTreasury = ethers.Wallet.createRandom().address;
      await this.networkStateAgreement.connect(this.signers.admin).updateNetworkStateTreasury(newTreasury);

      expect(await this.networkStateAgreement.networkStateTreasury()).to.equal(newTreasury);
    });

    it("should revert if treasury update with zero address", async function () {
      await expect(
        this.networkStateAgreement.connect(this.signers.admin).updateNetworkStateTreasury(ethers.ZeroAddress),
      ).to.be.revertedWith("Invalid address");
    });

    it("should allow anyone to update initiatives contract address", async function () {
      const newInitiativesContract = ethers.Wallet.createRandom().address;
      await this.networkStateAgreement.connect(this.signers.admin).updateInitiativesContract(newInitiativesContract);

      expect(await this.networkStateAgreement.initiativesContract()).to.equal(newInitiativesContract);
    });

    it("should revert updating initiatives contract with zero address", async function () {
      await expect(
        this.networkStateAgreement.connect(this.signers.admin).updateInitiativesContract(ethers.ZeroAddress),
      ).to.be.revertedWith("Invalid address");
    });
  });
});
