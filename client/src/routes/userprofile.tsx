import { useParams } from "react-router";
import { AccountInfo } from "./account-info";
import { FunctionComponent } from "react";
import { Hex } from "viem";

export const UserProfile: FunctionComponent = () => {
    const { netizenId } = useParams<{ netizenId: Hex }>();
    return (
        netizenId && (
            <div className="flex flex-col w-full h-[calc(100dvh)] p-4">
                <AccountInfo
                    address={netizenId}
                    badges={["Software Engineer", "Blockchain Developer"]}
                    activities={[
                        "Voted for Initiative 0x1234",
                        "Proposed Initiative 0x5678",
                    ]}
                    creditBalance={100}
                ></AccountInfo>
            </div>
        )
    );
};
