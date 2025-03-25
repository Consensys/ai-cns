import { ethers } from "hardhat";

import type { NetworkStateAgreement } from "../../../src/types/NetworkStateAgreement";
import type { NetworkStateAgreement__factory } from "../../../src/types/factories/NetworkStateAgreement__factory";
import type { NetworkStateInitiatives } from "../src/types/NetworkStateInitiatives";
import type { NetworkStateInitiatives__factory } from "../src/types/factories/NetworkStateInitiatives__factory";

export async function deployNetworkStateAgreementFixture() {
  const constitutionURL = "https://ipfs.io/ipfs/QmZCXBiYSMVJe5vUq3s62L2YTugGCY2WZ8m6wb9ra99wAc/";
  const treasuryAddress = "0x01F8e269CADCD36C945F012d2EeAe814c42D1159";

  const [owner, user1] = await ethers.getSigners();

  const factory = (await ethers.getContractFactory("NetworkStateInitiatives")) as NetworkStateInitiatives__factory;
  const Initiativescontract = (await factory.connect(owner).deploy(treasuryAddress)) as NetworkStateInitiatives;
  await Initiativescontract.waitForDeployment();

  const initiativesContractAddress = await Initiativescontract.getAddress();
  const NetworkStateAgreement = (await ethers.getContractFactory(
    "NetworkStateAgreement",
  )) as NetworkStateAgreement__factory;
  const networkStateAgreement = (await NetworkStateAgreement.deploy(
    constitutionURL,
    initiativesContractAddress,
    treasuryAddress,
  )) as NetworkStateAgreement;
  const networkStateAgreementAddress = await networkStateAgreement.getAddress();

  return {
    networkStateAgreement,
    networkStateAgreementAddress,
    constitutionURL,
    owner,
    user1,
    initiativesContractAddress,
  };
}
