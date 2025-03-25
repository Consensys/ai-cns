import { createPublicClient, http, Hex, parseAbiItem } from "viem";
import { lineaSepolia } from "viem/chains";
import { getInitiatives } from "./get-initiatives";

// Initialize the Viem public client
const publicClient = createPublicClient({
    chain: lineaSepolia,
    transport: http(),
});

const initiativeContractAddress = import.meta.env
    .VITE_CNS_INITIATIVE_CONTRACT_ADDRESS;

// Event ABIs
const eventFilters = {
    TeamMemberAdded: parseAbiItem(
        "event TeamMemberAdded(bytes32 initiativeId, address member)"
    ),
    TeamMemberRemoved: parseAbiItem(
        "event TeamMemberRemoved(bytes32 initiativeId, address member)"
    ),
};

// Function to get initiatives for a specific address
export async function getProjectsForUser(userAddress: Hex) {
    try {
        // Get all initiatives from the existing function
        const allInitiatives = await getInitiatives();

        // Track the user's initiatives with their role
        const userInitiatives: {
            initiativeId: Hex;
            title: string;
            description: string;
            role: string;
        }[] = [];

        // Fetch team member logs
        const addedLogs = await publicClient.getLogs({
            address: initiativeContractAddress,
            event: eventFilters.TeamMemberAdded,
            fromBlock: BigInt(0),
            toBlock: "latest",
        });

        const removedLogs = await publicClient.getLogs({
            address: initiativeContractAddress,
            event: eventFilters.TeamMemberRemoved,
            fromBlock: BigInt(0),
            toBlock: "latest",
        });

        // Track active team memberships
        const teamMemberships = new Map<Hex, Set<Hex>>();

        for (const log of addedLogs) {
            const { initiativeId, member } = log.args as {
                initiativeId: Hex;
                member: Hex;
            };
            if (!teamMemberships.has(initiativeId)) {
                teamMemberships.set(initiativeId, new Set());
            }
            teamMemberships.get(initiativeId)!.add(member.toLowerCase() as Hex);
        }

        for (const log of removedLogs) {
            const { initiativeId, member } = log.args as {
                initiativeId: Hex;
                member: Hex;
            };
            teamMemberships
                .get(initiativeId)
                ?.delete(member.toLowerCase() as Hex);
        }

        // Iterate over all initiatives and check the user's role
        for (const initiative of allInitiatives) {
            const normalizedUserAddress = userAddress.toLowerCase() as Hex;
            const { initiativeId, title, description, ideator, instigator } =
                initiative;

            if (ideator.toLowerCase() === normalizedUserAddress) {
                userInitiatives.push({
                    initiativeId,
                    title,
                    description,
                    role: "Ideator",
                });
            } else if (instigator.toLowerCase() === normalizedUserAddress) {
                userInitiatives.push({
                    initiativeId,
                    title,
                    description,
                    role: "Instigator",
                });
            } else if (
                teamMemberships.get(initiativeId)?.has(normalizedUserAddress)
            ) {
                userInitiatives.push({
                    initiativeId,
                    title,
                    description,
                    role: "Team Member",
                });
            }
        }

        return userInitiatives;
    } catch (error) {
        console.error("Error fetching initiatives for address:", error);
        return [];
    }
}
