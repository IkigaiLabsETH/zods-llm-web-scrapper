import { smallModel } from '@lib/server/models';
import { logger } from '@logger';

import type { EndpointMessage } from './endpoints/endpoints';

export async function generateFromDefaultEndpoint({
   messages,
   preprompt,
   generateSettings,
}: {
   messages: EndpointMessage[];
   preprompt?: string;
   generateSettings?: Record<string, unknown>;
}): Promise<string> {
   try {
      const model = await smallModel;
      const endpoint = await model.getEndpoint();

      const output = await endpoint({ messages, preprompt, generateSettings });
      if (!output?.content) {
         throw new Error(
            `Generation failed for ${preprompt} with messages ${messages}`
         );
      }

      return output!.content;
   } catch (error) {
      logger.error('Failed to generate from default endpoint', error);
      throw error;
   }
}
