import { ethers } from "hardhat";

import { deployNetworkStateAgreement } from "./deploy-Agreement";
import { deployNetworkStateInitiatives } from "./deploy-Initiatives";

async function main() {
  const [deployer] = await ethers.getSigners();
  const initiativesAddress = await deployNetworkStateInitiatives(deployer, true, false);
  const agreementAddress = await deployNetworkStateAgreement(deployer, true, false, initiativesAddress);

  const initiatives = await ethers.getContractAt("NetworkStateInitiatives", initiativesAddress, deployer);
  await initiatives.setAgreementContract(agreementAddress);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
