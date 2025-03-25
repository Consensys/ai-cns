import { ethers } from "hardhat";

import type { NetworkStateInitiatives } from "../../../src/types/NetworkStateInitiatives";
import type { NetworkStateInitiatives__factory } from "../../../src/types/factories/NetworkStateInitiatives__factory";

export async function deployNetworkStateInitiativesFixture() {
  const [owner, user1] = await ethers.getSigners();
  const treasuryAddress = "0x01F8e269CADCD36C945F012d2EeAe814c42D1159";

  const NetworkStateInitiatives = (await ethers.getContractFactory(
    "NetworkStateInitiatives",
  )) as NetworkStateInitiatives__factory;
  const networkStateInitiatives = (await NetworkStateInitiatives.deploy(treasuryAddress)) as NetworkStateInitiatives;
  const networkStateInitiativesAddress = await networkStateInitiatives.getAddress();

  return { networkStateInitiatives, networkStateInitiativesAddress, owner, user1 };
}
