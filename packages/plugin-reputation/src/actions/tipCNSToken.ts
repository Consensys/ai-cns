import {
    composeContext,
    type Content,
    elizaLogger,
    generateObjectDeprecated,
    type HandlerCallback,
    type IAgentRuntime,
    type Memory,
    ModelClass,
    type State,
    type Action,
    ActionExample,
    generateText,
} from "@elizaos/core";
import { ethers } from "ethers";

const isValidEVMAddress = (address: string) => {
    return ethers.isAddress(address);
};

type tipInformation = {
    recipient: string | null;
    sender: string | null;
    amount: string | null;
    reason: string | null;
};

const tippingContext = `# Extract $CNS Tipping Details
Respond with a JSON markdown block containing the relevant $CNS tipping details based on {{senderName}}'s request.

## **Recent Messages**
{{recentMessages}}

## **Example Response**
\`\`\`json
{
    "recipient": "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
    "issuer": "0xd6EdD1484D45f8EF0f2eEB04db9DDDC401F09FC0",
    "amount": 100,
    "reason": "For supporting the team during the last social hack"
}
\`\`\`

## **Instructions**
{{senderName}} intends to send $CNS tokens to express gratitude or respect to a netizen.  
Your task is to extract the necessary details and return a JSON object for minting and transferring the $CNS ERC-20 tokens to the recipient.

### **Mandatory Fields to Extract**  
- **Recipient's EVM address** → Must be a valid \`0x[a-fA-F0-9]{40}\` address.  
- **Amount** → The exact amount of $CNS tokens to be sent.  

### **Optional Fields**  
- **Issuer's identity** → This need to be infer without asking, it can be an EVM address, username, petname, or client identifier.  
- **Reason** → If no explicit reason is mentioned, infer one from the tipping context.  

If conflicting details are present, **favor the most explicit and recent statements**.

### **Response Format**  
Return **only** the extracted data as a JSON markdown block.`;


const missingElementTemplate = `# Request for Missing Information for $CNS Tipping
Based on {{senderName}}'s recent messages, identify the missing details required to complete the $CNS token transfer.

## **Recent Messages**
{{recentMessages}}

## **Instructions**
{{senderName}} wants to tip a recipient with $CNS, but some required details are missing.  
Your task is to **ask for the missing information directly**, without acknowledgment or extra explanations.

### **Mandatory Missing Details**  
{{#if !recipient}}- **Recipient's EVM address** → Must be a valid \`0x[a-fA-F0-9]{40}\` address.{{/if}}  
{{#if !amount}}- **Amount of $CNS** → The exact number of tokens to be sent.{{/if}}  

### **Optional Missing Details**  
{{#if !reason}}- **Reason for the tip** → This is optional, but you can ask {{senderName}} for more context.{{/if}}  

## **Response Format**  
- Respond in **{{agentName}}'s** style and personality.  
- Ask for all missing details in **a single message**.  
- Do **not** acknowledge the request—just ask for the required information.  
- Do **not** generate any output if all required fields are already provided.  
`;

export const tipCNSTokenAction: Action = {
    name: "TIP",
    similes: [
        "SEND_TIP",
        "GIVE_TIP",
        "TRANSFER_TIP",
    ],
    description:
        "Only use this action when a user ask to send $CNS token to a specific EVM address",

    validate: async (_runtime: IAgentRuntime, _message: Memory) => {
        elizaLogger.info(`Tipping validation`);

        // placeholder: check if the given user is allowed to tip
        return true;
    },
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {

        elizaLogger.info("🚀 Handling $CNS token transfer");

        try {
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Extract tipping information
            const tipContext = composeContext({
                state,
                template: tippingContext,
            });
            const tipInformation: tipInformation = await generateObjectDeprecated({
                runtime,
                context: tipContext,
                modelClass: ModelClass.SMALL,
            });
            console.log('🛠 Tipping information: ', tipInformation);
            
            let { recipient, amount, reason } = tipInformation;

            if (callback) {
                if (isValidEVMAddress(recipient) && amount != 'null' && reason != 'null') {
                    console.log('🚀 ==== Minting and transfering $CNS token ===');

                    const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
                    const signer = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);
                    const contract = new ethers.Contract(process.env.CNS_TOKEN_ADDRESS, ["function mint(address recipient, uint256 amount) public"], signer);
                    
                    // Step 3: Mint tokens
                    const parsedAmount = ethers.parseUnits(amount, 18);
                    console.log(`contract.mint(${recipient}, ${parsedAmount})`)
                    const tx = await contract.mint(recipient, parsedAmount);
                    await tx.wait();
            
                    elizaLogger.info(`✅ $CNS token successfully transfered: ${tx.hash}`);
                    callback({
                        text: `${recipient} has been tipped ${amount} $CNS token for "${reason}". Tx: ${tx.hash}. Transaction Hash: https://sepolia.lineascan.build/tx/${tx.hash}`,
                    });

                    return true;

                } else {
                    console.log('🚫 ==== Missing information for tipping ===', {isvalidEVMAddress: isValidEVMAddress(receipient), amount: amount, reason: reason});
                    // Ask for missing tipping information
                    const tipMissingInfoContext = composeContext({
                        state,
                        template: missingElementTemplate,
                    });
                    const tipMissingInfoAsking = await generateText({
                        runtime,
                        context: tipMissingInfoContext,
                        modelClass: ModelClass.SMALL,
                    });

                    callback({
                        text: tipMissingInfoAsking,
                    });
                }
            }
            return false;

        } catch (error) {
            elizaLogger.error(`Oops, something went wrong: ${error}`);
            return false;
        }
    },
    examples: [
        [
            {
                user: "{{user1}}",
                content: { text: "Hey {{agentName}}, please tip $ETH to @vitalik for creating Ethereum and bringing it there!" },
            },
            {
                user: "{{user1}}",
                content: { text: "A total of 10000 $ETH!" },
            },
            {
                user: "{{user1}}",
                content: { text: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045" },
            },
            {
                user: "{{user2}}",
                content: { text: "Copy that! Let's do that", action: "TIP" },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Tipping 50 $DAI to @jane for her great presentation!" },
            },
            {
                user: "{{user1}}",
                content: { text: "0xabcdefabcdefabcdefabcdefabcdefabcdefabcdef" },
            },
            {
                user: "{{user2}}",
                content: { text: "Tip sent!", action: "TIP" },
            }
        ],
        [
            {
                user: "{{user1}}",
                content: { text: "Please tip 200 to @bob for his help with the project!" },
            },
            {
                user: "{{user1}}",
                content: { text: "with $USDC!" },
            },
            {
                user: "{{user1}}",
                content: { text: "@bob address is 0x9876543210fedcba9876543210fedcba98765432" },
            },
            {
                user: "{{user2}}",
                content: { text: "Done @bob received your tip! ", action: "TIP" },
            }
        ]
    ] as ActionExample[][],
} as Action;