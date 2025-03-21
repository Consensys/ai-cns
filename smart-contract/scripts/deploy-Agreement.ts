import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";
import fs from "fs";
import { ethers } from "hardhat";

import { verify } from "../scripts/VerifyContract";
import type { NetworkStateAgreement } from "../src/types/NetworkStateAgreement";
import type { NetworkStateAgreement__factory } from "../src/types/factories/NetworkStateAgreement__factory";

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

async function main() {
  const [deployer] = await ethers.getSigners();
  await deployNetworkStateAgreement(deployer, true, true);
}

export async function deployNetworkStateAgreement(
  deployer: SignerWithAddress,
  verifyContract: boolean,
  filldata: boolean,
): Promise<string> {
  const config = JSON.parse(fs.readFileSync("./scripts/Agreement.json", "utf-8"));
  console.log("Deployer:", deployer.address);
  const factory = (await ethers.getContractFactory("NetworkStateAgreement")) as NetworkStateAgreement__factory;
  const contract = (await factory
    .connect(deployer)
    .deploy(config.constitutionURL, config.initiativesContractAddress)) as NetworkStateAgreement;
  await contract.waitForDeployment();
  const address = await contract.getAddress();
  console.log("NetworkStateAgreement deployed to:", address);

  if (filldata) {
    await fillData(contract);
  }

  if (verifyContract) {
    setTimeout(async () => {
      await verify(address, [config.constitutionURL, config.initiativesContractAddress]);
    }, 10000);
  }

  return address;
}

async function fillData(contract: NetworkStateAgreement) {
  const constitutionHash = ethers.keccak256(ethers.toUtf8Bytes("A long constitution to empower decentralization"));

  const [acc1, acc2, acc3] = await ethers.getSigners();

  const signature = await acc1.signMessage(ethers.getBytes(constitutionHash));
  await contract.connect(acc1).signAgreement("maker", "human", constitutionHash, signature);

  const signature2 = await acc2.signMessage(ethers.getBytes(constitutionHash));
  await contract.connect(acc2).signAgreement("instigator", "human", constitutionHash, signature2);

  const signature3 = await acc3.signMessage(ethers.getBytes(constitutionHash));
  await contract.connect(acc3).signAgreement("investor", "human", constitutionHash, signature3);

  const agents = [
    { privateKey: process.env.PRIVATE_KEY_AGENT_1, profile: "investor", nature: "AI" },
    { privateKey: process.env.PRIVATE_KEY_AGENT_2, profile: "maker", nature: "AI" },
    { privateKey: process.env.PRIVATE_KEY_AGENT_3, profile: "maker", nature: "AI" },
    { privateKey: process.env.PRIVATE_KEY_AGENT_4, profile: "investor", nature: "AI" },
  ];

  // Create wallets and execute transactions
  for (const agent of agents) {
    if (!agent.privateKey) {
      console.warn(`Skipping agent with missing private key.`);
      continue;
    }
    // Connect to the provider
    const provider = new ethers.JsonRpcProvider("https://linea-sepolia.infura.io/v3/" + process.env.INFURA_API_KEY);
    const wallet = new ethers.Wallet(agent.privateKey, provider);
    console.log(`Executing transaction with: ${wallet.address} as ${agent.profile}, ${agent.nature}`);

    try {
      // Execute contract function with specific profile and category
      const signature = await wallet.signMessage(ethers.getBytes(constitutionHash));
      const tx = await contract.connect(wallet).signAgreement(agent.profile, agent.nature, constitutionHash, signature);

      await tx.wait();
    } catch (error) {
      console.error(`Transaction failed for ${wallet.address}:`, error);
    }
  }
}
