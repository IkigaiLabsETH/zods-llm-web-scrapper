import {
   MessageUpdateType,
   type MessageUpdate,
} from '@lib/types/MessageUpdate';
import type { ToolResult } from '@lib/types/Tool';
import { logger } from '@logger';

import { AbortedGenerations } from '../abortedGenerations';
import type {
   EndpointMessage,
   TextGenerationOutputWithTools,
} from '../endpoints/endpoints';
import type {
   NonStreamingContentGenerationContext,
   StreamingContentGenerationContext,
} from './types';

type StreamingGenerateContext = Omit<
   StreamingContentGenerationContext,
   'messages'
> & {
   messages: EndpointMessage[];
};

type NonStreamingGenerateContext = Omit<
   NonStreamingContentGenerationContext,
   'messages'
> & {
   messages: EndpointMessage[];
};

export async function generate(
   { endpoint, messages, assistant, isContinue }: NonStreamingGenerateContext,
   toolResults: ToolResult[],
   preprompt?: string
): Promise<TextGenerationOutputWithTools> {
   try {
      const result = await endpoint({
         messages,
         preprompt,
         continueMessage: isContinue,
         generateSettings: assistant?.generateSettings,
         toolResults,
      });

      if (!result) {
         throw new Error('Failed to generate text');
      }

      return result;
   } catch (e) {
      logger.error('Failed to generate text', e);
      throw e;
   }
}

export async function* generateStreaming(
   {
      model,
      endpoint,
      conv,
      messages,
      assistant,
      isContinue,
      promptedAt,
   }: StreamingGenerateContext,
   toolResults: ToolResult[],
   preprompt?: string
): AsyncIterable<MessageUpdate> {
   for await (const output of await endpoint({
      messages,
      preprompt,
      continueMessage: isContinue,
      generateSettings: assistant?.generateSettings,
      toolResults,
   })) {
      // text generation completed
      if (output.generatedText) {
         let interrupted =
            !output.token.special &&
            !model.parameters.stop?.includes(output.token.text);

         let text = output.generatedText.trimEnd();
         for (const stopToken of model.parameters.stop ?? []) {
            if (!text.endsWith(stopToken)) {
               continue;
            }

            interrupted = false;
            text = text.slice(0, text.length - stopToken.length);
         }

         yield { type: MessageUpdateType.FinalAnswer, text, interrupted };
         {
            continue;
         }
      }

      // ignore special tokens
      if (output.token.special) {
         continue;
      }

      // pass down normal token
      yield { type: MessageUpdateType.Stream, token: output.token.text };

      // abort check
      const date = AbortedGenerations.getInstance()
         .getList()
         .get(conv?._id.toString() ?? '');
      if (date && date > promptedAt) {
         break;
      }

      // no output check
      if (!output) {
         break;
      }
   }
}
