import { getJson, type GoogleParameters } from 'serpapi';

import { env } from '@env';
import type { WebSearchQuery, WebSearchResult } from '@lib/types/WebSearch';
import { logger } from '@logger';

import {
   AnswerBox,
   EventResult,
   ImmersiveProduct,
   KnowledgeGraph,
   NewsResult,
   parseSerpApiSearchResult,
   SportsResults,
   TwitterResult,
} from '../parsers/serpApi.parser';

export type SerpApiResponse = {
   organic_results: {
      link: string;
   }[];
   answer_box?: AnswerBox;
   events_results?: EventResult[];
   twitter_results?: TwitterResult[];
   news_results?: NewsResult[];
   knowledge_graph?: KnowledgeGraph;
   immersive_products?: ImmersiveProduct[];
   sports_results?: SportsResults;
};

export default async function searchWebSerpApi(
   searchQuery: WebSearchQuery
): Promise<WebSearchResult> {
   const query = searchQuery?.query;
   let { languageCode, countryCode } = searchQuery || {};
   if (!query) {
      throw new Error('searchWebSerpApi: Query is required');
   }

   if (!countryCode) {
      logger.warn(
         'searchWebSerpApi: Country code not provided, using US as default'
      );
      countryCode = 'us';
   }

   if (!languageCode) {
      logger.warn(
         'searchWebSerpApi: Language code not provided, using English as default'
      );
      languageCode = 'en';
   }

   const params = {
      q: query,
      hl: languageCode,
      gl: countryCode,
      google_domain: 'google.com',
      api_key: env.SERPAPI_KEY,
   } satisfies GoogleParameters;

   // Show result as JSON
   const response = (await getJson(
      'google',
      params
   )) as unknown as SerpApiResponse;

   const parsedResult = await parseSerpApiSearchResult(response);
   return parsedResult;
}
