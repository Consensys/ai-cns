import {
    ConnectedNodes,
    ConnectedNodesProps,
} from "@/components/userprofile/connected-nodes";
import getConnectedNodes from "@/components/userprofile/random-nodes";
import { FunctionComponent, useMemo } from "react";
import { Hex } from "viem";
import { lineaSepolia } from "viem/chains";
import { useEnsName } from "wagmi";
// @ts-ignore
import Jazzicon from "@metamask/jazzicon";

export type AccountInfoProps = {
    address: Hex;
    badges: string[];
    activities: string[];
    creditBalance: number;
};

// Function to generate a Jazzicon-like gradient
const getGradientFromAddress = (address: Hex) => {
    const seed = parseInt(address.slice(2, 10), 16);
    const icon = Jazzicon(100, seed);

    // Extract computed style
    const computedStyle = window.getComputedStyle(icon);
    const primaryColor = computedStyle.backgroundColor || "#3498db"; // Default fallback

    // Convert RGB string to RGB values
    const rgbMatch = primaryColor.match(/\d+/g);
    if (!rgbMatch) return "linear-gradient(160deg, #3498db, #2980b9)"; // Fallback gradient

    let [r, g, b] = rgbMatch.map(Number);

    // Generate lighter and darker shades
    const lighterColor = `rgb(${Math.min(r + 50, 255)}, ${Math.min(
        g + 50,
        255
    )}, ${Math.min(b + 50, 255)})`;
    const darkerColor = `rgb(${Math.max(r - 50, 0)}, ${Math.max(
        g - 50,
        0
    )}, ${Math.max(b - 50, 0)})`;

    return `linear-gradient(160deg, ${lighterColor}, ${primaryColor}, ${darkerColor})`;
};

export const AccountInfo: FunctionComponent<AccountInfoProps> = ({
    address,
    badges,
    activities,
    creditBalance,
}) => {
    const { data: ensName, isLoading } = useEnsName({
        address,
        chainId: lineaSepolia.id,
    });

    const connectedNodes: ConnectedNodesProps = useMemo(
        () => getConnectedNodes(address),
        [address]
    );

    const getDisplayName = () => {
        if (isLoading) return "Loading...";
        return ensName || `${address.slice(0, 6)}...${address.slice(-4)}`;
    };

    return (
        <div
            className="flex flex-col h-screen"
            style={{
                background: getGradientFromAddress(address),
            }}
        >
            {/* Top Section: Connected Nodes */}
            <div className="flex-1 flex flex-col items-center justify-center relative">
                <ConnectedNodes data={connectedNodes} />
                <div className="absolute bottom-2 text-lg font-semibold text-white">
                    {getDisplayName()}
                </div>
            </div>

            {/* Bottom Section: Badges, Activities & Credit Balance */}
            <div className="bg-white p-6 flex rounded-t-3xl shadow-lg">
                {/* Left Side: Badges & Activities */}
                <div className="w-2/3 pr-6">
                    {/* Badges Section */}
                    <div className="bg-gray-50 shadow-sm rounded-lg p-4 mb-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            🎖️ Badges Earned
                        </h3>
                        {badges.length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-700">
                                {badges.map((badge, index) => (
                                    <li key={index}>{badge}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">
                                No badges earned yet.
                            </p>
                        )}
                    </div>

                    {/* Activities Section */}
                    <div className="bg-gray-50 shadow-sm rounded-lg p-4">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2">
                            📜 Recent Activities
                        </h3>
                        {activities.length > 0 ? (
                            <ul className="list-disc pl-5 text-gray-700">
                                {activities.map((activity, index) => (
                                    <li key={index}>{activity}</li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-gray-500">
                                No recent activities.
                            </p>
                        )}
                    </div>
                </div>

                {/* Right Side: Credit Balance */}
                <div className="w-1/4 bg-gray-50 shadow-sm rounded-lg p-4 flex flex-col items-center justify-center">
                    <h3 className="text-md font-semibold text-gray-700">
                        💰 Credit Balance
                    </h3>
                    <p className="text-lg font-bold text-green-600 mt-2">
                        {creditBalance} Credits
                    </p>
                </div>
            </div>
        </div>
    );
};
