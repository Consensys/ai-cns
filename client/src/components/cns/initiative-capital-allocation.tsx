import { Button } from "../ui/button";
import { createPublicClient, formatEther, http, parseEther } from "viem";
import { Badge } from "../ui/badge";
import { Address } from "./address";
import { useAccount, useWriteContract } from "wagmi";
import { InitiativeScore } from "./cns-initiative-score";
import { InitiativeAbi } from "../../abi/Initiative.abi";
import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogTitle } from "@radix-ui/react-dialog";
import { getTeamMembersForInitiative } from "@/contracts/get-team-members";
import { lineaSepolia } from "viem/chains";

const publicClient = createPublicClient({
    chain: lineaSepolia, // Ensure it's the correct chain
    transport: http(),
});

export function InitiativeCapitalAllocation({
    initiative,
}: {
    initiative: any;
}) {
    const { isConnected, address } = useAccount();
    const { writeContract } = useWriteContract();
    const [teamMembers, setTeamMembers] = useState<`0x${string}`[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [amount, setAmount] = useState("");
    const [balance, setBalance] = useState<bigint>(
        BigInt(initiative.funding ?? 0)
    );

    const [isJoining, setIsJoining] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [isAllocating, setIsAllocating] = useState(false);

    useEffect(() => {
        async function fetchTeamMembers() {
            const members = [];
            if (
                initiative.ideator !==
                "0x0000000000000000000000000000000000000000"
            ) {
                members.push(initiative.ideator);
            }
            if (
                initiative.instigator !==
                "0x0000000000000000000000000000000000000000"
            ) {
                members.push(initiative.instigator);
            }
            const teamMembers = await getTeamMembersForInitiative(
                initiative.initiativeId
            );
            members.push(...teamMembers);
            setTeamMembers(Array.from(members));
        }
        fetchTeamMembers();
    }, [initiative.initiativeId]);

    function getRole(initiative: any, address: `0x${string}`): string {
        return initiative.instigator === address
            ? "instigator"
            : initiative.ideator === address
            ? "ideator"
            : "member";
    }

    async function joinTeam() {
        if (!address) return;
        setIsJoining(true);

        writeContract(
            {
                address: import.meta.env.VITE_CNS_INITIATIVE_CONTRACT_ADDRESS,
                abi: InitiativeAbi,
                functionName: "addTeamMember",
                args: [initiative.initiativeId, address],
            },
            {
                onSuccess: async (tx) => {
                    console.log("Transaction sent! Hash:", tx);

                    await publicClient.waitForTransactionReceipt({
                        hash: tx,
                    });

                    setTeamMembers((prevMembers) =>
                        prevMembers.includes(address)
                            ? prevMembers
                            : [...prevMembers, address]
                    );
                    setIsJoining(false);
                    alert("🎉 Successfully joined the team!");
                },
                onError: (error) => {
                    setIsJoining(false);
                    console.error("Transaction failed:", error);
                    alert("❌ Failed to join the team. Please try again.");
                },
            }
        );
    }

    async function leaveTeam() {
        if (!address) return;
        setIsLeaving(true);

        writeContract(
            {
                address: import.meta.env.VITE_CNS_INITIATIVE_CONTRACT_ADDRESS,
                abi: InitiativeAbi,
                functionName: "removeTeamMember",
                args: [initiative.initiativeId, address],
            },
            {
                onSuccess: async (tx) => {
                    console.log("Transaction sent! Hash:", tx);

                    await publicClient.waitForTransactionReceipt({ hash: tx });

                    setTeamMembers((prevMembers) =>
                        prevMembers.filter((member) => member !== address)
                    );
                    setIsLeaving(false);
                    alert("✅ Successfully left the team!");
                },
                onError: (error) => {
                    setIsLeaving(false);
                    console.error("Transaction failed:", error);
                    alert("❌ Failed to leave the team. Please try again.");
                },
            }
        );
    }

    async function allocateFunds() {
        if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
            alert("⚠️ Please enter a valid amount!");
            return;
        }
        setIsAllocating(true);
        setIsModalOpen(false);
        await writeContract(
            {
                address: import.meta.env.VITE_CNS_INITIATIVE_CONTRACT_ADDRESS,
                abi: InitiativeAbi,
                functionName: "allocateFund",
                args: [initiative.initiativeId],
                value: parseEther(amount),
            },
            {
                onSuccess: async (tx) => {
                    console.log("Transaction sent! Hash:", tx);
                    await publicClient.waitForTransactionReceipt({ hash: tx });
                    setAmount("");
                    setIsAllocating(false);
                    alert("✅ Funds allocated successfully!");

                    setBalance(
                        (prevBalance) =>
                            (prevBalance ?? 0n) + parseEther(amount)
                    );
                },
                onError: (error) => {
                    setIsAllocating(false);
                    console.error("Transaction failed:", error);
                    alert("❌ Failed to allocate funds. Please try again.");
                },
            }
        );
    }

    return (
        <div className="grid grid-cols-3 gap-4 border rounded-lg p-4">
            <div className="grid col-span-2">
                <div className="font-bold mb-5">{initiative.title}</div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <div className="flex text-xs text-gray-400 uppercase mb-2">
                            Description
                        </div>
                        <div className="text-sm">
                            {initiative.description?.substring(0, 200)}
                            {initiative.description?.length > 100 && "..."}
                        </div>
                    </div>
                    <div>
                        <div className="flex text-xs text-gray-400 uppercase mb-2">
                            Team
                        </div>
                        <div className="flex flex-col gap-2">
                            {teamMembers.map((m) => (
                                <div key={m} className="flex gap-3">
                                    <Address
                                        address={m as `0x${string}`}
                                        showFullAddress={false}
                                    />
                                    <Badge>{getRole(initiative, m)}</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex flex-col gap-4">
                <div className="grid grid-cols-2 items-center">
                    <div className="flex text-xl">
                        <div className="mr-4">Allocated</div>
                        <div className="font-bold">
                            Ξ {formatEther(balance ?? 0n)?.substring(0, 5)}
                        </div>
                    </div>
                    <div className="flex">
                        <InitiativeScore score={initiative.score ?? 1n} />
                    </div>
                </div>

                <Button
                    className="w-full bg-blue-600 hover:bg-blue-400 text-white font-bold"
                    disabled={
                        !isConnected ||
                        isJoining ||
                        isLeaving ||
                        address === initiative.instigator ||
                        address === initiative.ideator
                    }
                    onClick={
                        teamMembers.includes(address || "0x")
                            ? leaveTeam
                            : joinTeam
                    }
                >
                    {isJoining
                        ? "Joining..."
                        : isLeaving
                        ? "Leaving..."
                        : address !== initiative.ideator &&
                          address !== initiative.instigator &&
                          teamMembers.includes(address || "0x")
                        ? "Leave Team"
                        : "Join Team"}
                </Button>

                <Button
                    className="w-full bg-yellow-500 hover:bg-yellow-400 text-sm font-bold"
                    onClick={() => setIsModalOpen(true)}
                    disabled={!isConnected || isAllocating}
                >
                    {isAllocating
                        ? "Allocating..."
                        : isConnected
                        ? "Allocate Funds"
                        : "Connect Wallet to Allocate Funds"}
                </Button>
            </div>

            {/* ETH Input Modal */}
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogTitle>Allocate Funds</DialogTitle>
                    <div className="flex flex-col gap-3">
                        <label className="text-sm text-gray-600">
                            Enter ETH Amount
                        </label>
                        <Input
                            type="number"
                            min="0"
                            placeholder="e.g. 0.05"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>
                    <div className="flex justify-end gap-2 mt-4">
                        <Button
                            variant="outline"
                            onClick={() => setIsModalOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={allocateFunds}
                            className="bg-yellow-500 hover:bg-yellow-400"
                        >
                            Confirm & Send
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
