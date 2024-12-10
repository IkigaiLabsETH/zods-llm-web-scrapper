import OpenAI from 'openai';
import { z } from 'zod';

import { env } from '@env';
import { chunk } from '@lib/utils/chunk';

import type { EmbeddingEndpoint } from '../embeddingEndpoints';

export const embeddingEndpointOpenAIParametersSchema = z.object({
   weight: z.number().int().positive().default(1),
   model: z.any(),
   type: z.literal('openai'),
   url: z.string().url().default('https://api.openai.com/v1/embeddings'),
   apiKey: z.string().default(env.OPENAI_API_KEY),
   defaultHeaders: z.record(z.string()).default({}),
});

export async function embeddingEndpointOpenAI(
   input: z.input<typeof embeddingEndpointOpenAIParametersSchema>
): Promise<EmbeddingEndpoint> {
   const { model } = embeddingEndpointOpenAIParametersSchema.parse(input);

   const maxBatchSize = model.maxBatchSize || 100;

   const openai = new OpenAI({
      apiKey: env.OPENAI_API_KEY,
   });

   return async ({ inputs }) => {
      const batchesInputs = chunk(inputs, maxBatchSize);

      const batchesResults = await Promise.all(
         batchesInputs.map(async (batchInputs: string[]) => {
            const response = await openai.embeddings.create({
               model: model.name,
               input: batchInputs,
            });
            return response.data.map((embedding) => embedding.embedding);
         })
      );

      const flatAllEmbeddings = batchesResults.flat();

      return flatAllEmbeddings;
   };
}
