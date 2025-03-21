import { elizaLogger, type IAgentRuntime, type Memory, type Provider, type State } from "@elizaos/core";
import { ethers } from "ethers";

const SMART_CONTRACT_ADDRESS = "0xAb62C6A194ED8Fd6c96db2d63957Db7e1578144F";
const SMART_CONTRACT_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": false, "internalType": "bytes32", "name": "initiativeId", "type": "bytes32" },
            { "indexed": false, "internalType": "address", "name": "instigator", "type": "address" },
            { "indexed": false, "internalType": "string", "name": "title", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "description", "type": "string" },
            { "indexed": false, "internalType": "string", "name": "category", "type": "string" }
        ],
        "name": "InitiativeCreated",
        "type": "event"
    }
];

const ideasProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        elizaLogger.info(`⏳ Provider: Fetch registered ideas to provide the information to the Agent`);
        try {
            const iface = new ethers.Interface(SMART_CONTRACT_ABI);
            const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
            const latestBlock = await provider.getBlockNumber();
            const deploymentBlock = 19362031; // Your contract's deployment block
            const batchSize = 9999; // Stay within provider limits
    
            let fromBlock = deploymentBlock;
            let allInitiatives: any[] = [];
    
            while (fromBlock <= latestBlock) {
                const toBlock = Math.min(fromBlock + batchSize, latestBlock);
                console.log(`🔧 Fetching logs from block ${fromBlock} to ${toBlock}`);
                const logs = await provider.getLogs({
                    address: process.env.CNS_INITIATIVE_CONTRACT_ADDRESS,
                    topics: [iface.getEvent("InitiativeCreated").topicHash],
                    fromBlock,
                    toBlock
                });
    
                const initiatives = logs.map(log => {
                    const parsedLog = iface.parseLog(log);
                    return {
                        initiativeId: parsedLog.args.initiativeId,
                        instigator: parsedLog.args.instigator,
                        title: parsedLog.args.title,
                        description: parsedLog.args.description,
                        category: parsedLog.args.category
                    };
                });
    
                allInitiatives = [...allInitiatives, ...initiatives];
                fromBlock = toBlock + 1;
            }

            // Formatting the initiatives in a more structured and readable way
            if (allInitiatives.length === 0) {
                return "No initiatives have been registered on-chain yet.";
            }

            const formattedInitiatives = allInitiatives.map((initiative, index) => {
                return `
                    **Initiative #${index + 1}**
                    - **ID:** ${initiative.initiativeId}
                    - **Instigator:** ${initiative.instigator}
                    - **Title:** ${initiative.title}
                    - **Description:** ${initiative.description}
                    - **Category:** ${initiative.category}`;
            }).join("\n");

            return `**The Consensys Network State (CNS) initiatives registered on-chain by the community (smart contract address: ${process.env.CNS_INITIATIVE_CONTRACT_ADDRESS}): ** ${formattedInitiatives}`;

        } catch (error) {
            console.error("Error fetching initiatives:", error);
            return "Failed to retrieve initiatives.";
        }
    },
};

export { ideasProvider };
