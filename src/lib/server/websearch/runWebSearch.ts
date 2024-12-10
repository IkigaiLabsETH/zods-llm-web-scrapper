import {
   defaultEmbeddingModel,
   embeddingModels,
} from '@lib/server/embeddingModels';
import type { Assistant } from '@lib/types/Assistant';
import type { Conversation } from '@lib/types/Conversation';
import type { Message } from '@lib/types/Message';
import type { MessageWebSearchUpdate } from '@lib/types/MessageUpdate';
import type {
   WebSearch,
   WebSearchQuery,
   WebSearchScrapedSource,
} from '@lib/types/WebSearch';
import { mergeAsyncGenerators } from '@lib/utils/mergeAsyncGenerators';
import { logger } from '@logger';

import { MetricsServer } from '../metrics';
import { findContextSources } from './embed/embed';
import { removeParents } from './markdown/tree';
import { scrape, scrapeWithStreaming } from './scrape/scrape';
import { convertRelevantDataToMarkdown } from './search/parsers/common.parser';
import { nonStreamingSearch, streamingSearch } from './search/search';
import {
   makeErrorUpdate,
   makeFinalAnswerUpdate,
   makeGeneralUpdate,
   makeSourcesUpdate,
} from './update';

const MAX_N_PAGES_TO_SCRAPE = 8 as const;
const MAX_N_PAGES_TO_EMBED = 5 as const;

export async function runNonStreamingWebSearch(
   conv: Conversation | null,
   messages: Message[],
   ragSettings?: Assistant['rag'],
   webSearchQuery?: WebSearchQuery
): Promise<WebSearch> {
   const prompt = messages[messages.length - 1].content;
   const createdAt = new Date();
   const updatedAt = new Date();

   MetricsServer.getMetrics().webSearch.requestCount.inc();

   try {
      let embeddingModel = embeddingModels.find(
         (m) => m.id === conv?.embeddingModel
      );
      if (!embeddingModel) {
         embeddingModel = defaultEmbeddingModel;

         if (!embeddingModel) {
            throw Error(
               `Embedding model not defined on conversation or within configuration`
            );
         }
      }

      // Search the web
      const { searchQuery, pages, relevantData } = await nonStreamingSearch(
         messages,
         ragSettings,
         webSearchQuery
      );
      if (pages.length === 0) {
         throw Error('No results found for this search query');
      }

      const allScrapedPages = await Promise.all(
         pages
            .slice(0, MAX_N_PAGES_TO_SCRAPE)
            .map(scrape(embeddingModel.chunkCharLength))
      );

      logger.info(
         `All scraped pages: ${JSON.stringify(
            allScrapedPages.map((c) => c?.link),
            null,
            3
         )}`
      );

      const scrapedPages = allScrapedPages
         .filter((p): p is WebSearchScrapedSource => Boolean(p))
         .filter((p) => p.page.markdownTree.children.length > 0)
         .slice(0, MAX_N_PAGES_TO_EMBED);

      if (!scrapedPages.length) {
         throw Error(
            `No text found in the first ${MAX_N_PAGES_TO_SCRAPE} results`
         );
      }

      // Chunk the text of each of the elements and find the most similar chunks to the prompt
      logger.info('Extracting relevant information');
      const contextSources = await findContextSources(
         scrapedPages,
         prompt,
         embeddingModel
      ).then((ctxSources) =>
         ctxSources.map((source) => ({
            ...source,
            page: {
               ...source.page,
               markdownTree: removeParents(source.page.markdownTree),
            },
         }))
      );

      const webSearch: WebSearch = {
         prompt,
         searchQuery,
         results: scrapedPages.map(({ page, ...source }) => ({
            ...source,
            page: { ...page, markdownTree: removeParents(page.markdownTree) },
         })),
         relevantData: convertRelevantDataToMarkdown(relevantData),
         contextSources,
         createdAt,
         updatedAt,
      };

      logger.info('Web search finished');

      return webSearch;
   } catch (searchError) {
      const webSearch: WebSearch = {
         prompt,
         searchQuery: '',
         results: [],
         contextSources: [],
         createdAt,
         updatedAt,
      };
      logger.info('Web search finished.', webSearch);
      return webSearch;
   }
}

export async function* runStreamingWebSearch(
   conv: Conversation | null,
   messages: Message[],
   ragSettings?: Assistant['rag'],
   webSearchQuery?: WebSearchQuery
): AsyncGenerator<MessageWebSearchUpdate, WebSearch, undefined> {
   const prompt = messages[messages.length - 1].content;
   const createdAt = new Date();
   const updatedAt = new Date();

   MetricsServer.getMetrics().webSearch.requestCount.inc();

   try {
      let embeddingModel = embeddingModels.find(
         (m) => m.id === conv?.embeddingModel
      );
      if (!embeddingModel) {
         embeddingModel = defaultEmbeddingModel;

         if (!embeddingModel) {
            throw Error(
               `Embedding model not defined on conversation or within configuration`
            );
         }
      }

      // Search the web
      const { searchQuery, pages } = yield* streamingSearch(
         messages,
         ragSettings,
         webSearchQuery
      );
      if (pages.length === 0) {
         throw Error('No results found for this search query');
      }

      // Scrape pages
      yield makeGeneralUpdate({ message: 'Browsing search results' });

      const allScrapedPages = yield* mergeAsyncGenerators(
         pages
            .slice(0, MAX_N_PAGES_TO_SCRAPE)
            .map(scrapeWithStreaming(embeddingModel.chunkCharLength))
      );
      const scrapedPages = allScrapedPages
         .filter((p): p is WebSearchScrapedSource => Boolean(p))
         .filter((p) => p.page.markdownTree.children.length > 0)
         .slice(0, MAX_N_PAGES_TO_EMBED);

      if (!scrapedPages.length) {
         throw Error(
            `No text found in the first ${MAX_N_PAGES_TO_SCRAPE} results`
         );
      }

      // Chunk the text of each of the elements and find the most similar chunks to the prompt
      yield makeGeneralUpdate({ message: 'Extracting relevant information' });
      const contextSources = await findContextSources(
         scrapedPages,
         prompt,
         embeddingModel
      ).then((ctxSources) =>
         ctxSources.map((source) => ({
            ...source,
            page: {
               ...source.page,
               markdownTree: removeParents(source.page.markdownTree),
            },
         }))
      );
      yield makeSourcesUpdate(contextSources);

      const webSearch: WebSearch = {
         prompt,
         searchQuery,
         results: scrapedPages.map(({ page, ...source }) => ({
            ...source,
            page: { ...page, markdownTree: removeParents(page.markdownTree) },
         })),
         contextSources,
         createdAt,
         updatedAt,
      };
      yield makeFinalAnswerUpdate();
      return webSearch;
   } catch (searchError) {
      const message =
         searchError instanceof Error
            ? searchError.message
            : String(searchError);
      logger.error(message);
      yield makeErrorUpdate({ message: 'An error occurred', args: [message] });

      const webSearch: WebSearch = {
         prompt,
         searchQuery: '',
         results: [],
         contextSources: [],
         createdAt,
         updatedAt,
      };
      yield makeFinalAnswerUpdate();
      return webSearch;
   }
}
