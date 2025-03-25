import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/dist/src/signer-with-address";

import type { NetworkStateAgreement } from "../../src/types/NetworkStateAgreement";

type Fixture<T> = () => Promise<T>;

declare module "mocha" {
  export interface Context {
    networkStateAgreement: NetworkStateAgreement;
    loadFixture: <T>(fixture: Fixture<T>) => Promise<T>;
    signers: Signers;
  }
}

export interface Signers {
  admin: SignerWithAddress;
  minter: SignerWithAddress;
  user1: SignerWithAddress;
  user2: SignerWithAddress;
}
