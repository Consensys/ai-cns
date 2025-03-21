import {
    type IAgentRuntime,
    type Memory,
    type State,
    type Action,
    type HandlerCallback,
    elizaLogger,
    composeContext,
    ModelClass,
    generateObjectDeprecated,
    generateText,
    ActionExample,
    generateTrueOrFalse
} from "@elizaos/core";
import { VeraxSdk } from "@verax-attestation-registry/verax-sdk";

import { ethers } from "ethers";

const isValidEVMAddress = (address: string) => {
    return ethers.isAddress(address);
};

const ensureIng = (scope: string): string => 
    scope.endsWith("ing") ? scope : `${scope}ing`;

type AttestationInformation = {
    subject: string | null;
    scope: string | null;
    isTrustworthy: string | null;
    reasons: [string] | null;
};

const attestationContext = `# JSON Markdown block extracting input for on-chain attestation issuance
Respond **only** with a JSON markdown block containing the extracted trust attestation details related to a subject (identified by an EVM address) from the {{senderName}} claims in their last message:

## **Recent Messages**
{{recentMessages}}

## **Example Response**
\`\`\`json
{
    "subject": "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
    "scope": "Build",
    "isTrustworthy": true,
    "reasons": ["Former colleague", "Member of the Ethereum Foundation"]
}
\`\`\`

## **Instructions**
{{senderName}} has expressed a trust or distrust assessment regarding a **subject**. Your task is to extract relevant details to construct a structured JSON object that will be used for issuing an **on-chain Verax Trust Attestation**.

Extract and validate the following fields:

### **Mandatory Fields**
- **subject**: A valid Ethereum address (must match \`^0x[a-fA-F0-9]{40}$\`).
- **scope**: The domain in which the trust assessment applies (e.g., "Build", "Security", "Governance").
- **isTrustworthy**: Boolean (\`true\` or \`false\`) indicating if the subject is trusted (\`true\`) or distrusted (\`false\`).

### **Optional Field**
- **reasons**: If explicit reasons are not provided, infer them based on contextual cues.

### **Rules for Extraction**
1. **Prioritize explicit and recent statements** when multiple claims exist. If conflicting details are found, **favor the most recent and direct assertion**.
2. **Ensure format consistency**: Ethereum addresses should be properly checksummed.
3. **Do not generate explanations or additional text** outside the JSON markdown block.

## **Response Format**
Return **only** the extracted data as a JSON markdown block.`;


const missingAttestationInfoTemplate = `# Missing Information Needed for On-Chain Attestation Issuance
Based on the recent messages from {{senderName}}, identify the missing details required to complete the Verax Attestation issuance.

## **Recent Messages**
{{recentMessages}}

## **Instructions**
{{senderName}} is submitting a trust attestation, but some required details are missing.  
Your task is to request the missing information **directly and concisely**, without acknowledgment or unnecessary explanations.  

Identify any missing **mandatory** fields from the list below and request them naturally in a single response:
{{#if !subject}}- The subject’s EVM address (must be a valid 0x address).{{/if}}
{{#if !scope}}- The specific domain in which the trust assessment applies (e.g., "Build", "Security").{{/if}}
{{#if !isTrustworthy}}- Clarify whether the claim expresses trust (**true**) or distrust (**false**).{{/if}}

## **Response Format**
- Respond in the style and personality of **{{agentName}}**.
- Ask for all missing details in one message.
- Do **not** add explanations or acknowledge the request—just ask for the required information.
- Do **not** generate a response if all required fields are already provided.
`;



// Default portal address for Verax
const DEFAULT_PORTAL_ADDRESS = "0xeea25bc2ec56cae601df33b8fc676673285e12cc";


export const issueAttestationAction: Action = {

    name: "ISSUE_ATTESTATION",
    similes: ["CREATE_ATTESTATION", "VERIFY_ATTESTATION", "ATTEST"],
    description: "Only use this action when a user expresses the will to issue an attestation toward a specifc subject identified by and EVM address",

    validate: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        elizaLogger.info(`👀 Action validate: Issue attestation`);
        
        // Check if the message is about issuing an attestation

        return true;
    },
    
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info(`🚀 Action handler: Issue attestation`);
        try {
            // Get recent messages for context
            if (!state) {
                state = (await runtime.composeState(message)) as State;
            } else {
                state = await runtime.updateRecentMessageState(state);
            }

            // Extracting attestation information
            const attestationContextData = composeContext({
                state,
                template: attestationContext,
            });

            const attestationInformation: AttestationInformation = await generateObjectDeprecated({
                runtime,
                context: attestationContextData,
                modelClass: ModelClass.SMALL,
            });

            console.log('🛠 Extracted attestation information: ', attestationInformation);

            let { subject, scope, isTrustworthy } = attestationInformation;

            if (isValidEVMAddress(subject) && scope) {
                console.log('🚀 ==== Issuing Verax Attestation onchain ===');
                const veraxSdk = new VeraxSdk(
                    VeraxSdk.DEFAULT_LINEA_SEPOLIA,
                    undefined, // Replace with your public address
                    process.env.EVM_PRIVATE_KEY as `0x${string}`    // Replace with your private key
                );
    
                const portalAddress = process.env.CNS_VERAX_PORTAL_ID as `0x${string}`;
                const schemaId = process.env.CNS_VERAX_SCHEMA_ID as `0x${string}`;
                
                if (subject && veraxSdk) {
                    let expirationDate = 0;
                    let receipt = await veraxSdk.portal.attest(
                        portalAddress,
                        {
                            schemaId,
                            expirationDate,
                            subject: subject,
                            attestationData: [{
                                scope: scope,
                                isTrustworthy: (isTrustworthy=='true')?true:false,
                            }],
                        },
                        [],
                        false
                    );
                    if (receipt.transactionHash) {
                        elizaLogger.info(`✅ Attestation successfully registered on-chain: ${receipt.transactionHash}`);
                        
                        if (callback) {
                            callback({
                                text: `Your attestation claiming that you ${isTrustworthy?"trust":"distrust"} ${subject} on the scope of "${scope}" has been successfully registered on-chain. Transaction Hash: https://sepolia.lineascan.build/tx/${receipt.transactionHash}, explorer: https://explorer.ver.ax/linea-sepolia/portals/0x4787fd2dfe83c0e5d07d2ba1aef12afc5c4fe306`,
                                content: { transactionHash: receipt.transactionHash },
                            });
                        }
                        return true;
                    }
                }

            } else {
                console.log('🚫 ==== Missing information for attestation ===');
                const missingInfoContext = composeContext({
                    state,
                    template: missingAttestationInfoTemplate,
                });
                const missingInfoMessage = await generateText({
                    runtime,
                    context: missingInfoContext,
                    modelClass: ModelClass.SMALL,
                });

                if (callback) {
                    callback({ text: missingInfoMessage });
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
                content: {
                    text: "Can you issue a Verax attestation that I'm a buidler?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I've issued a Verax attestation confirming your buidler status. The attestation is now permanently recorded on the blockchain and can be verified through the Verax protocol. The transaction is confirmed and available on the block explorer.",
                    action: "ISSUE_ATTESTATION",
                },
            },
        ],
        [
            {
                user: "{{user2}}",
                content: {
                    text: "I need to verify that 0x828c9f04D1a07E3b0aBE12A9F8238a3Ff7E57b47 is a member of our DAO using Verax.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I've issued a Verax attestation confirming that 0x828c9f04D1a07E3b0aBE12A9F8238a3Ff7E57b47 is a verified member of your DAO. The attestation has been recorded on-chain through the Verax protocol and can be verified by anyone. The transaction is complete and can be viewed on the block explorer.",
                    action: "ISSUE_ATTESTATION",
                },
            },
        ],
        [
            {
                user: "{{user3}}",
                content: {
                    text: "I want to issue an attestation that 0x224b11F0747c7688a10aCC15F785354aA6493ED6 completed our web3 developer course.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I've issued a Verax attestation confirming that 0x224b11F0747c7688a10aCC15F785354aA6493ED6 has successfully completed your web3 developer course. This credential is now permanently recorded on the blockchain via the Verax protocol and can be verified by potential employers or other interested parties. The transaction is confirmed and available on the block explorer.",
                    action: "ISSUE_ATTESTATION",
                },
            },
        ],
        [
            {
                user: "{{user1}}",
                content: {
                    text: "I need to attest that my address 0x9bA590dd7FBd5bd1a7D06CdCB4744e20A49B3520 owns the ENS domain 'blockchain-developer.eth'.",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I've issued a Verax attestation confirming that 0x9bA590dd7FBd5bd1a7D06CdCB4744e20A49B3520 is the owner of the ENS domain 'blockchain-developer.eth'. This ownership attestation is now recorded on-chain via the Verax protocol and can be verified by anyone. The transaction is complete and can be viewed on the block explorer.",
                    action: "ISSUE_ATTESTATION",
                },
            },
        ],
        [
            {
                user: "{{user2}}",
                content: {
                    text: "Can you create an attestation using the Verax protocol that I've contributed to the Ethereum ecosystem?",
                },
            },
            {
                user: "{{agent}}",
                content: {
                    text: "I've issued a Verax attestation confirming your contributions to the Ethereum ecosystem. This recognition is now permanently recorded on the blockchain through the Verax protocol and can be verified by anyone. The transaction is complete and the attestation is available on the block explorer.",
                    action: "ISSUE_ATTESTATION",
                },
            },
        ],
    ] as ActionExample[][],
} as Action;