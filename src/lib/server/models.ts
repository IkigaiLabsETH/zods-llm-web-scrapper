import JSON5 from 'json5';
import { z } from 'zod';

import { modelsConfig } from '@config';
import { env } from '@env';
import type { PreTrainedTokenizer } from '@huggingface/transformers';
import type { ChatTemplateInput } from '@lib/types/Template';
import { ToolResultStatus, type ToolInput } from '@lib/types/Tool';
import { getTokenizer } from '@lib/utils/getTokenizer';
import { sum } from '@lib/utils/sum';
import { compileTemplate } from '@lib/utils/template';
import { logger } from '@logger';

import {
   embeddingModels,
   validateEmbeddingModelByName,
} from './embeddingModels';
import {
   Endpoint,
   endpoints,
   endpointSchema,
   streamingEndpoints,
   type StreamingEndpoint,
} from './endpoints/endpoints';

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;

const modelConfig = z.object({
   /** Used as an identifier in DB */
   id: z.string().optional(),
   /** Used to link to the model page, and for inference */
   name: z.string().default(''),
   displayName: z.string().min(1).optional(),
   description: z.string().min(1).optional(),
   logoUrl: z.string().url().optional(),
   websiteUrl: z.string().url().optional(),
   modelUrl: z.string().url().optional(),
   tokenizer: z
      .union([
         z.string(),
         z.object({
            tokenizerUrl: z.string().url(),
            tokenizerConfigUrl: z.string().url(),
         }),
      ])
      .optional(),
   datasetName: z.string().min(1).optional(),
   datasetUrl: z.string().url().optional(),
   preprompt: z.string().default(''),
   prepromptUrl: z.string().url().optional(),
   chatPromptTemplate: z.string().optional(),
   promptExamples: z
      .array(
         z.object({
            title: z.string().min(1),
            prompt: z.string().min(1),
         })
      )
      .optional(),
   endpoints: z.array(endpointSchema).optional(),
   parameters: z
      .object({
         temperature: z.number().min(0).max(1).optional(),
         truncate: z.number().int().positive().optional(),
         max_new_tokens: z.number().int().positive().optional(),
         stop: z.array(z.string()).optional(),
         top_p: z.number().positive().optional(),
         top_k: z.number().positive().optional(),
         repetition_penalty: z.number().min(-2).max(2).optional(),
      })
      .passthrough()
      .optional(),
   multimodal: z.boolean().default(false),
   tools: z.boolean().default(false),
   unlisted: z.boolean().default(false),
   embeddingModel: validateEmbeddingModelByName(embeddingModels).optional(),
});

const modelsConfigParsed = modelsConfig.map((model) =>
   modelConfig.parse(model)
);

async function getChatPromptRender(
   m: z.infer<typeof modelConfig>
): Promise<ReturnType<typeof compileTemplate<ChatTemplateInput>>> {
   if (m.chatPromptTemplate) {
      return compileTemplate<ChatTemplateInput>(m.chatPromptTemplate, m);
   }
   let tokenizer: PreTrainedTokenizer;

   if (!m.tokenizer) {
      return compileTemplate<ChatTemplateInput>(
         '{{#if @root.preprompt}}<|im_start|>system\n{{@root.preprompt}}<|im_end|>\n{{/if}}{{#each messages}}{{#ifUser}}<|im_start|>user\n{{content}}<|im_end|>\n<|im_start|>assistant\n{{/ifUser}}{{#ifAssistant}}{{content}}<|im_end|>\n{{/ifAssistant}}{{/each}}',
         m
      );
   }

   try {
      tokenizer = await getTokenizer(m.tokenizer);
   } catch (e) {
      logger.error(
         `Failed to load tokenizer for model ${m.name} consider setting chatPromptTemplate manually or making sure the model is available on the hub.`,
         e
      );
      process.exit();
   }

   const renderTemplate = ({
      messages,
      preprompt,
      tools,
      toolResults,
   }: ChatTemplateInput) => {
      let formattedMessages: { role: string; content: string }[] = messages.map(
         (message) => ({
            content: message.content,
            role: message.from,
         })
      );

      if (preprompt && formattedMessages[0].role !== 'system') {
         formattedMessages = [
            {
               role: 'system',
               content: preprompt,
            },
            ...formattedMessages,
         ];
      }

      if (toolResults?.length) {
         // todo: should update the command r+ tokenizer to support system messages at any location
         // or use the `rag` mode without the citations
         const id = m.id ?? m.name;

         if (id.startsWith('CohereForAI')) {
            formattedMessages = [
               {
                  role: 'system',
                  content:
                     '\n\n<results>\n' +
                     toolResults
                        .flatMap((result, idx) => {
                           if (result.status === ToolResultStatus.Error) {
                              return (
                                 `Document: ${idx}\n` +
                                 `Tool "${result.call.name}" error\n` +
                                 result.message
                              );
                           }
                           return (
                              `Document: ${idx}\n` +
                              result.outputs
                                 .flatMap((output) =>
                                    Object.entries(output).map(
                                       ([title, text]) => `${title}\n${text}`
                                    )
                                 )
                                 .join('\n')
                           );
                        })
                        .join('\n\n') +
                     '\n</results>',
               },
               ...formattedMessages,
            ];
         } else if (id.startsWith('meta-llama')) {
            const results = toolResults.flatMap((result) => {
               if (result.status === ToolResultStatus.Error) {
                  return [
                     {
                        tool_call_id: result.call.name,
                        output: 'Error: ' + result.message,
                     },
                  ];
               } else {
                  return result.outputs.map((output) => ({
                     tool_call_id: result.call.name,
                     output: JSON.stringify(output),
                  }));
               }
            });

            formattedMessages = [
               ...formattedMessages,
               {
                  role: 'python',
                  content: JSON.stringify(results),
               },
            ];
         } else {
            formattedMessages = [
               ...formattedMessages,
               {
                  role: 'system',
                  content: JSON.stringify(toolResults),
               },
            ];
         }
         tools = [];
      }

      const chatTemplate = tools?.length ? 'tool_use' : undefined;

      const documents = (toolResults ?? []).flatMap((result) => {
         if (result.status === ToolResultStatus.Error) {
            return [
               {
                  title: `Tool "${result.call.name}" error`,
                  text: '\n' + result.message,
               },
            ];
         }
         return result.outputs.flatMap((output) =>
            Object.entries(output).map(([title, text]) => ({
               title: `Tool "${result.call.name}" ${title}`,
               text: '\n' + text,
            }))
         );
      });

      const mappedTools =
         tools?.map((tool) => {
            const inputs: Record<
               string,
               {
                  type: ToolInput['type'];
                  description: string;
                  required: boolean;
               }
            > = {};

            for (const value of tool.inputs) {
               if (value.paramType !== 'fixed') {
                  inputs[value.name] = {
                     type: value.type,
                     description: value.description ?? '',
                     required: value.paramType === 'required',
                  };
               }
            }

            return {
               name: tool.name,
               description: tool.description,
               parameter_definitions: inputs,
            };
         }) ?? [];

      const output = tokenizer.apply_chat_template(formattedMessages, {
         tokenize: false,
         add_generation_prompt: true,
         chat_template: chatTemplate,
         // eslint-disable-next-line @typescript-eslint/ban-ts-comment
         // @ts-ignore
         tools: mappedTools,
         documents,
      });

      if (typeof output !== 'string') {
         throw new Error(
            'Failed to apply chat template, the output is not a string'
         );
      }

      return output;
   };

   return renderTemplate;
}

const processModel = async (m: z.infer<typeof modelConfig>) => ({
   ...m,
   chatPromptRender: await getChatPromptRender(m),
   id: m.id || m.name,
   displayName: m.displayName || m.name,
   preprompt: m.prepromptUrl
      ? await fetch(m.prepromptUrl).then((r) => r.text())
      : m.preprompt,
   parameters: { ...m.parameters, stop_sequences: m.parameters?.stop },
});

export type ProcessedModel = Awaited<ReturnType<typeof processModel>> & {
   getStreamingEndpoint: () => Promise<StreamingEndpoint>;
   getEndpoint: () => Promise<Endpoint>;
};

const addEndpoint = (m: Awaited<ReturnType<typeof processModel>>) => ({
   ...m,
   getStreamingEndpoint: async (): Promise<StreamingEndpoint> => {
      if (!m.endpoints) {
         return streamingEndpoints.tgi({
            type: 'tgi',
            url: `${env.HF_API_ROOT}/${m.name}`,
            accessToken: env.HF_TOKEN ?? env.HF_ACCESS_TOKEN,
            weight: 1,
            model: m,
         });
      }
      const totalWeight = sum(m.endpoints.map((e) => e.weight));

      let random = Math.random() * totalWeight;

      for (const endpoint of m.endpoints) {
         if (random < endpoint.weight) {
            const args = { ...endpoint, model: m };

            switch (args.type) {
               case 'tgi':
                  return streamingEndpoints.tgi(args);
               case 'anthropic':
                  return streamingEndpoints.anthropic(args);
               case 'anthropic-vertex':
                  return streamingEndpoints.anthropicvertex(args);
               case 'bedrock':
                  return streamingEndpoints.bedrock(args);
               case 'aws':
                  return await streamingEndpoints.aws(args);
               case 'openai':
                  return await streamingEndpoints.openai(args);
               case 'llamacpp':
                  return streamingEndpoints.llamacpp(args);
               case 'ollama':
                  return streamingEndpoints.ollama(args);
               case 'vertex':
                  return await streamingEndpoints.vertex(args);
               case 'genai':
                  return await streamingEndpoints.genai(args);
               case 'cloudflare':
                  return await streamingEndpoints.cloudflare(args);
               case 'cohere':
                  return await streamingEndpoints.cohere(args);
               case 'langserve':
                  return await streamingEndpoints.langserve(args);
               default:
                  // for legacy reason
                  return streamingEndpoints.tgi(args);
            }
         }
         random -= endpoint.weight;
      }

      throw new Error(`Failed to select endpoint`);
   },
   getEndpoint: async (): Promise<Endpoint> => {
      if (!m.endpoints) {
         return endpoints.openai({
            type: 'openai',
            weight: 1,
            model: m,
         });
      }

      const totalWeight = sum(m.endpoints.map((e) => e.weight));

      let random = Math.random() * totalWeight;

      for (const endpoint of m.endpoints) {
         if (random < endpoint.weight) {
            const args = { ...endpoint, model: m };

            switch (args.type) {
               case 'anthropic':
                  return endpoints.anthropic(args);
               case 'openai':
                  return endpoints.openai(args);
               default:
                  // for legacy reason
                  return endpoints.openai({
                     ...args,
                     type: 'openai',
                  });
            }
         }
         random -= endpoint.weight;
      }

      throw new Error(`Failed to select endpoint`);
   },
});

export const models: ProcessedModel[] = await Promise.all(
   modelsConfigParsed.map((e) => processModel(e).then(addEndpoint))
);

export const defaultModel = models[0];

// Models that have been deprecated
export const oldModels = [];

export const validateModel = (_models: BackendModel[]) => {
   // Zod enum function requires 2 parameters
   return z.enum([_models[0].id, ..._models.slice(1).map((m) => m.id)]);
};

// if `TASK_MODEL` is string & name of a model in `MODELS`, then we use `MODELS[TASK_MODEL]`, else we try to parse `TASK_MODEL` as a model config itself

export const smallModel = env.TASK_MODEL
   ? (models.find((m) => m.name === env.TASK_MODEL) ||
        processModel(modelConfig.parse(JSON5.parse(env.TASK_MODEL))).then((m) =>
           addEndpoint(m)
        )) ??
     defaultModel
   : defaultModel;

export type BackendModel = Optional<
   typeof defaultModel,
   'preprompt' | 'parameters' | 'multimodal' | 'unlisted' | 'tools'
>;
