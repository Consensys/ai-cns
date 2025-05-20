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

import { ethers } from "ethers";

const isValidEVMAddress = (address: string) => {
    return ethers.isAddress(address);
};

type IdeaInformation = {
    ideator: string | null;
    title: string | null;
    description: string | null;
    tags?: string[];
    category?: string;
};

interface IdeaScoring {
    title: string | null;
    valueAlignment: string | null;
    innovation: string | null;
    needRelevance: string | null;
    feasibility: string | null;
    sustainability: string | null;
    scalability: string | null;
    governanceCoordination: string | null;
    globalRating: string | null;
    rationale: string | null;
}

const ideaContext = `# Extract CNS Idea Registration Details
Respond with a JSON markdown block containing the relevant details of the last idea proposed by {{senderName}}.
You need to make a clear difference between different mentioned ideas, if it's a new idea you should re-extract and infer the information.

## **Recent Messages**
{{recentMessages}}

## **Example Response**
\`\`\`json
{
    "ideator": "0x224b11F0747c7688a10aCC15F785354aA6493ED6",
    "title": "Title of the Idea",
    "description": "Detailed description of the idea",
    "tags": ["tag1", "tag2"],
    "category": "Category of the idea",
    "exist": false,
    "finalized": false
}
\`\`\`

## **Instructions**
{{senderName}} is proposing a **need, idea, or initiative** for the Consensys Network State (CNS).  
Your task is to extract the relevant details and return a **structured JSON object** for on-chain registration.

### **Mandatory Fields to Extract**  
- **ideator's EVM address** → Must be a valid \`0x[a-fA-F0-9]{40}\` address.  
- **Idea Title** → A concise yet meaningful title.  
- **Idea Description** → A detailed explanation of the idea.  

### **Optional Fields**  
- **Tags** → Keywords or themes associated with the idea.  
- **Category** → A broader classification of the idea.  

### **Finalization**
- The **finalized** field should be set to **false** by default.
- The agent should ask the user if they want to register the idea on-chain or if they need more refinement or prefer to keep it off-chain.
- Set **finalized** to **true** only if the user explicitly mentions that the idea is ready to be registered on-chain.

If conflicting details are present, **favor the most recent and explicit information**.  
If no **tags or category** are provided, infer them from the context of the discussion.

### **Response Format**  
Return **only** the extracted data as a JSON markdown block.`;

const missingIdeaInfoTemplate = `# Request for Missing Information for CNS Idea Registration
Based on recent messages, some details are missing to complete the idea registration.

## **Recent Messages**
{{recentMessages}}

## **Missing Required Details**  
Request only the missing information, or the information that cannot be inferred with the {{agentName}} personality and style. 

{{#if !ideator}}- **Ideator's address** → Must be a valid \`0x[a-fA-F0-9]{40}\` address that you personally own.{{/if}}  

## **Next Steps**  
To proceed, request the missing details.`;


const valueAlignmentScoring = `## **Idea Evaluation & Scoring**

Evaluate the idea proposed by **{{senderName}}** based on its alignment with the **core values and strategic priorities** of the Consensys Network State (CNS). Assign **individual ratings (1-100) per criterion**, and compute an **overall score**.

## **Recent Messages**
{{recentMessages}}

## **Evaluation Criteria**
Assess the idea based on the following **key dimensions**:

1. **Value Alignment** – How well does the idea align with CNS principles like decentralization, privacy, open-source ethos, and censorship resistance?
2. **Innovation** – Does the idea introduce novel approaches, technologies, or perspectives?
3. **Need & Relevance** – Does the idea address a real problem or opportunity within the CNS ecosystem?
4. **Feasibility** – How realistic is the implementation in terms of resources, technology, and adoption?
5. **Sustainability & Long-Term Viability** – Can the idea sustain itself economically and environmentally over time?
6. **Scalability** – Is the idea designed to function effectively as adoption grows?
7. **Governance & Coordination** – Does the idea enhance on-chain or off-chain governance, collaboration, or decision-making?

## **Response Format**
Return a **JSON markdown block** containing:
- The **title** of the idea.
- A **score (1-100) per criterion**.
- A **global rating** (average of all scores) This should never be a float, just integers value.
- A **concise rationale** explaining the evaluation.

\`\`\`json
{
    "title": "{{ideaTitle}}",
    "valueAlignment": 90,
    "innovation": 75,
    "needRelevance": 85,
    "feasibility": 70,
    "sustainability": 80,
    "scalability": 65,
    "governanceCoordination": 88
    "globalRating": 79,
    "rationale": "The idea aligns strongly with CNS values and governance but has scalability concerns. Feasibility is moderate due to technical complexity."
}
\`\`\`

## **Instructions**
- **Provide a score (1-100) for each criterion** based on how well the idea meets it.
- **Calculate the global rating** as the average of all scores.
- **Justify** the evaluation with a brief rationale covering strong and weak points.
- **Do not** return a response if the idea lacks sufficient detail for evaluation.
- **If unclear**, infer a reasonable estimate but highlight any uncertainties. `;

const ideaImprovementTemplate = `Provide Feedback on Idea Improvements and Linea Building Blocks

Based on the idea proposed, provide constructive feedback on how to better align with CNS values and suggest relevant Linea building blocks.

Recent Messages:
{{recentMessages}}

Idea Details:
- Title: {{ideaTitle}}
- Description: {{ideaDescription}}
- Current Score: {{globalRating}}

Instructions:
1. First, summarize the idea in your own words to ensure you've understood it correctly. Ask the user to confirm if your understanding is accurate.

2. Only if the understanding is confirmed, provide focused feedback in the following format. Important: Do not use markdown syntax such as "**", "#" or numbered lists. Use only plain text with colons (:) for section headers, "-" for bullet points, and line breaks between items.

Value Alignment Improvements:
- Identify specific areas where the idea could better align with CNS values if there are clear opportunities
- Suggest concrete improvements only for those areas
- If the idea already aligns well, acknowledge it instead of forcing suggestions

Linea Building Block Recommendations:
- List only relevant Linea building blocks that could directly enhance this specific idea
- Explain how each block could benefit the idea
- Include examples or integration ideas
- If none apply, say so clearly

Implementation Suggestions:
- Share high-level technical guidance only if useful
- Mention any potential partnerships or collaborations that make sense
- Suggest milestones only if they clarify the implementation path

3. Keep feedback focused and relevant. Avoid generic advice. If there are no meaningful improvements to suggest, highlight the idea's strengths instead.

Response Format:
Return a structured response using only colons, dashes, and line breaks. Avoid all markdown formatting, bold, italics, or numbered points. The tone should reflect {{agentName}}'s natural style: constructive, curious, and collaborative.

Next Steps:
After the feedback, ask the user if they feel their idea is ready to be registered on-chain, or if they'd like to iterate on it further before proceeding.`;

const SMART_CONTRACT_ABI = [
    {
        "inputs": [
            { "internalType": "address", "name": "_ideator", "type": "address" },
            { "internalType": "string", "name": "_title", "type": "string" },
            { "internalType": "string", "name": "_description", "type": "string" },
            { "internalType": "string", "name": "_category", "type": "string" },
            { "internalType": "string[]", "name": "_tags", "type": "string[]" },
            { "internalType": "uint256", "name": "_score", "type": "uint256" }
        ],
        "name": "createInitiatives",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];

export const registerIdeaAction: Action = {
    name: "REGISTER_IDEA",
    similes: ["REGISTER_NEED", "REGISTER_INITIATIVE", "REGISTER_PROJECT", "SUBMIT_IDEA", "SHARE_IDEA", "STORE_IDEA"],
    description: "Only use this action when a new idea, need or initiative for CNS is mentioned",

    validate: async (runtime: IAgentRuntime, message: Memory, state: State) => {
        elizaLogger.info(`👀 Action validate: Validating idea registration request`);
        return true;
    },
    
    handler: async (
        runtime: IAgentRuntime,
        message: Memory,
        state: State,
        _options: { [key: string]: unknown },
        callback?: HandlerCallback
    ): Promise<boolean> => {
        elizaLogger.info(`🚀 Action handler: Idea registration`);

        try {
            state = state ? await runtime.updateRecentMessageState(state) : (await runtime.composeState(message)) as State;

            // Extracting idea information
            console.log("🛠 Extracting idea information");
            const ideaContextData = composeContext({ state, template: ideaContext });
            let { ideator, title, description, tags, category, finalized } = await generateObjectDeprecated({ runtime, context: ideaContextData, modelClass: ModelClass.SMALL });

            // Convert finalized string to boolean
            finalized = finalized === "true" || finalized === true;
            
            
            // Registration confirmation
            if (!finalized) {
                // Provide feedback on improvements and Linea building blocks
                console.log("🛠 Generating improvement feedback");
                const improvementContext = composeContext({ 
                    state, 
                    template: ideaImprovementTemplate,
                    templatingEngine: "handlebars"
                });
                const improvementFeedback = await generateText({ 
                    runtime, 
                    context: improvementContext, 
                    modelClass: ModelClass.SMALL 
                });
                callback?.({ text: improvementFeedback });
                return false;
            }

            if (finalized && !isValidEVMAddress(ideator) || !title) {
                // Request missing information
                console.log('🚫 ==== Missing information for idea registration ===', {isvalidEVMAddress: isValidEVMAddress(ideator), title: title, description: description});
                const missingInfoContext = composeContext({ state, template: missingIdeaInfoTemplate });
                const missingInfoMessage = await generateText({ runtime, context: missingInfoContext, modelClass: ModelClass.SMALL});
                callback?.({ text: missingInfoMessage });
                return false;
            }

            if (finalized && isValidEVMAddress(ideator) && title && description) {
                // Scoring idea
                console.log("🛠 Scoring idea information");
                const ideaScoringData = composeContext({ state, template: valueAlignmentScoring });
                const ideaScoring = await generateObjectDeprecated({ runtime, context: ideaScoringData, modelClass: ModelClass.SMALL });
                console.log('🔧 Idea scoring: ', ideaScoring);
                let { globalRating } = ideaScoring;
                
                // Idea registration
                console.log('🚀 ==== Registering idea onchain ===');
                const provider = new ethers.JsonRpcProvider(process.env.EVM_PROVIDER_URL);
                const contactAddress = process.env.CNS_INITIATIVE_CONTRACT_ADDRESS;
                elizaLogger.info("🔗 Initative Smart Contract address: ", contactAddress);
                if (await provider.getCode(contactAddress) === "0x") {
                    console.error("❌ No contract deployed at this address!");
                    return false;
                }
                const signer = new ethers.Wallet(process.env.EVM_PRIVATE_KEY, provider);
                const contract = new ethers.Contract(contactAddress, SMART_CONTRACT_ABI, signer);
                
                console.log("contract.createInitiatives(", {ideator, title, description, category , tags, globalRating});
                const tx = await contract.createInitiatives(ethers.getAddress(ideator), title, description, category || "", tags || [], globalRating);
                await tx.wait();
                elizaLogger.info(`✅ Idea successfully registered on-chain: ${tx.hash}`);
                callback?.({ text: `Your idea "${title}" has been successfully registered on-chain. Transaction Hash: https://sepolia.lineascan.build/tx/${tx.hash}` });
                
            return true;
            }
            
        } catch (error) {
            elizaLogger.error("Error registering idea on-chain:", error);
            if (callback) {
                callback({ text: "Failed to register idea. Please try again later." });
            }
        }
        return false;
    },
    examples: [
        [
          {
            user: "{{user1}}",
            content: {
              text: "I have an idea for a decentralized app that connects local farmers directly with consumers, cutting out middlemen and reducing food waste.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Thanks for sharing your idea!\n\nSummary of the Idea:\nYou're proposing a decentralized platform that connects local farmers directly with consumers, removing intermediaries and reducing food waste while empowering local agriculture. Let me know if this captures your vision accurately.\n\nValue Alignment Improvements:\n- Strong alignment with CNS values: decentralization, sustainability, community empowerment.\n- Consider adding mechanisms for collective governance by farmers and consumers to enhance transparency and resilience.\n\nLinea Building Block Recommendations:\n- Reputation Systems: Build trust using Linea’s identity and verification primitives.\n- Low-Cost Payments: Leverage Linea’s L2 network to minimize fees in micro-transactions.\n\nWould you like to proceed with on-chain registration of this idea?",
            },
          },
          {
            user: "{{user1}}",
            content: {
              text: "Yes, I’d like to register it.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Understood. I’ll now initiate the process to register your idea on-chain. You’ll receive confirmation once the transaction is processed.",
              action: "REGISTER_IDEA",
            },
          },
        ],
        [
          {
            user: "{{user2}}",
            content: {
              text: "We should build a DAO that funds ocean cleanup, and governance tokens should only be earned through verified cleanup efforts.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "This is a great concept that directly ties impact to governance.\n\nSummary of the Idea:\nYou're proposing a DAO that supports ocean cleanup initiatives. Governance tokens are earned by individuals who prove participation in cleanup activities. Please confirm if this reflects your intent.\n\nValue Alignment Improvements:\n- This aligns well with CNS values: regenerative action, fair governance, and verifiable contributions.\n- You could further strengthen it by integrating transparent metrics and third-party validators.\n\nLinea Building Block Recommendations:\n- Proof of Impact: Use Linea’s identity and attestation systems to validate real-world environmental contributions.\n- DAO Governance Modules: Build decision-making processes using Linea's native governance primitives.\n\nWould you like to move forward with registering this idea on-chain?",
            },
          },
          {
            user: "{{user2}}",
            content: {
              text: "Yes, let’s go ahead and register it.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Great. I’m now sending the transaction to register your idea on-chain. You’ll get notified once it’s confirmed.",
              action: "REGISTER_IDEA",
            },
          },
        ],
        [
          {
            user: "{{user3}}",
            content: {
              text: "What if we had a browser extension that verifies news credibility in real-time using decentralized fact-checking networks?",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Thanks for sharing this impactful idea.\n\nSummary of the Idea:\nYou're proposing a browser extension that evaluates the credibility of news articles in real-time using decentralized fact-checking protocols. It would empower users to navigate misinformation online. Does that capture your intent?\n\nValue Alignment Improvements:\n- Strong alignment with CNS principles around trust, truth, and decentralized governance.\n- Consider adding transparent reputation scores for fact-checker nodes.\n\nLinea Building Block Recommendations:\n- Data Oracles: Use Linea's oracle integrations to ingest and verify content credibility data.\n- Identity & Reputation: Leverage Linea’s identity layer for user trust scores or fact-checker accountability.\n\nWould you like to proceed with registering this idea on-chain?",
            },
          },
          {
            user: "{{user3}}",
            content: {
              text: "Yes, that sounds good. Let’s register it.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Understood. I'm initiating the transaction to register your idea on-chain. You'll receive confirmation once it's complete.",
              action: "REGISTER_IDEA",
            },
          },
        ],
        [
          {
            user: "{{user4}}",
            content: {
              text: "I’m thinking of a decentralized platform for community-led mental health support, where therapists and peers can offer services without centralized gatekeeping.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Thank you for this important and sensitive idea.\n\nSummary of the Idea:\nYou're exploring a decentralized platform that enables mental health support from professionals and peers without centralized intermediaries. It's focused on accessibility and privacy. Let me know if this interpretation is accurate.\n\nValue Alignment Improvements:\n- Strong potential alignment with CNS values like mutual aid and privacy.\n- Consider ways to ensure quality assurance and ethical safeguards within a decentralized model.\n\nLinea Building Block Recommendations:\n- Privacy Layers: Integrate zk tools or encrypted messaging systems for confidential sessions.\n- Reputation & Credentials: Use verifiable credentials for therapist onboarding and peer reputation.\n\nWould you like to register this idea on-chain now, or would you prefer to explore and refine it further?",
            },
          },
          {
            user: "{{user4}}",
            content: {
              text: "I think I want to explore it more before registering. It’s a sensitive space.",
            },
          },
          {
            user: "{{agent}}",
            content: {
              text: "Absolutely — that makes total sense. Take the time you need to develop the concept further. Let me know when you're ready, and I’ll be here to support the next step.",
            },
          },
        ],
      ] as ActionExample[][],
} as Action;
