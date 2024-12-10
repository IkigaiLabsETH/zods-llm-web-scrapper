import { z } from 'zod';

import { embeddingModelsConfig } from '@config';
import {
   embeddingEndpoints,
   embeddingEndpointSchema,
   type EmbeddingEndpoint,
} from '@lib/server/embeddingEndpoints/embeddingEndpoints';
import { embeddingEndpointTransformersJS } from '@lib/server/embeddingEndpoints/transformersjs/embeddingEndpoints';
import { sum } from '@lib/utils/sum';

const modelConfig = z.object({
   /** Used as an identifier in DB */
   id: z.string().optional(),
   /** Used to link to the model page, and for inference */
   name: z.string().min(1),
   displayName: z.string().min(1).optional(),
   description: z.string().min(1).optional(),
   websiteUrl: z.string().url().optional(),
   modelUrl: z.string().url().optional(),
   endpoints: z.array(embeddingEndpointSchema).nonempty(),
   chunkCharLength: z.number().positive(),
   maxBatchSize: z.number().positive().optional(),
   preQuery: z.string().default(''),
   prePassage: z.string().default(''),
});

const embeddingModelsConfigParsed = embeddingModelsConfig.map((model) =>
   modelConfig.parse(model)
);

const processEmbeddingModel = async (m: z.infer<typeof modelConfig>) => ({
   ...m,
   id: m.id || m.name,
});

const addEndpoint = (m: Awaited<ReturnType<typeof processEmbeddingModel>>) => ({
   ...m,
   getEndpoint: async (): Promise<EmbeddingEndpoint> => {
      if (!m.endpoints) {
         return embeddingEndpointTransformersJS({
            type: 'transformersjs',
            weight: 1,
            model: m,
         });
      }

      const totalWeight = sum(m.endpoints.map((e: any) => e.weight));

      let random = Math.random() * totalWeight;

      for (const endpoint of m.endpoints) {
         if (random < endpoint.weight) {
            const args = { ...endpoint, model: m };

            switch (args.type) {
               case 'tei':
                  return embeddingEndpoints.tei(args);
               case 'transformersjs':
                  return embeddingEndpoints.transformersjs(args);
               case 'openai':
                  return embeddingEndpoints.openai(args);
               case 'hfapi':
                  return embeddingEndpoints.hfapi(args);
               default:
                  throw new Error(`Unknown endpoint type: ${args}`);
            }
         }

         random -= endpoint.weight;
      }

      throw new Error(`Failed to select embedding endpoint`);
   },
});

export const embeddingModels = await Promise.all(
   embeddingModelsConfigParsed.map((e) =>
      processEmbeddingModel(e).then(addEndpoint)
   )
);

export const defaultEmbeddingModel = embeddingModels[0];

const validateEmbeddingModel = (
   _models: EmbeddingBackendModel[],
   key: 'id' | 'name'
) => {
   return z.enum([_models[0][key], ..._models.slice(1).map((m) => m[key])]);
};

export const validateEmbeddingModelById = (
   _models: EmbeddingBackendModel[]
) => {
   return validateEmbeddingModel(_models, 'id');
};

export const validateEmbeddingModelByName = (
   _models: EmbeddingBackendModel[]
) => {
   return validateEmbeddingModel(_models, 'name');
};

export type EmbeddingBackendModel = typeof defaultEmbeddingModel;
