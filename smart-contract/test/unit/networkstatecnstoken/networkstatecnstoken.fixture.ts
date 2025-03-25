import { ethers } from "hardhat";

import type { CNSToken } from "../../../src/types/CNSToken";
import type { CNSToken__factory } from "../../../src/types/factories/CNSToken__factory";

export async function deployCNSTokenFixture() {
  const [owner, user1] = await ethers.getSigners();
  const minterAddress = "0x01F8e269CADCD36C945F012d2EeAe814c42D1159";

  const CNSToken = (await ethers.getContractFactory("CNSToken")) as CNSToken__factory;
  const cNSToken = (await CNSToken.deploy(owner.address, minterAddress)) as CNSToken;
  const cNSTokenAddress = await cNSToken.getAddress();

  return { cNSToken, cNSTokenAddress, owner, user1 };
}
