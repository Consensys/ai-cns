const SAMPLE_ETHEREUM_ADDRESSES = [
    "0xD7B8A2E5C1F4A6D7B9C3D5A9B6F7C8D1E2A4C6B",
    "0x8A2E5C1F4A6D7B9C3D5A9B6F7C8D1E2A4C6B9D7",
    "0x5C1F4A6D7B9C3D5A9B6F7C8D1E2A4C6B9D7B8A2",
    "0x1F4A6D7B9C3D5A9B6F7C8D1E2A4C6B9D7B8A2E5",
    "0xD7B9C3D5A9B6F7C8D1E2A4C6B9D7B8A2E5C1F4A",
    "0x3D5A9B6F7C8D1E2A4C6B9D7B8A2E5C1F4A6D7B9",
    "0x9B6F7C8D1E2A4C6B9D7B8A2E5C1F4A6D7B9C3D5",
    "0xF7C8D1E2A4C6B9D7B8A2E5C1F4A6D7B9C3D5A9B",
];

const getConnectedNodes = (mainAddress: string): any => {
    return {
        nodes: [
            { id: mainAddress, group: 1, isMain: true },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[0],
                group: 2,
                isMain: false,
            },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[1],
                group: 2,
                isMain: false,
            },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[2],
                group: 3,
                isMain: false,
            },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[3],
                group: 3,
                isMain: false,
            },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[4],
                group: 3,
                isMain: false,
            },
            {
                id: SAMPLE_ETHEREUM_ADDRESSES[5],
                group: 3,
                isMain: false,
            },
        ],
        links: [
            {
                source: mainAddress,
                target: SAMPLE_ETHEREUM_ADDRESSES[0],
            },
            {
                source: mainAddress,
                target: SAMPLE_ETHEREUM_ADDRESSES[1],
            },
            {
                source: SAMPLE_ETHEREUM_ADDRESSES[0],
                target: SAMPLE_ETHEREUM_ADDRESSES[2],
            },
            {
                source: SAMPLE_ETHEREUM_ADDRESSES[0],
                target: SAMPLE_ETHEREUM_ADDRESSES[3],
            },
            {
                source: SAMPLE_ETHEREUM_ADDRESSES[1],
                target: SAMPLE_ETHEREUM_ADDRESSES[4],
            },
            {
                source: SAMPLE_ETHEREUM_ADDRESSES[1],
                target: SAMPLE_ETHEREUM_ADDRESSES[5],
            },
        ],
    };
};

export default getConnectedNodes;
