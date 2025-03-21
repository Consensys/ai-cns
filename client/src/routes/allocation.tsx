import { useEffect } from "react";
import { getInitiatives } from "../contracts/get-initiatives";
import { useState } from "react";
import { PageHeader } from "../components/page-header";
import { InitiativeCapitalAllocation } from "../components/cns/initiative-capital-allocation";
import { getInitiativesScores } from "../lib/cns/get-initiatives-scores";

export default function CapitalAllocation() {
    const [capitalAllocation, setCapitalAllocation] = useState<any[]>([]);

    useEffect(() => {
        let allScores: { initiativeId: `0x${string}`; newScore: bigint }[] = [];
        getInitiativesScores().then((scores) => {
            allScores = scores;
        });
        getInitiatives().then((initiatives) => {
            initiatives = initiatives?.filter(
                (initiative) => initiative.status === "CAPITAL_ALLOCATION"
            );
            const initiativesWithScores = initiatives?.map((initiative) => {
                const score = allScores?.find(
                    (score) => score.initiativeId === initiative.initiativeId
                );
                return { ...initiative, score: score?.newScore };
            });
            setCapitalAllocation(initiativesWithScores);
        });
    }, []);

    return (
        <div className="flex flex-col w-full h-[calc(100dvh)] p-4">
            <div className="flex-1 overflow-y-auto">
                <PageHeader title="Resource Allocation" />
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-4">
                        {capitalAllocation.map((a, i) => {
                            // temp for demo, fake balance
                            if (i <= 2) {
                                a.balance =
                                    a.balance === 0
                                        ? a.balance
                                        : 1252600000000000000 * (i + 1) * 1.333;
                            }
                            return (
                                <InitiativeCapitalAllocation
                                    key={a.initiativeId}
                                    initiative={a}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
