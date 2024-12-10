import {
   runNonStreamingWebSearch,
   runStreamingWebSearch,
} from '@lib/server/websearch/runWebSearch';
import {
   type MessageUpdate,
   MessageUpdateType,
   MessageUpdateStatus,
} from '@lib/types/MessageUpdate';
import type { ToolResult } from '@lib/types/Tool';
import type { WebSearch } from '@lib/types/WebSearch';
import { mergeAsyncGenerators } from '@lib/utils/mergeAsyncGenerators';

import { TextGenerationOutputWithTools } from '../endpoints/endpoints';
import { preprocessMessages } from '../endpoints/preprocessMessages';
import { toolHasName } from '../tools/utils';
import {
   assistantHasDynamicPrompt,
   assistantHasWebSearch,
   getAssistantById,
   processPreprompt,
} from './assistant';
import { generate, generateStreaming } from './generate';
import { streamingGenerateTitleForConversation } from './title';
import { getTools, runTools, runToolsWithStreaming } from './tools';
import type {
   NonStreamingContentGenerationContext,
   StreamingContentGenerationContext,
} from './types';

async function* keepAlive(
   done: AbortSignal
): AsyncGenerator<MessageUpdate, undefined, undefined> {
   while (!done.aborted) {
      yield {
         type: MessageUpdateType.Status,
         status: MessageUpdateStatus.KeepAlive,
      };
      await new Promise((resolve) => setTimeout(resolve, 5000));
   }
}

export async function nonStreamingTextGeneration(
   ctx: NonStreamingContentGenerationContext
) {
   const textGen = nonStreamingTextGenerationWithoutTitle(ctx);

   return await textGen;
}

export async function* streamingTextGeneration(
   ctx: StreamingContentGenerationContext
) {
   const done = new AbortController();

   const titleGen = ctx.conv && streamingGenerateTitleForConversation(ctx.conv);
   const textGen = streamingTextGenerationWithoutTitle(ctx, done);
   const keepAliveGen = keepAlive(done.signal);

   const generators = [textGen, keepAliveGen];
   if (titleGen) {
      generators.unshift(titleGen);
   }

   yield* mergeAsyncGenerators(generators);
}

async function nonStreamingTextGenerationWithoutTitle(
   ctx: NonStreamingContentGenerationContext
): Promise<TextGenerationOutputWithTools> {
   const {
      conv,
      assistant,
      model,
      messages,
      toolsPreference,
      webSearch,
      languageCode,
      countryCode,
   } = ctx;
   const convId = conv?._id;

   let webSearchResult: WebSearch | undefined;
   // run websearch if:
   // - it's not continuing a previous message
   // - AND the model doesn't support tools and websearch is selected
   // - OR the assistant has websearch enabled (no tools for assistants for now)
   if (
      (!model.tools && webSearch && !conv?.assistantId) ||
      assistantHasWebSearch(assistant)
   ) {
      webSearchResult = await runNonStreamingWebSearch(
         conv ?? null,
         messages,
         assistant?.rag,
         {
            query: '',
            languageCode,
            countryCode,
         }
      );
   }

   let preprompt = conv?.preprompt;
   if (assistantHasDynamicPrompt(assistant) && preprompt) {
      preprompt = await processPreprompt(preprompt);
      if (messages[0].from === 'system') {
         messages[0].content = preprompt;
      }
   }

   let toolResults: ToolResult[] = [];

   if (model.tools && toolsPreference) {
      const tools = await getTools(toolsPreference, ctx.assistant);
      const toolCallsRequired = tools.some(
         (tool) => !toolHasName('directly_answer', tool)
      );
      if (toolCallsRequired) {
         toolResults = await runTools(ctx, tools, preprompt);
      }
   }

   const processedMessages = await preprocessMessages(
      messages,
      webSearchResult,
      convId
   );

   const generationResult = await generate(
      { ...ctx, messages: processedMessages },
      toolResults,
      preprompt
   );

   return {
      ...generationResult,
      webQuery: webSearchResult?.searchQuery,
   };
}

async function* streamingTextGenerationWithoutTitle(
   ctx: StreamingContentGenerationContext,
   done: AbortController
): AsyncGenerator<MessageUpdate, undefined, undefined> {
   yield {
      type: MessageUpdateType.Status,
      status: MessageUpdateStatus.Started,
   };

   const conversationAssistantId = ctx?.conv?.assistantId;

   ctx.assistant ??=
      conversationAssistantId &&
      (await getAssistantById(conversationAssistantId));
   const {
      model,
      conv,
      messages,
      assistant,
      isContinue,
      webSearch,
      toolsPreference,
   } = ctx;
   const convId = conv?._id;

   let webSearchResult: WebSearch | undefined;

   // run websearch if:
   // - it's not continuing a previous message
   // - AND the model doesn't support tools and websearch is selected
   // - OR the assistant has websearch enabled (no tools for assistants for now)
   if (
      !isContinue &&
      ((!model.tools && webSearch && !conv?.assistantId) ||
         assistantHasWebSearch(assistant))
   ) {
      webSearchResult = yield* runStreamingWebSearch(
         conv ?? null,
         messages,
         assistant?.rag
      );
   }

   let preprompt = conv?.preprompt;
   if (assistantHasDynamicPrompt(assistant) && preprompt) {
      preprompt = await processPreprompt(preprompt);
      if (messages[0].from === 'system') {
         messages[0].content = preprompt;
      }
   }

   let toolResults: ToolResult[] = [];

   if (model.tools && toolsPreference) {
      const tools = await getTools(toolsPreference, ctx.assistant);
      const toolCallsRequired = tools.some(
         (tool) => !toolHasName('directly_answer', tool)
      );
      if (toolCallsRequired) {
         toolResults = yield* runToolsWithStreaming(ctx, tools, preprompt);
      }
   }

   const processedMessages = await preprocessMessages(
      messages,
      webSearchResult,
      convId
   );
   yield* generateStreaming(
      { ...ctx, messages: processedMessages },
      toolResults,
      preprompt
   );
   done.abort();
}
