import { z } from 'zod';

import type {
   TextGenerationStreamDetails,
   TextGenerationStreamOutput,
   TextGenerationStreamToken,
} from '@huggingface/inference';
import type { Conversation } from '@lib/types/Conversation';
import type { Message } from '@lib/types/Message';
import type { Model } from '@lib/types/Model';
import type { Tool, ToolCall, ToolResult } from '@lib/types/Tool';

import {
   streamingEndpointAnthropic,
   endpointAnthropicParametersSchema,
   endpointAnthropic,
} from './anthropic/endpointAnthropic';
import {
   streamingEndpointAnthropicVertex,
   endpointAnthropicVertexParametersSchema,
} from './anthropic/endpointAnthropicVertex';
import {
   streamingEndpointAws,
   endpointAwsParametersSchema,
} from './aws/endpointAws';
import {
   streamingEndpointBedrock,
   endpointBedrockParametersSchema,
} from './aws/endpointBedrock';
import {
   streamingEndpointCloudflare,
   endpointCloudflareParametersSchema,
} from './cloudflare/endpointCloudflare';
import {
   streamingEndpointCohere,
   endpointCohereParametersSchema,
} from './cohere/endpointCohere';
import {
   streamingEndpointGenAI,
   endpointGenAIParametersSchema,
} from './google/endpointGenAI';
import {
   streamingEndpointVertex,
   endpointVertexParametersSchema,
} from './google/endpointVertex';
import {
   streamingEndpointLangserve,
   endpointLangserveParametersSchema,
} from './langserve/endpointLangserve';
import {
   streamingEndpointLlamacpp,
   endpointLlamacppParametersSchema,
} from './llamacpp/endpointLlamacpp';
import {
   streamingEndpointOllama,
   endpointOllamaParametersSchema,
} from './ollama/endpointOllama';
import {
   endpointOai,
   endpointOAIParametersSchema,
   streamingEndpointOai,
} from './openai/endpointOai';
import {
   streamingEndpointTgi,
   endpointTgiParametersSchema,
} from './tgi/endpointTgi';

export type EndpointMessage = Omit<Message, 'id'>;

// parameters passed when generating text
export interface EndpointParameters {
   messages: EndpointMessage[];
   preprompt?: Conversation['preprompt'];
   continueMessage?: boolean; // used to signal that the last message will be extended
   generateSettings?: Partial<Model['parameters']>;
   tools?: Tool[];
   toolResults?: ToolResult[];
   isMultimodal?: boolean;
}

interface CommonEndpoint {
   weight: number;
}
type TextGenerationStreamOutputWithTools = TextGenerationStreamOutput & {
   token: TextGenerationStreamToken & { toolCalls?: ToolCall[] };
};

export type TextGenerationOutputWithTools = {
   content: string;
   webQuery?: string;
   toolCalls?: ToolCall[];
   details?: TextGenerationStreamDetails;
};

// type signature for the endpoint
export type StreamingEndpoint = (
   params: EndpointParameters
) => Promise<AsyncGenerator<TextGenerationStreamOutputWithTools, void, void>>;

export type Endpoint = (
   params: EndpointParameters
) => Promise<TextGenerationOutputWithTools | null>;

// generator function that takes in parameters for defining the endpoint and return the endpoint
export type EndpointGenerator<T extends CommonEndpoint> = (
   parameters: T
) => Endpoint;

export type StreamingEndpointGenerator<T extends CommonEndpoint> = (
   parameters: T
) => StreamingEndpoint;

// list of all endpoint generators
export const streamingEndpoints = {
   tgi: streamingEndpointTgi,
   anthropic: streamingEndpointAnthropic,
   anthropicvertex: streamingEndpointAnthropicVertex,
   bedrock: streamingEndpointBedrock,
   aws: streamingEndpointAws,
   openai: streamingEndpointOai,
   llamacpp: streamingEndpointLlamacpp,
   ollama: streamingEndpointOllama,
   vertex: streamingEndpointVertex,
   genai: streamingEndpointGenAI,
   cloudflare: streamingEndpointCloudflare,
   cohere: streamingEndpointCohere,
   langserve: streamingEndpointLangserve,
};

export const endpoints = {
   anthropic: endpointAnthropic,
   openai: endpointOai,
};

export const endpointSchema = z.discriminatedUnion('type', [
   endpointAnthropicParametersSchema,
   endpointAnthropicVertexParametersSchema,
   endpointAwsParametersSchema,
   endpointBedrockParametersSchema,
   endpointOAIParametersSchema,
   endpointTgiParametersSchema,
   endpointLlamacppParametersSchema,
   endpointOllamaParametersSchema,
   endpointVertexParametersSchema,
   endpointGenAIParametersSchema,
   endpointCloudflareParametersSchema,
   endpointCohereParametersSchema,
   endpointLangserveParametersSchema,
]);
