import { ethers } from "hardhat";

import type { NetworkStateAgreement } from "../../../src/types/NetworkStateAgreement";
import type { NetworkStateAgreement__factory } from "../../../src/types/factories/NetworkStateAgreement__factory";
import type { NetworkStateInitiatives } from "../src/types/NetworkStateInitiatives";
import type { NetworkStateInitiatives__factory } from "../src/types/factories/NetworkStateInitiatives__factory";

export async function deployNetworkStateAgreementFixture() {
  const constitutionURL = "https://ipfs.io/ipfs/xxxxxxxxxxxx";

  const [owner, user1] = await ethers.getSigners();

  const factory = (await ethers.getContractFactory("NetworkStateInitiatives")) as NetworkStateInitiatives__factory;
  const Initiativescontract = (await factory.connect(owner).deploy()) as NetworkStateInitiatives;
  await Initiativescontract.waitForDeployment();

  const NetworkStateAgreement = (await ethers.getContractFactory(
    "NetworkStateAgreement",
  )) as NetworkStateAgreement__factory;
  const networkStateAgreement = (await NetworkStateAgreement.deploy(
    constitutionURL,
    Initiativescontract.getAddress(),
  )) as NetworkStateAgreement;
  const networkStateAgreementAddress = await networkStateAgreement.getAddress();

  return { networkStateAgreement, networkStateAgreementAddress, constitutionURL, owner, user1 };
}
