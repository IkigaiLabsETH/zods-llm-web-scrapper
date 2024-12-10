import JSON5 from 'json5';
import z from 'zod';

import { env } from '@env';
import { isURLStringLocal } from '@lib/server/isURLLocal';
import type { Assistant } from '@lib/types/Assistant';
import type { Message } from '@lib/types/Message';
import type { MessageWebSearchUpdate } from '@lib/types/MessageUpdate';
import type {
   WebSearchQuery,
   WebSearchResult,
   WebSearchSource,
   WebSearchSourceRelevantData,
} from '@lib/types/WebSearch';
import { isURL } from '@lib/utils/isUrl';
import { logger } from '@logger';

import { makeGeneralUpdate } from '../update';
import { getWebSearchProvider, searchWeb } from './endpoints';
import { generateQuery } from './generateQuery';

const listSchema = z.array(z.string()).default([]);
const allowList = listSchema.parse(JSON5.parse(env.WEBSEARCH_ALLOWLIST));
const blockList = listSchema.parse(JSON5.parse(env.WEBSEARCH_BLOCKLIST));

export async function nonStreamingSearch(
   messages: Message[],
   ragSettings?: Assistant['rag'],
   webSearchQuery?: WebSearchQuery
): Promise<{
   searchQuery: string;
   pages: WebSearchSource[];
   relevantData: WebSearchSourceRelevantData[];
}> {
   if (ragSettings && ragSettings?.allowedLinks.length > 0) {
      return {
         searchQuery: '',
         pages: await directLinksToSource(ragSettings.allowedLinks).then(
            filterByBlockList
         ),
         relevantData: [],
      };
   }

   const query = webSearchQuery?.query;
   const searchQuery = query || (await generateQuery(messages));
   logger.info(
      `Searching ${getWebSearchProvider()} with query: ${searchQuery}`
   );

   // handle the global and (optional) rag lists
   if (ragSettings && ragSettings?.allowedDomains.length > 0) {
      logger.info('Filtering on specified domains');
   }
   const filters = buildQueryFromSiteFilters(
      [...(ragSettings?.allowedDomains ?? []), ...allowList],
      blockList
   );

   const searchQueryWithFilters = `${filters} ${searchQuery}`;
   const searchResults = await searchWeb({
      ...webSearchQuery,
      query: searchQueryWithFilters,
   }).then((result: WebSearchResult) => ({
      ...result,
      sources: filterByBlockList(result.sources),
   }));
   logger.info(`Search results: ${JSON.stringify(searchResults, null, 2)}`);

   return {
      searchQuery: searchQueryWithFilters,
      pages: searchResults.sources,
      relevantData: searchResults.relevantData,
   };
}

export async function* streamingSearch(
   messages: Message[],
   ragSettings?: Assistant['rag'],
   webSearchQuery?: WebSearchQuery
): AsyncGenerator<
   MessageWebSearchUpdate,
   {
      searchQuery: string;
      pages: WebSearchSource[];
      relevantData: WebSearchSourceRelevantData[];
   },
   undefined
> {
   if (ragSettings && ragSettings?.allowedLinks.length > 0) {
      yield makeGeneralUpdate({
         message: 'Using links specified in Assistant',
      });
      return {
         searchQuery: '',
         pages: await directLinksToSource(ragSettings.allowedLinks).then(
            filterByBlockList
         ),
         relevantData: [],
      };
   }

   const query = webSearchQuery?.query;
   const searchQuery = query || (await generateQuery(messages));
   yield makeGeneralUpdate({
      message: `Searching ${getWebSearchProvider()}`,
      args: [searchQuery],
   });

   // handle the global and (optional) rag lists
   if (ragSettings && ragSettings?.allowedDomains.length > 0) {
      yield makeGeneralUpdate({ message: 'Filtering on specified domains' });
   }
   const filters = buildQueryFromSiteFilters(
      [...(ragSettings?.allowedDomains ?? []), ...allowList],
      blockList
   );

   const searchQueryWithFilters = `${filters} ${searchQuery}`;
   const searchResults = await searchWeb({
      ...webSearchQuery,
      query: searchQueryWithFilters,
   }).then((result: WebSearchResult) => ({
      ...result,
      sources: filterByBlockList(result.sources),
   }));

   return {
      searchQuery: searchQueryWithFilters,
      pages: searchResults.sources,
      relevantData: searchResults.relevantData,
   };
}

// ----------
// Utils
function filterByBlockList(sources: WebSearchSource[]): WebSearchSource[] {
   return sources.filter(
      (result: WebSearchSource) =>
         !blockList.some((blocked) => result.link.includes(blocked))
   );
}

function buildQueryFromSiteFilters(allow: string[], block: string[]) {
   return (
      allow.map((item) => 'site:' + item).join(' OR ') +
      ' ' +
      block.map((item) => '-site:' + item).join(' ')
   );
}

async function directLinksToSource(
   links: string[]
): Promise<WebSearchSource[]> {
   if (env.ENABLE_LOCAL_FETCH !== 'true') {
      const localLinks = await Promise.all(links.map(isURLStringLocal));
      links = links.filter((_, index) => !localLinks[index]);
   }

   return links.filter(isURL).map((link) => ({
      link,
      title: '',
      text: [''],
   }));
}
