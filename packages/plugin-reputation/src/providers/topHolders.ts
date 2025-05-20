import {
    elizaLogger,
    type IAgentRuntime,
    type Memory,
    type Provider,
    type State,
} from "@elizaos/core";
import { ethers } from "ethers";

// CNS Token ABI - including Transfer event and balanceOf function
const CNS_TOKEN_ABI = [
    {
        "anonymous": false,
        "inputs": [
            { "indexed": true, "name": "from", "type": "address" },
            { "indexed": true, "name": "to", "type": "address" },
            { "indexed": false, "name": "value", "type": "uint256" }
        ],
        "name": "Transfer",
        "type": "event"
    },
    {
        "inputs": [
            { "internalType": "address", "name": "account", "type": "address" }
        ],
        "name": "balanceOf",
        "outputs": [
            { "internalType": "uint256", "name": "", "type": "uint256" }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];

const CNS_TOKEN_ADDRESS = process.env.CNS_TOKEN_ADDRESS;

const topHoldersProvider: Provider = {
    get: async (_runtime: IAgentRuntime, _message: Memory, _state?: State) => {
        elizaLogger.info(`⏳ Provider: Fetch top CNS token holders`);
        try {
            const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
            const contract = new ethers.Contract(CNS_TOKEN_ADDRESS, CNS_TOKEN_ABI, provider);

            // Get all Transfer events
            const filter = contract.filters.Transfer();
            const events = await contract.queryFilter(filter, 0, "latest");

            // Create a map to track balances
            const balances = new Map<string, bigint>();

            // Process all transfer events to calculate current balances
            for (const event of events) {
                if (event instanceof ethers.EventLog) {
                    const from = event.args[0];
                    const to = event.args[1];
                    const value = event.args[2];

                    // Subtract from sender
                    if (from !== ethers.ZeroAddress) {
                        balances.set(from, (balances.get(from) || BigInt(0)) - value);
                    }
                    // Add to recipient
                    balances.set(to, (balances.get(to) || BigInt(0)) + value);
                }
            }

            // Convert to array and sort by balance
            const sortedHolders = Array.from(balances.entries())
                .filter(([address, balance]) => balance > BigInt(0)) // Filter out zero balances
                .sort((a, b) => (b[1] > a[1] ? 1 : -1))
                .slice(0, 20); // Get top 20

            // Format the response
            const formattedHolders = sortedHolders
                .map(([address, balance], index) => {
                    const formattedBalance = ethers.formatUnits(balance, 18);
                    return `${index + 1}. ${address}: ${formattedBalance} CNS`;
                })
                .join("\n");
            console.log(`**Top 20 CNS Token Holders:**\n${formattedHolders}`);
            return `**Top 20 CNS Token Holders:**\n${formattedHolders}`;
        } catch (error) {
            elizaLogger.error(`Error fetching top holders: ${error}`);
            return "Failed to fetch top CNS token holders. Please try again later.";
        }
    },
};

export { topHoldersProvider }; 