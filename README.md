# AI integrated Network State 🤖



## 🚩 Overview

Cypherpunk hackathon 2025

## ✨ Features

- 🚀 Full Network State Platform
- 👥 Multi-agents (LubAIn, VitalAIk, SatoshAI)
- 👥 Wallet-enabled AI Agent, able to issue onchain attestation, transfer reputation point, record & curate ideas...
- 🛠️ Slack & telegram integration
- 💾 Census
- 💾 Ideation
- 💾 Quadratic voting
- 💾 Resource Allocation
- 💾 Identity & Reputation Mechanism (attestations, reputation point)
- AI
- ...


## 🚀 Quick Start

### Prerequisites

- [Python 2.7+](https://www.python.org/downloads/) (3.8+ recommended)
- [Node.js 23+](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)
- [pnpm](https://pnpm.io/installation)

### Prerequisites

#### Edit the .env file

Copy .env.example to .env and fill in the appropriate values.

```
cp .env.example .env
```

Required environment variables:
```
# OpenAI Configuration
OPENAI_API_KEY=         # OpenAI API key, starting with sk-

# EVM
EVM_PRIVATE_KEY=          # Add the "0x" prefix infront of your private key string
EVM_PROVIDER_URL=https://rpc.linea.build #Linea Sepolia
EVM_PUBLIC_KEY=

# CNS
CNS_VERAX_PORTAL_ID=0x4787Fd2DfE83C0e5d07d2BA1aEF12Afc5c4fe306
CNS_VERAX_SCHEMA_ID=0x8660da4093987072670aba14868d8dc4112ea88a777f7434a54ea8e7925a1a73
CNS_CONSTITUTION_HASH=QmZCXBiYSMVJe5vUq3s62L2YTugGCY2WZ8m6wb9ra99wAc
CNS_AGREEMENT_CONTRACT_ADDRESS=0xd6e86833A8980ad1bAddfF1B8445e644A9F4b4D7
CNS_INITIATIVE_CONTRACT_ADDRESS=0xC0c8F49Bf5B6410B1d42c33806f0Ce905B6D13e6
CNS_TOKEN_ADDRESS=0xD0d3DA5416F4D4164af95372a3251E3864Bef78B

# Slack Configuration
CHARACTER.LUBAIN.SLACK_APP_ID=           # From Basic Information > App Credentials > App ID
CHARACTER.LUBAIN.SLACK_CLIENT_ID=        # From Basic Information > App Credentials > Client ID
CHARACTER.LUBAIN.SLACK_CLIENT_SECRET=    # From Basic Information > App Credentials > Client Secret
CHARACTER.LUBAIN.SLACK_SIGNING_SECRET=   # From Basic Information > App Credentials > Signing Secret
CHARACTER.LUBAIN.SLACK_BOT_TOKEN=       # From OAuth & Permissions > Bot User OAuth Token (starts with xoxb-)
CHARACTER.LUBAIN.SLACK_VERIFICATION_TOKEN= # From Basic Information > App Credentials > Verification Token
CHARACTER.LUBAIN.SLACK_SERVER_PORT=3069  # Must match the port you used with ngrok
# Slack Configuration
CHARACTER.VITALAIK.SLACK_APP_ID=           # From Basic Information > App Credentials > App ID
CHARACTER.VITALAIK.SLACK_CLIENT_ID=        # From Basic Information > App Credentials > Client ID
CHARACTER.VITALAIK.SLACK_CLIENT_SECRET=    # From Basic Information > App Credentials > Client Secret
CHARACTER.VITALAIK.SLACK_SIGNING_SECRET=   # From Basic Information > App Credentials > Signing Secret
CHARACTER.VITALAIK.SLACK_BOT_TOKEN=       # From OAuth & Permissions > Bot User OAuth Token (starts with xoxb-)
CHARACTER.VITALAIK.SLACK_VERIFICATION_TOKEN= # From Basic Information > App Credentials > Verification Token
CHARACTER.VITALAIK.SLACK_SERVER_PORT=3070  # Must match the port you used with ngrok
# Slack Configuration
CHARACTER.SATOSHAI.SLACK_APP_ID=           # From Basic Information > App Credentials > App ID
CHARACTER.SATOSHAI.SLACK_CLIENT_ID=        # From Basic Information > App Credentials > Client ID
CHARACTER.SATOSHAI.SLACK_CLIENT_SECRET=    # From Basic Information > App Credentials > Client Secret
CHARACTER.SATOSHAI.SLACK_SIGNING_SECRET=   # From Basic Information > App Credentials > Signing Secret
CHARACTER.SATOSHAI.SLACK_BOT_TOKEN=       # From OAuth & Permissions > Bot User OAuth Token (starts with xoxb-)
CHARACTER.SATOSHAI.SLACK_VERIFICATION_TOKEN= # From Basic Information > App Credentials > Verification Token
CHARACTER.SATOSHAI.SLACK_SERVER_PORT=3071  # Must match the port you used with ngrok

# Telegram Configuration
TELEGRAM_BOT_TOKEN=
```

#### Start Agentic Platform

For the first time:
```bash
pnpm install --no-frozen-lockfile
```
Then
```bash
pnpm i
pnpm build
pnpm start

# The project iterates fast, sometimes you need to clean the project if you are coming back to the project
pnpm clean
```

### Interact via Browser

Once the agent is running, you should see the message to run "pnpm start:client" at the end.

Open another terminal, move to the same directory, run the command below, then follow the URL to chat with your agent.

```bash
pnpm start:client
`pnpm start --characters="path/to/your/character.json"`
```

or use lubain

```bash
pnpm start --character="lubain.character.json,vitalaik.character.json,satoshai.character.json"
```
Then read the [Documentation](https://elizaos.github.io/eliza/) to learn how to customize your Eliza.

### Add more plugins

1. run `npx elizaos plugins list` to get a list of available plugins or visit https://elizaos.github.io/registry/

2. run `npx elizaos plugins add @elizaos-plugins/plugin-NAME` to install the plugin into your instance

#### Supabase

Database initiation./

```bash
psql "postgresql://postgres:cypherpunkhackathon@db.erqahqyzhirixswuiplt.supabase.co:5432/postgres"  -f schema.sql
psql "postgresql://postgres:cypherpunkhackathon@db.erqahqyzhirixswuiplt.supabase.co:5432/postgres"  -f seed.sql
```

#### Submodules
Su
##### Clone a repo with submodules
`git clone --recursive <repository_url>`
or if you forget and you just did a git clone, you can still add the git submodules using this command `git submodule update --init --recursive`

##### Commit a submodule
```bash
npx elizaos plugins list 
npx elizaos plugins add @elizaos-plugins/adapter-supabase
```

`git submodule add git@github.com:elizaos-plugins/adapter-supabase.git packages/adapter-supabase`

---
## Ngrok configuration
Ngrok API Gateway is required in order to integrate Slack with our agents.
LubAIn, VitalAIk and SatoshAI are each running on the following ports: 3069, 3070, 3071

```bash
vim ~/.ngrok2/ngrok.yml
```

```bash
version: 2
authtoken: access-token
tunnels:
  tunnel-3069:
    proto: http
    addr: 3069
  tunnel-3070:
    proto: http
    addr: 3070
  tunnel-3071:
    proto: http
    addr: 3071
```

```bash
ngrok start --config ~/.ngrok2/ngrok.yml --all
```

## 📁 Project Structure
```
monorepo/
├── agent/              # Agent runtime (ElizaOS)
└── characters/         # AI Agent personas (JSON)
└── client/             # Front end (React)
└── smart-contract/     # Smart contract (Harhat)
├── packages/
│   ├── core/           # Core Eliza functionality
│   ├── clients/        # Client implementations
│   └── actions/        # Custom actions
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── examples/          # Example implementations
```

