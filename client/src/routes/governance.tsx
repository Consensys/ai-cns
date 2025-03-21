import { Suspense, use, useEffect, useState } from "react";
import { useAccount, useWriteContract } from "wagmi";
import { PageHeader } from "../components/page-header";
import { Plus, Minus, ThumbsUp, ThumbsDown } from "lucide-react";
import { getInitiatives } from "@/contracts/get-initiatives";
import { getVoteInfo } from "@/contracts/get-vote-info";
import { getUserCredits } from "@/contracts/get-user-credits";
import { createPublicClient, http } from "viem";
import { lineaSepolia } from "wagmi/chains";
import { InitiativeAbi } from "@/abi/Initiative.abi";
import { Button } from "@/components/ui/button";

const publicClient = createPublicClient({
    chain: lineaSepolia, // Ensure it's the correct chain
    transport: http(),
});

function InitiativesList({
    dataPromise,
    creditBalance,
    refreshCredits,
}: {
    dataPromise: Promise<any[]>;
    creditBalance: number;
    refreshCredits: () => void;
}) {
    const [initiativesDataPromise, setInitiativesDataPromise] =
        useState(dataPromise);
    const initiatives = use(initiativesDataPromise);
    const { address } = useAccount();
    const [votes, setVotes] = useState<{ [key: string]: number }>({});
    const [voteTypes, setVoteTypes] = useState<{
        [key: string]: boolean | undefined;
    }>({});
    const [creditsUsed, setCreditsUsed] = useState<{ [key: string]: number }>(
        {}
    );
    const [userVoted, setUserVoted] = useState<{ [key: string]: boolean }>({});
    const [pendingVotes, setPendingVotes] = useState<{
        [key: string]: boolean;
    }>({});
    const [pendingLaunch, setPendingLaunch] = useState<{
        [key: string]: boolean;
    }>({});
    const { writeContract } = useWriteContract();
    const fetchCredits = async () => {
        const creditsData = await Promise.all(
            initiatives.map(async (initiative) => {
                const voteInfo = await getVoteInfo(
                    initiative.initiativeId,
                    address
                );
                setUserVoted((prev) => ({
                    ...prev,
                    [initiative.initiativeId]: voteInfo.votesNumber > 0,
                }));

                setVotes((prev) => ({
                    ...prev,
                    [initiative.initiativeId]: voteInfo.votesNumber,
                }));

                setVoteTypes((prev) => ({
                    ...prev,
                    [initiative.initiativeId]: voteInfo.upvote,
                }));
                return {
                    [initiative.initiativeId]: voteInfo.votesNumber ** 2,
                };
            })
        );
        setCreditsUsed(Object.assign({}, ...creditsData));
    };

    useEffect(() => {
        if (address) {
            fetchCredits();
        }
    }, [address, initiatives]);

    const handleVote = (initiativeId: string, isIncrease: boolean) => {
        setVotes((prevVotes) => {
            const currentVotes = prevVotes[initiativeId] || 0;
            let newVotes = isIncrease ? currentVotes + 1 : currentVotes - 1;
            if (newVotes ** 2 > creditBalance) return prevVotes;
            setVoteTypes((prev) => ({
                ...prev,
                [initiativeId]:
                    newVotes > 0 ? true : newVotes === 0 ? undefined : false,
            }));

            setCreditsUsed((prevCredits) => ({
                ...prevCredits,
                [initiativeId]: newVotes ** 2,
            }));

            return { ...prevVotes, [initiativeId]: newVotes };
        });
    };

    const handleVoteSubmit = async (initiativeId: string) => {
        if (!address) {
            alert("Connect your wallet to vote!");
            return;
        }

        const voteCount = votes[initiativeId] || 0;
        if (voteCount === 0) {
            alert("Please select votes first!");
            return;
        }

        const isUpvote = voteCount > 0;

        try {
            // Start tracking pending vote
            setPendingVotes((prev) => ({ ...prev, [initiativeId]: true }));

            // Initiate transaction (but it doesn’t return a hash)
            writeContract(
                {
                    address: import.meta.env
                        .VITE_CNS_INITIATIVE_CONTRACT_ADDRESS,
                    abi: InitiativeAbi,
                    functionName: isUpvote ? "upvote" : "downvote",
                    args: [initiativeId, Math.abs(voteCount)],
                },
                {
                    onSuccess: async (tx) => {
                        console.log("Transaction sent! Hash:", tx);

                        // Wait for confirmation
                        await publicClient.waitForTransactionReceipt({
                            hash: tx,
                        });

                        // Mark as voted
                        setUserVoted((prev) => ({
                            ...prev,
                            [initiativeId]: true,
                        }));
                        setPendingVotes((prev) => ({
                            ...prev,
                            [initiativeId]: false,
                        }));
                        setInitiativesDataPromise(getInitiatives());
                        refreshCredits();
                        alert("Vote submitted successfully!");
                    },
                    onError: (error) => {
                        console.error("Vote transaction failed:", error);
                        setPendingVotes((prev) => ({
                            ...prev,
                            [initiativeId]: false,
                        }));
                        alert("Vote failed!");
                    },
                }
            );
        } catch (error) {
            console.error("Error submitting vote:", error);
            alert("Vote failed!");
            setPendingVotes((prev) => ({
                ...prev,
                [initiativeId]: false,
            }));
        }
    };

    const handleLaunch = async (initiativeId: string) => {
        try {
            setPendingLaunch((prev) => ({ ...prev, [initiativeId]: true }));
            await writeContract(
                {
                    address: import.meta.env
                        .VITE_CNS_INITIATIVE_CONTRACT_ADDRESS,
                    abi: InitiativeAbi,
                    functionName: "updateStatus",
                    args: [initiativeId, "CAPITAL_ALLOCATION"],
                },
                {
                    onSuccess: async (tx) => {
                        console.log("Transaction sent! Hash:", tx);

                        await publicClient.waitForTransactionReceipt({
                            hash: tx,
                        });
                        setPendingLaunch((prev) => ({
                            ...prev,
                            [initiativeId]: false,
                        }));
                        setInitiativesDataPromise(getInitiatives());
                        alert("Initiative launched successfully!");
                    },
                    onError: (error) => {
                        console.error("Transaction failed:", error);
                        setPendingLaunch((prev) => ({
                            ...prev,
                            [initiativeId]: false,
                        }));
                        alert("Launch failed!");
                    },
                }
            );
        } catch (error) {
            console.error("Error launching initiative:", error);
            setPendingLaunch((prev) => ({ ...prev, [initiativeId]: false }));
            alert("Launch failed!");
        }
    };

    return (
        <div className="flex flex-col gap-8 items-center w-full">
            {initiatives.length > 0 ? (
                initiatives.map((initiative) => {
                    const votesCount = votes[initiative.initiativeId] || 0;
                    const voteType = voteTypes[initiative.initiativeId];
                    return (
                        <div
                            className="flex flex-row gap-4"
                            key={initiative.initiativeId}
                        >
                            <div className="relative flex flex-col items-center justify-between border border-gray-600 rounded-lg p-6 bg-gray-900 shadow-md w-[700px] min-h-[140px] mb-12">
                                <div className="flex flex-col justify-center flex-grow">
                                    <h3 className="text-md font-bold text-white mb-3 truncate">
                                        {initiative.title}
                                    </h3>
                                    <p className="text-sm text-gray-400">
                                        {initiative.description}
                                    </p>
                                </div>
                                <div className="absolute flex flex-col bottom-[-70px] bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-md shadow-md border border-gray-600 flex items-center gap-1">
                                    <div className="flex flex-row items-center gap-1">
                                        Total
                                    </div>
                                    <div className="flex flex-row items-center gap-3">
                                        <ThumbsUp className="w-6 h-6 text-green-500" />
                                        <span>{initiative.upvotes}</span>
                                    </div>
                                    <div className="flex flex-row items-center gap-3">
                                        <ThumbsDown className="w-6 h-6 text-red-500" />
                                        <span>{initiative.downvotes}</span>
                                    </div>
                                </div>
                                {voteType !== undefined && (
                                    <div className="absolute flex flex-col bottom-[-50px] right-[190px] bg-gray-700 text-white text-sm font-bold px-4 py-2 rounded-md shadow-md border border-gray-600 items-center gap-1">
                                        <div className="flex flex-row items-center gap-1">
                                            ME
                                        </div>
                                        <div className="flex flex-row items-center gap-3">
                                            <span>
                                                {(voteTypes[
                                                    initiative.initiativeId
                                                ]
                                                    ? "+"
                                                    : "-") +
                                                    Math.abs(votesCount)}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {initiative.upvotes - initiative.downvotes >=
                                    5 &&
                                    initiative.status === "IDEATION" &&
                                    !pendingLaunch[initiative.initiativeId] && (
                                        <Button
                                            className="absolute flex flex-col items-center right-[1px] top-[1px] px-4 py-2 rounded-md bg-yellow-500 text-sm font-bold"
                                            onClick={() =>
                                                handleLaunch(
                                                    initiative.initiativeId
                                                )
                                            }
                                        >
                                            Launch
                                        </Button>
                                    )}
                                {initiative.status !== "IDEATION" &&
                                    !pendingLaunch[initiative.initiativeId] && (
                                        <div className="absolute flex flex-col items-center right-[1px] top-[1px] px-4 py-2 rounded-md bg-gray-800 text-white shadow-md">
                                            {initiative.status ===
                                            "CAPITAL_ALLOCATION"
                                                ? " Launched"
                                                : " Building"}
                                        </div>
                                    )}
                                {pendingLaunch[initiative.initiativeId] && (
                                    <div className="absolute flex flex-col items-center right-[1px] top-[1px] px-4 py-2 rounded-md bg-gray-800 text-white shadow-md">
                                        Launching...
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col">
                                {!userVoted[initiative.initiativeId] ? (
                                    pendingVotes[initiative.initiativeId] ? (
                                        <div className="flex flex-row items-center gap-4 bg-gray-900 p-4 rounded-lg shadow-md min-w-[180px] border border-gray-700">
                                            Voting...
                                        </div>
                                    ) : (
                                        <div className="flex flex-row items-center gap-4 bg-gray-900 p-4 rounded-lg shadow-md min-w-[180px] border border-gray-700">
                                            <div className="flex flex-col gap-2">
                                                <div className="flex flex-row gap-4 items-center">
                                                    <div className="flex flex-col gap-4">
                                                        <button
                                                            className="bg-gray-700 text-white p-2 rounded-full shadow-md hover:bg-green-500"
                                                            onClick={() =>
                                                                handleVote(
                                                                    initiative.initiativeId,
                                                                    true
                                                                )
                                                            }
                                                        >
                                                            <Plus className="w-6 h-6" />
                                                        </button>
                                                        <button
                                                            className="bg-gray-700 text-white p-2 rounded-full shadow-md hover:bg-red-500"
                                                            onClick={() =>
                                                                handleVote(
                                                                    initiative.initiativeId,
                                                                    false
                                                                )
                                                            }
                                                        >
                                                            <Minus className="w-6 h-6" />
                                                        </button>
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <button
                                                            className={`px-4 py-2 rounded-lg shadow-md text-white ${
                                                                creditsUsed[
                                                                    initiative
                                                                        .initiativeId
                                                                ] === 0
                                                                    ? "bg-gray-500 cursor-not-allowed"
                                                                    : "bg-blue-500 hover:bg-blue-600"
                                                            }`}
                                                            disabled={
                                                                creditsUsed[
                                                                    initiative
                                                                        .initiativeId
                                                                ] === 0
                                                            }
                                                            onClick={() =>
                                                                handleVoteSubmit(
                                                                    initiative.initiativeId
                                                                )
                                                            }
                                                        >
                                                            Vote
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="flex flex-row gap-4">
                                                    Credits used :{" "}
                                                    {
                                                        creditsUsed[
                                                            initiative
                                                                .initiativeId
                                                        ]
                                                    }
                                                </div>
                                            </div>
                                        </div>
                                    )
                                ) : (
                                    <div className="flex flex-col items-center gap-4 bg-gray-900 p-4 rounded-lg shadow-md min-w-[180px] border border-gray-700">
                                        <div className="flex flex-row gap-4 text-lg font-bold">
                                            Voted
                                        </div>
                                        <div className="flex flex-row gap-4">
                                            Credits used :{" "}
                                            {
                                                creditsUsed[
                                                    initiative.initiativeId
                                                ]
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })
            ) : (
                <p className="text-gray-400">No initiatives found.</p>
            )}
        </div>
    );
}

export default function Governance() {
    const { address } = useAccount();
    const [remainingCredits, setRemainingCredits] = useState<number>(0);

    const fetchAndUpdateCredits = async () => {
        if (!address) return;
        const credits: number = (await getUserCredits(address)) as number;
        setRemainingCredits(credits);
    };

    useEffect(() => {
        fetchAndUpdateCredits();
    }, [address]);

    return (
        <div className="flex flex-col w-full h-[calc(100dvh)] p-4">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="Governance" />
                <div className="grid grid-cols-[3fr_1fr] gap-6 items-start">
                    <div className="flex flex-col items-center justify-center rounded-lg p-6 min-h-[400px]">
                        <h2 className="text-xl font-bold text-white mb-8">
                            Ideas
                        </h2>
                        <Suspense
                            fallback={
                                <p className="text-gray-400">
                                    Loading initiatives...
                                </p>
                            }
                        >
                            <InitiativesList
                                dataPromise={getInitiatives()}
                                creditBalance={remainingCredits}
                                refreshCredits={fetchAndUpdateCredits}
                            />
                        </Suspense>
                    </div>
                    <div className="flex flex-col items-start p-4 border border-gray-700 rounded-lg w-[160px] min-h-[140px] shadow-md bg-gray-900">
                        <h2 className="text-md font-semibold text-white">
                            Credit Balanace
                        </h2>
                        <div className="w-full h-[40px] flex items-center justify-center bg-gray-700 text-white font-bold rounded-md border border-gray-600">
                            {remainingCredits}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
