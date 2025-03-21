# AI integrated Network State 🤖



## 🚩 Overview

Cypherpunk hackathon 2025

## ✨ Features

- 🛠️ Slack support
- 👥 Multi-agents and room support
- 📚 Easily ingest and interact with your documents
- 💾 Census
- 🚀 Full Network State Platform

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
# LLM Configuration
OPENAI_API_KEY=

# EVM
EVM_PRIVATE_KEY=0x71092af342a22e058747efd5a67e7259f9dd0935cbb913fb6ec58f9834e87c74          # Add the "0x" prefix infront of your private key string                  
EVM_PROVIDER_URL2=https://polygon-amoy.drpc.org #Polygon Amoy
EVM_PROVIDER_URL=https://linea-sepolia.infura.io/v3/296Owf7VKF2IhHACZCp2Y8Rrqbm #Linea Sepolia
EVM_PUBLIC_KEY=0x01f8e269cadcd36c945f012d2eeae814c42d1159

# CNS
CNS_AGREEMENT_CONTRACT_ADDRESS=0x24769c21a3cc7822439688FC5F38622FC4591D22
CNS_INITIATIVE_CONTRACT_ADDRESS=0x742EE0Bce7738f9b3315b7Bc4c0A57A656c4498d #Linea Sepolia
CNS_VERAX_PORTAL_ID=0x4787Fd2DfE83C0e5d07d2BA1aEF12Afc5c4fe306
CNS_VERAX_SCHEMA_ID=0x8660da4093987072670aba14868d8dc4112ea88a777f7434a54ea8e7925a1a73

# Supabase Configuration
SUPABASE_URL=
SUPABASE_ANON_KEY=

# Slack Configuration
CHARACTER.LUBAIN.SLACK_APP_ID=           # From Basic Information > App Credentials > App ID
CHARACTER.LUBAIN.SLACK_CLIENT_ID=        # From Basic Information > App Credentials > Client ID
CHARACTER.LUBAIN.SLACK_CLIENT_SECRET=    # From Basic Information > App Credentials > Client Secret
CHARACTER.LUBAIN.SLACK_SIGNING_SECRET=   # From Basic Information > App Credentials > Signing Secret
CHARACTER.LUBAIN.SLACK_BOT_TOKEN=       # From OAuth & Permissions > Bot User OAuth Token (starts with xoxb-)
CHARACTER.LUBAIN.SLACK_VERIFICATION_TOKEN= # From Basic Information > App Credentials > Verification Token
CHARACTER.LUBAIN.SLACK_SERVER_PORT=  # Must match the port you used with ngrok

```

#### Start Eliza

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
pnpm start --characters="lubain.character.json"
pnpm start --character="lubain.character.json,vitalaik.character.json,satoshai.character.json"
```
Then read the [Documentation](https://elizaos.github.io/eliza/) to learn how to customize your Eliza.


### Add more plugins

1. run `npx elizaos plugins list` to get a list of available plugins or visit https://elizaos.github.io/registry/

2. run `npx elizaos plugins add @elizaos-plugins/plugin-NAME` to install the plugin into your instance

### Supabase

```bash
psql "postgresql://postgres:cypherpunkhackathon@db.erqahqyzhirixswuiplt.supabase.co:5432/postgres"  -f schema.sql
psql "postgresql://postgres:cypherpunkhackathon@db.erqahqyzhirixswuiplt.supabase.co:5432/postgres"  -f seed.sql
```

### Submodules

#### Clone a repo with submodules
`git clone --recursive <repository_url>`
or if you forget and you just did a git clone, you can still add the git submodules using this command `git submodule update --init --recursive`

#### Commit a submodule
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

## Using Your Custom Plugins
Plugins that are not in the official registry for ElizaOS can be used as well. Here's how:

### Installation

1. Upload the custom plugin to the packages folder:

```
packages/
├─plugin-example/
├── package.json
├── tsconfig.json
├── src/
│   ├── index.ts        # Main plugin entry
│   ├── actions/        # Custom actions
│   ├── providers/      # Data providers
│   ├── types.ts        # Type definitions
│   └── environment.ts  # Configuration
├── README.md
└── LICENSE
```

2. Add the custom plugin to your project's dependencies in the agent's package.json:

```json
{
  "dependencies": {
    "@elizaos/plugin-example": "workspace:*"
  }
}
```

3. Import the custom plugin to your agent's character.json

```json
  "plugins": [
    "@elizaos/plugin-example",
  ],
```



## 📁 Project Structure
```
monorepo/
├── agent/              # Agent runtime (ElizaOS)
└── client/             # Front end (React)
└── contract/           # Smart contract (Harhat)
├── packages/
│   ├── core/           # Core Eliza functionality
│   ├── clients/        # Client implementations
│   └── actions/        # Custom actions
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── examples/          # Example implementations
```

