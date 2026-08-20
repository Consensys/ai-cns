# AI - Consensys Network State project - SMART CONTRACT

### Problem to solve

Building and managing a Network State—a decentralized, value-aligned digital nation—requires efficient governance, reputation management, ideation management, and capital allocation. Traditional governance models struggle with transparency, trust, and coordination, leading to inefficiencies in decision-making, funding distribution, and community engagement.

### A solution

We introduce an AI-powered, on-chain governance system for a Network State, enabling:

- On-Chain Citizenship & Census: Users sign an on-chain agreement to join the Network State, agreeing to its values, constitution and bylaw and their membership is publicly visible.
- AI Governance Assistant: An AI agent, informed by the community’s values and mindshare, helps evaluate ideas, answer questions, and guide discussions.
- Reputation & Trust Attestations: Contributions (ideas, insights, labor) are attested on-chain using Verax, ensuring merit-based reputation building.
- Quadratic Voting & Treasury Management: Community members vote on projects using quadratic funding relatively to their reputation, directly influencing capital allocation via a smart account treasury.

This system ensures fair governance, transparent funding, and effective decision-making, paving the way for scalable, value-driven digital nations.

## Description

This Smart Contract folder covers the on-chain part.

### NetworkStateAgreement Smart Contract

This contract handles user agreements and profile validation for participation in the ecosystem.

✅ User Agreement Signing

- Users must sign an agreement before participating.
- Stores user profile type, agent nature, signature, and agreement hash.

✅ Allowed User Profiles & Nature Agents

- Users must have a valid profile type (e.g., "maker", "instigator", "investor").
- Users must be either "AI" or "human".

✅ Ether Payments for Agreement

- Users can optionally send Ether while signing.
- Funds are transferred to the Network State Treasury.

✅ Owner-Only Functions

- The contract owner can update the constitution URL and the treasury address.
- The agreement hash is stored to ensure integrity.

✅ Event Tracking

- Logs agreement signings, constitution updates, and treasury updates.

### NetworkStateInitiatives Smart Contract

This contract allows users to create, vote, and track community initiatives with quadratic voting.

✅ Create Initiatives

- Users can propose initiatives with a title, description, category, and tags.

✅ Quadratic Voting System

- Upvotes and downvotes cost credits based on a quadratic cost model:
  1 vote = 1 credit
  2 votes = 4 credits
  3 votes = 9 credits
- This prevents voting manipulation by making additional votes more expensive.

✅ Credit-Based Voting

- Users have a limited credit pool (MAX_CREDITS = 100).
- Verified agreement signers receive up to 100 credits when the agreement is signed; voting never regenerates credits.
- Credits are spent when voting, preventing unlimited influence.

✅ Preventing Double Voting

- A user can only vote once per initiative.
- This ensures fairness and prevents multiple votes on the same initiative.

✅ Status Updates for Initiatives

- The contract owner can update an initiative’s status.
- The initiative contract must be linked to the agreement contract before voting is enabled.

✅ Owner-Managed Credit System

- The contract owner can manually update a user's credit balance.

✅ Event Tracking

- Logs initiative creation, voting, credit updates, and status changes.

## Usage

### Pre requisites

Copy this file to `.env` to run the Smart Contract locally:

```bash
cp .env-example .env
```

### Installation

Install the dependencies:

```bash
yarn install
```

Enable Git hooks (Husky):

```bash
yarn husky install
```

### Compile

Compile the smart contracts:

```bash
yarn compile
```

### TypeChain

Generate TypeChain artifacts:

```bash
yarn typechain
```

### Lint Solidity

Generate TypeChain artifacts:

```bash
yarn lint:sol
```

### Lint TypeScript

Generate TypeChain artifacts:

```bash
yarn lint:ts
```

### Prettier

Format code:

```bash
yarn prettier
```

### Test

Execute tests:

```bash
yarn test
```

### Coverage

Generate the code coverage report:

```bash
yarn coverage
```

### Report Gas

Generate report on gas usage per unit test and average gas per function:

```bash
REPORT_GAS=true yarn test
```

### Clean

Remove the smart contract & Typechain artifacts, the coverage reports and the Hardhat cache:

```bash
yarn clean
```
