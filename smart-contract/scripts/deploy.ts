import { ethers } from "hardhat";

import { deployNetworkStateAgreement } from "./deploy-Agreement";
import { deployNetworkStateInitiatives } from "./deploy-Initiatives";

async function main() {
  const [deployer] = await ethers.getSigners();

  // Deploy NetworkStateAgreement
  await deployNetworkStateAgreement(deployer, true, false);

  // Deploy NetworkStateInitiatives
  await deployNetworkStateInitiatives(deployer, true, false);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
