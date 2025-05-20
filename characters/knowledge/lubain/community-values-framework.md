---
title: "Community Values Initiative"
description: "A framework for collaborative curation of Ethereum community values"
author: "CNS DAO"
date: "2023-10-01"
tags: ["Community Values", "Ethereum", "Intuition Protocol", "Governance"]
---

# Community Values Initiative

## Core Concept

A collaborative experiment to create a "living constitution" of community values for the Ethereum ecosystem, allowing members to propose, vote on, and refine the core principles that guide the community.

## Key Components

### Value Proposition

- **Living Document**: Dynamic, evolving set of values that adapts over time
- **Community Ownership**: Values are proposed and curated by the community itself
- **On-chain Record**: Values and sentiment are recorded as verifiable blockchain artifacts
- **Shared Identity**: Creates cohesion through collectively defined principles

### Technical Implementation

- **Platform**: Single page application built on Intuition protocol
- **Mechanism**: Stake-weighted voting system where users can:
  - Propose new values
  - Upvote/downvote existing values with ETH stakes
  - View values ranked by net stake
  - Discuss and refine value definitions

### Value Structure

- **Format**: Values expressed as claims (e.g., "Ethereum" → "hasValue" → "Credibly Neutral")
- **Hierarchy**: Values can form trees with sub-values (e.g., "Decentralized" → "Geographically Distributed")
- **Components**: Each value includes title, description, stake metrics, and discussion links

## Economic Design

### Staking Mechanism

- **Shares**: Users receive shares when staking ETH for/against values
- **Bonding Curve**: Linear curve where price increases with total stake
- **Incentives**: Early stakers rewarded more to encourage thoughtful contributions
- **Fees**: Configurable entry/exit fees to promote desired participation patterns

### Ranking System

- Values ranked by: Total ETH staked FOR minus total ETH staked AGAINST
- Secondary views: Latest additions, most active discussions
- Metrics displayed: Total stake, unique depositor count, ranking position

## Implementation Details

### User Experience

- **Simplicity**: Minimal clicks, intuitive interface
- **Transparency**: Clear author identification via ENS
- **Social Integration**: Sharing capabilities for Twitter, Farcaster, Lens
- **Discussion**: Integrated forums or Farcaster channels for value deliberation

### Technical Requirements

- **Identity**: ENS integration with fallbacks to other naming systems
- **Data Structure**: Atoms on Intuition protocol with standardized claim format
- **Proof of Concept**: Available at ethereum-values.consensys.io
- **Deployment**: Currently on BaseSepolia testnet

## Strategic Context

- Part of Consensys' "Web3 For All" campaign
- Builds on Balaji Srinivasan's concept of "moral innovation" from *The Network State*
- Addresses the challenge of maintaining cohesive values as the ecosystem grows
- Provides a mechanism for intentional evolution rather than haphazard drift