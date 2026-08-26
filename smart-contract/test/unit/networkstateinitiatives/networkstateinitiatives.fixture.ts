import { ethers } from "hardhat";

import type { NetworkStateAgreement } from "../../../src/types/NetworkStateAgreement";
import type { NetworkStateInitiatives } from "../../../src/types/NetworkStateInitiatives";
import type { NetworkStateAgreement__factory } from "../../../src/types/factories/NetworkStateAgreement__factory";
import type { NetworkStateInitiatives__factory } from "../../../src/types/factories/NetworkStateInitiatives__factory";

export async function deployNetworkStateInitiativesFixture() {
  const [owner, user1, user2] = await ethers.getSigners();
  const treasuryAddress = "0x01F8e269CADCD36C945F012d2EeAe814c42D1159";
  const constitutionURL = "https://ipfs.io/ipfs/QmZCXBiYSMVJe5vUq3s62L2YTugGCY2WZ8m6wb9ra99wAc/";
  const constitutionHash = ethers.keccak256(ethers.toUtf8Bytes("A long constitution to empower decentralization"));

  const initiativesFactory = (await ethers.getContractFactory(
    "NetworkStateInitiatives",
  )) as NetworkStateInitiatives__factory;
  const networkStateInitiatives = (await initiativesFactory.deploy(treasuryAddress)) as NetworkStateInitiatives;
  await networkStateInitiatives.waitForDeployment();

  const initiativesAddress = await networkStateInitiatives.getAddress();
  const agreementFactory = (await ethers.getContractFactory("NetworkStateAgreement")) as NetworkStateAgreement__factory;
  const networkStateAgreement = (await agreementFactory.deploy(
    constitutionURL,
    initiativesAddress,
    treasuryAddress,
  )) as NetworkStateAgreement;
  await networkStateAgreement.waitForDeployment();

  const agreementAddress = await networkStateAgreement.getAddress();
  await networkStateInitiatives.setAgreementContract(agreementAddress);

  for (const user of [user1, user2]) {
    const signaturePayload = ethers.keccak256(
      ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256", "address", "string", "string", "bytes32"],
        [
          agreementAddress,
          (await ethers.provider.getNetwork()).chainId,
          user.address,
          "maker",
          "human",
          constitutionHash,
        ],
      ),
    );
    const signature = await user.signMessage(ethers.getBytes(signaturePayload));
    await networkStateAgreement.connect(user).signAgreement("maker", "human", constitutionHash, signature);
  }

  return {
    networkStateInitiatives,
    networkStateInitiativesAddress: initiativesAddress,
    networkStateAgreement,
    networkStateAgreementAddress: agreementAddress,
    owner,
    user1,
    user2,
  };
}
