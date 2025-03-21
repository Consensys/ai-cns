import { useEffect } from "react";
import { useState } from "react";
import { getCnsEthBalance, getCnsTokenBalance } from "../../lib/viem-utils";
import { formatEther } from "viem";
import { FinanceChart } from "./finance-chart";

export function CnsTreasury() {
    const [balance, setBalance] = useState<bigint>(0n);
    const [tokenBalance, setTokenBalance] = useState<bigint>(0n);
    useEffect(() => {
        getCnsEthBalance().then((ethBalance) => {
            setBalance(ethBalance);
        });
        getCnsTokenBalance().then((tokenBalance) => {
            setTokenBalance(tokenBalance);
        });
    }, []);

    return (
        <div className="flex flex-col gap-4 border border-gray-700 rounded-lg p-4  ">
            <span className="text-xl font-bold">Finance</span>
            <div className="grid grid-cols-2 place-content-evenly items-center gap-20">
                <div className="flex text-3xl font-bold justify-center gap-2 bg-black rounded-lg p-8">
                    <span>Ξ {formatEther(balance)?.substring(0, 5)}</span>
                </div>
                <div className="flex text-3xl font-bold justify-center gap-2 bg-black rounded-lg p-8">
                    <span>
                        $CNS {formatEther(tokenBalance)?.substring(0, 5)}
                    </span>
                </div>
            </div>
            <div>
                <FinanceChart />
            </div>
        </div>
    );
}
