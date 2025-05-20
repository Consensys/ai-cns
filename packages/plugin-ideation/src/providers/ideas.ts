import { elizaLogger, type IAgentRuntime, type Memory, type Provider, type State } from "@elizaos/core";
import { ethers } from "ethers";

const SMART_CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "bytes32", "name": "initiativeId", "type": "bytes32" },
            { "indexed": false, "internalType": "address", "name": "ideator", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "description", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "category", "type": "string" },
            { "indexed": false, "internalType": "uint256", "name": "score", "type": "uint256" }
        ],
        "name": "InitiativeCreated",
        "type": "event"
    }
];

const MAX_INITIATIVES = 10;

const ideasProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        elizaLogger.info("⏳ Fetching latest initiatives...");
        elizaLogger.log("⏳ Provider: Fetch registered initiatiives");
        try {
            const evmProviderUrl = process.env.EVM_PROVIDER_URL;
            const contractAddress = process.env.CNS_INITIATIVE_CONTRACT_ADDRESS;
            elizaLogger.info("🔗 Initative Smart Contract address: ", contractAddress);
            if (!evmProviderUrl || !contractAddress) throw new Error("Missing env variables");

            const provider = new ethers.JsonRpcProvider(evmProviderUrl);
            if (await provider.getCode(contractAddress) === "0x") {
                console.error("❌ No contract deployed at this address!");
                return false;
            }
            const latestBlock = await provider.getBlockNumber();
            const fromBlock = Math.max(latestBlock - 5000, 0); // Fetch only last 5000 blocks

            const iface = new ethers.Interface(SMART_CONTRACT_ABI);
            const eventSignature = "InitiativeCreated(bytes32,address,string,string,string,uint256)";
            const eventTopic = ethers.id(eventSignature);

            const logs = await provider.getLogs({
                address: contractAddress,
                topics: [eventTopic],
                fromBlock,
                toBlock: latestBlock
            });

            const initiatives = logs.slice(-MAX_INITIATIVES).map(log => {
                const { args } = iface.parseLog(log);
                return `- **${args.title}** by ${args.ideator} (Score: ${args.score})`;
            });

            return initiatives.length
                ? `**Recent CNS community ideas, needs or initiatives:**\n${initiatives.join("\n")}`
                : "No recent initiatives found.";
        } catch (error) {
            elizaLogger.error(`❌ Fetch error: ${error.message}`);
            return "Failed to fetch initiatives.";
        }
    },
};

export { ideasProvider };
