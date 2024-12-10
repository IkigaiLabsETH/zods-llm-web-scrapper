import { env } from '@env';
import {
   WebSearchProvider,
   WebSearchQuery,
   type WebSearchResult,
} from '@lib/types/WebSearch';

import searchSerpApi from './endpoints/serpApi';

export function getWebSearchProvider() {
   if (env.YDC_API_KEY) {
      return WebSearchProvider.YOU;
   }
   if (env.SEARXNG_QUERY_URL) {
      return WebSearchProvider.SEARXNG;
   }
   if (env.BING_SUBSCRIPTION_KEY) {
      return WebSearchProvider.BING;
   }
   return WebSearchProvider.GOOGLE;
}

/** Searches the web using the first available provider, based on the env */
export async function searchWeb(
   searchQuery: WebSearchQuery
): Promise<WebSearchResult> {
   if (env.SERPAPI_KEY) {
      return searchSerpApi(searchQuery);
   }
   // if (env.USE_LOCAL_WEBSEARCH) {
   //    return searchWebLocal(query);
   // }
   // if (env.SEARXNG_QUERY_URL) {
   //    return searchSearxng(query);
   // }
   // if (env.SERPER_API_KEY) {
   //    return searchSerper(query);
   // }
   // if (env.YDC_API_KEY) {
   //    return searchYouApi(query);
   // }
   // if (env.SERPSTACK_API_KEY) {
   //    return searchSerpStack(query);
   // }
   // if (env.SEARCHAPI_KEY) {
   //    return searchSearchApi(query);
   // }
   // if (env.BING_SUBSCRIPTION_KEY) {
   //    return searchBing(query);
   // }
   throw new Error(
      'No configuration found for web search. Please set USE_LOCAL_WEBSEARCH, SEARXNG_QUERY_URL, SERPER_API_KEY, YDC_API_KEY, SERPSTACK_API_KEY, or SEARCHAPI_KEY in your environment variables.'
   );
}
