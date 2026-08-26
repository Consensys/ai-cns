import { describe, test, expect, vi, beforeEach } from "vitest";
import { type IAgentRuntime, ModelProviderName } from "../src/types.ts";
import settings from "../src/settings.ts";

// Mock environment-related settings
vi.mock("../settings", () => ({
    default: {
        USE_OPENAI_EMBEDDING: "false",
        USE_OLLAMA_EMBEDDING: "false",
        USE_GAIANET_EMBEDDING: "false",
        OPENAI_API_KEY: "mock-openai-key",
        OPENAI_API_URL: "https://api.openai.com/v1",
        GAIANET_API_KEY: "mock-gaianet-key",
        OLLAMA_EMBEDDING_MODEL: "mxbai-embed-large",
        GAIANET_EMBEDDING_MODEL: "nomic-embed",
    },
}));

// Mock fastembed module for local embeddings
vi.mock("fastembed", () => ({
    FlagEmbedding: {
        init: vi.fn().mockResolvedValue({
            queryEmbed: vi
                .fn()
                .mockResolvedValue(new Float32Array(384).fill(0.1)),
        }),
    },
    EmbeddingModel: {
        BGESmallENV15: "BGE-small-en-v1.5",
    },
}));

// Mock global fetch for remote embedding requests
const mockFetch = vi.fn();
globalThis.fetch = mockFetch as unknown as typeof fetch;

describe("Embedding Module", () => {
    let mockRuntime: IAgentRuntime;

    beforeEach(async () => {
        vi.resetModules(); // Clear module cache before each test to ensure fresh imports
        
        // Prepare a mock runtime
        mockRuntime = {
            character: {
                modelProvider: ModelProviderName.OLLAMA,
                modelEndpointOverride: null,
            },
            token: "mock-token",
            messageManager: {
                getCachedEmbeddings: vi.fn().mockResolvedValue([]),
            },
        } as unknown as IAgentRuntime;

        vi.clearAllMocks();
        mockFetch.mockReset();
    });

    describe("getEmbeddingConfig", () => {
        test("should return BGE config by default", async () => {
            const { getEmbeddingConfig } = await import("../src/embedding.ts");
            const config = getEmbeddingConfig();
            expect(config.dimensions).toBe(384);
            expect(config.model).toBe("BGE-small-en-v1.5");
            expect(config.provider).toBe("BGE");
        });

        test("should return OpenAI config when USE_OPENAI_EMBEDDING is true", async () => {
            vi.mocked(settings).USE_OPENAI_EMBEDDING = "true";
            const { getEmbeddingConfig } = await import("../src/embedding.ts");
            const config = getEmbeddingConfig();
            expect(config.dimensions).toBe(1536);
            expect(config.model).toBe("text-embedding-3-small");
            expect(config.provider).toBe("OpenAI");
        });
    });

    describe("getEmbeddingType", () => {
        test("should return 'remote' for Ollama provider", async () => {
            const { getEmbeddingType } = await import("../src/embedding.ts");
            const type = getEmbeddingType(mockRuntime);
            expect(type).toBe("remote");
        });

        test("should return 'remote' for OpenAI provider", async () => {
            mockRuntime.character.modelProvider = ModelProviderName.OPENAI;
            const { getEmbeddingType } = await import("../src/embedding.ts");
            const type = getEmbeddingType(mockRuntime);
            expect(type).toBe("remote");
        });
    });

    describe("getEmbeddingZeroVector", () => {
        beforeEach(() => {
            vi.mocked(settings).USE_OPENAI_EMBEDDING = "false";
            vi.mocked(settings).USE_OLLAMA_EMBEDDING = "false";
            vi.mocked(settings).USE_GAIANET_EMBEDDING = "false";
        });

        test("should return 384-length zero vector by default (BGE)", async () => {
            const { getEmbeddingZeroVector } = await import("../src/embedding.ts");
            const vector = getEmbeddingZeroVector();
            expect(vector).toHaveLength(384);
            expect(vector.every((val) => val === 0)).toBe(true);
        });

        test("should return 1536-length zero vector for OpenAI if enabled", async () => {
            vi.mocked(settings).USE_OPENAI_EMBEDDING = "true";
            const { getEmbeddingZeroVector } = await import("../src/embedding.ts");
            const vector = getEmbeddingZeroVector();
            expect(vector).toHaveLength(1536);
            expect(vector.every((val) => val === 0)).toBe(true);
        });
    });

    describe("embed function", () => {
        beforeEach(() => {
            // Mock a successful remote response with an example 384-dim embedding
            mockFetch.mockResolvedValue({
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: [{ embedding: new Array(384).fill(0.1) }],
                    }),
            });
        });

        test("should return an empty array for empty input text", async () => {
            const { embed } = await import("../src/embedding.ts");
            const result = await embed(mockRuntime, "");
            expect(result).toEqual([]);
        });

        test("should return cached embedding if it already exists", async () => {
            const { embed } = await import("../src/embedding.ts");
            const cachedEmbedding = new Array(384).fill(0.5);
            mockRuntime.messageManager.getCachedEmbeddings = vi
                .fn()
                .mockResolvedValue([{ embedding: cachedEmbedding }]);

            const result = await embed(mockRuntime, "test input");
            expect(result).toBe(cachedEmbedding);
        });

        test("should handle local embedding successfully (fastembed fallback)", async () => {
            const { embed } = await import("../src/embedding.ts");
            const result = await embed(mockRuntime, "test input");
            expect(result).toHaveLength(384);
            expect(result.every((v) => typeof v === "number")).toBe(true);
        });

        test("should fallback to remote if local embedding fails", async () => {
            // Simulate local embedding failure by making FlagEmbedding.init reject
            vi.doMock("fastembed", () => ({
                FlagEmbedding: {
                    init: vi.fn().mockRejectedValue(new Error("Module not found")),
                },
                EmbeddingModel: {
                    BGESmallENV15: "BGE-small-en-v1.5",
                },
            }));
            vi.resetModules();

            // Mock a valid remote response
            const mockResponse = {
                ok: true,
                json: () =>
                    Promise.resolve({
                        data: [{ embedding: new Array(384).fill(0.1) }],
                    }),
            };
            mockFetch.mockResolvedValueOnce(mockResponse);

            const { embed } = await import("../src/embedding.ts");
            const result = await embed(mockRuntime, "test input");
            expect(result).toHaveLength(384);
            expect(mockFetch).toHaveBeenCalled();
        });

        test("should throw on remote embedding if fetch fails", async () => {
            mockFetch.mockRejectedValueOnce(new Error("API Error"));
            vi.mocked(settings).USE_OPENAI_EMBEDDING = "true"; // Force remote

            const { embed } = await import("../src/embedding.ts");
            await expect(embed(mockRuntime, "test input")).rejects.toThrow(
                "API Error"
            );
        });

        test("should throw on non-200 remote response", async () => {
            const errorResponse = {
                ok: false,
                status: 400,
                statusText: "Bad Request",
                text: () => Promise.resolve("Invalid input"),
            };
            mockFetch.mockResolvedValueOnce(errorResponse);
            vi.mocked(settings).USE_OPENAI_EMBEDDING = "true"; // Force remote

            const { embed } = await import("../src/embedding.ts");
            await expect(embed(mockRuntime, "test input")).rejects.toThrow(
                "Embedding API Error"
            );
        });

        test("should handle concurrent embedding requests", async () => {
            const { embed } = await import("../src/embedding.ts");
            const promises = Array(5)
                .fill(null)
                .map(() => embed(mockRuntime, "concurrent test"));
            await expect(Promise.all(promises)).resolves.toBeDefined();
        });
    });
});
