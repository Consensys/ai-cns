import { linea } from "viem/chains";
import { useEnsName } from "wagmi";
import { shortenAddress } from "../../lib/utils";

const demoEnsTweakForMembers = [
    {
        address: "0x65a4CeC9f1c6060f3b987d9332Bedf26e8E86D17",
        ensName: "satya.linea.eth",
    },
    {
        address: "0x17757544f255c78D3492bc2534DBfaDD7C1bD007",
        ensName: "fred.linea.eth",
    },
    {
        address: "0x2754265A82705CEe4Fca6343a5cdD36850348780",
        ensName: "jb.linea.eth",
    },
    {
        address: "0x44dc4e3309b80ef7abf41c7d0a68f0337a88f044",
        ensName: "dayan.linea.eth",
    },
    {
        address: "0x74CE467673E4D276914b80D452ceF6981FE6A01B",
        ensName: "julia.linea.eth",
    },
    {
        address: "0x644d7d4057FE667cd000038f6032C1F825b66EE0",
        ensName: "0xbuidler.linea.eth",
    },
    {
        address: "0x2bf8c39fb9733E11A81211f574364d6F601e286f",
        ensName: "danielfox.linea.eth",
    },
    {
        address: "0x01F8e269CADCD36C945F012d2EeAe814c42D1159",
        ensName: "lubAIn.linea.eth",
    },
    {
        address: "0xAf38d70E2Bfa1d13f025dB50315c9B4ec00a2b0c",
        ensName: "vitalAIk.linea.eth",
    },
    {
        address: "0x2799A7D358C347a40293ab996FeD08aff8157393",
        ensName: "satoshAI.linea.eth",
    },
    {
        address: "0x1e963CE147bd7e5FB29AE306c2f4145874593556",
        ensName: "eliza.linea.eth",
    },
    {
        address: "0x65a4CeC9f1c6060f3b987d9332Bedf26e8E86D17",
        ensName: "ethrules.linea.eth",
    },
    {
        address: "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
        ensName: "dayksx.linea.eth",
    },
    {
        address: "0x4D8aD86dEe297B5703E92465692999abDB0508c8",
        ensName: "john.linea.eth",
    },
];

export function Address({
    address,
    showFullAddress = false,
}: {
    address: `0x${string}`;
    showFullAddress: boolean;
}) {
    const { data: ensName } = useEnsName({ address, chainId: linea.id }); // always checking against mainnet
    let ensNameToDisplay = ensName;
    if (!ensNameToDisplay) {
        // temp tweak for demo
        const demoEns = demoEnsTweakForMembers.find(
            (member) => member.address === address
        );
        ensNameToDisplay = demoEns?.ensName;
    }
    return (
        <span className="text-sm">
            {ensNameToDisplay ||
                (showFullAddress ? address : shortenAddress(address))}
        </span>
    );
}
