import {
   WebSearchResult,
   WebSearchSourceRelevantData,
} from '@lib/types/WebSearch';
import { isURL } from '@lib/utils/isUrl';
import { logger } from '@logger';

import { SerpApiResponse } from '../endpoints/serpApi';

// Base interface for AnswerBox
interface AnswerBoxBase {
   type: string;
}

// Specific AnswerBox type interfaces based on SerpApi documentation

/** Calculator Answer */
interface CalculatorAnswerBox extends AnswerBoxBase {
   type: 'calculator_result';
   input: string;
   answer: string;
}

/** Currency Converter */
interface CurrencyConverterAnswerBox extends AnswerBoxBase {
   type: 'currency_converter';
   conversion: {
      from: {
         name: string;
         amount: number;
      };
      to: {
         name: string;
         amount: number;
      };
   };
}

/** Time Answer */
interface TimeAnswerBox extends AnswerBoxBase {
   type: 'time';
   date: string;
   day: string;
   time: string;
   timezone: string;
   location: string;
}

/** Weather Answer */
interface WeatherAnswerBox extends AnswerBoxBase {
   type: 'weather_result';
   location: string;
   date: string;
   temperature: string;
   unit: string;
   weather: string;
   precipitation: string;
   humidity: string;
   wind: string;
   forecast: Array<{
      day: string;
      temperature: {
         high: string;
         low: string;
      };
      weather: string;
      wind: string;
      humidity: string;
      precipitation: string;
   }>;
}

/** Dictionary Answer */
interface DictionaryAnswerBox extends AnswerBoxBase {
   type: 'dictionary_results';
   word: string;
   phonetic: string;
   audio?: string;
   definitions: Array<{
      type: string;
      definition: string;
      example?: string;
      synonyms?: string[];
   }>;
}

/** Translation Answer */
interface TranslationAnswerBox extends AnswerBoxBase {
   type: 'translation_result';
   source_language: string;
   target_language: string;
   source_text: string;
   translated_text: string;
}

/** Unit Converter */
interface UnitConverterAnswerBox extends AnswerBoxBase {
   type: 'unit_converter';
   input: {
      value: number;
      unit: string;
   };
   output: {
      value: number;
      unit: string;
   };
}

/** Featured Snippet */
interface FeaturedSnippetAnswerBox extends AnswerBoxBase {
   type: 'snippet';
   title: string;
   snippet: string;
   snippet_highlighted_words: string[];
   url: string;
   link: string;
   displayed_link: string;
   date?: string;
}

/** Knowledge Graph */
interface KnowledgeGraphAnswerBox extends AnswerBoxBase {
   type: 'knowledge_graph';
   title: string;
   type_list: string[];
   description: string;
   url: string;
   displayed_url: string;
   attributes: Record<string, string>;
   people_also_search_for?: Array<{
      title: string;
      thumbnail: string;
      link: string;
   }>;
}

/** Finance Answer */
interface FinanceAnswerBox extends AnswerBoxBase {
   type: 'finance_results';
   title: string;
   price: string;
   price_change: string;
   price_change_percentage: string;
   currency: string;
   market_time: string;
   market_cap?: string;
   previous_close?: string;
   open?: string;
   day_range?: string;
   week_range_52?: string;
   volume?: string;
   average_volume?: string;
}

export interface SportsResults {
   title: string; // Title of the sports results
   thumbnail?: string; // URL to the thumbnail image
   league?: string; // League name
   score?: string; // Score of the game
   rankings?: string; // Rankings of the team
   ranking?: number; // Ranking of the athlete
   country?: string; // Country of the athlete
   tables?: Table[]; // Array of tables containing game stats
   games?: Game[]; // Array of games containing detailed information
   game_spotlight?: GameSpotlight; // Spotlight information for a specific game
}

interface Table {
   title: string; // Title of the table
   games: GameStats[]; // Array of game statistics
}

interface GameStats {
   year?: string; // Year of the game
   matches?: string; // Number of matches played
   goals?: string; // Number of goals scored
   assists?: string; // Number of assists made
   yellow_cards?: string; // Number of yellow cards received
   red_cards?: string; // Number of red cards received
   tournament?: string; // Tournament name
   link?: string; // Link to the tournament details
}

interface Game {
   tournament?: string; // Tournament name
   stage?: string; // Stage of the game (e.g., Round 1, Final)
   status?: string; // Status of the game (e.g., FT, In Progress)
   date?: string; // Date of the game
   time?: string; // Time of the game
   stadium?: string; // Stadium name
   stadium_kgmid?: string; // Stadium Knowledge Graph ID
   video_highlights?: VideoHighlight; // Video highlights of the game
   teams?: Team[]; // Array of teams participating in the game
}

interface GameSpotlight {
   league?: string;
   stadium?: string;
   status?: string;
   date?: string;
   stage?: string;
   video_highlight_carousel?: VideoHighlight[];
   teams?: Team[];
}

interface VideoHighlight {
   link?: string; // URL to the video highlights
   thumbnail?: string; // URL to the video thumbnail
   duration?: string; // Duration of the video highlights
}

interface Team {
   name: string; // Team name
   score?: string; // Team score
   kgmid?: string; // Team Knowledge Graph ID
   thumbnail?: string; // URL to the team thumbnail
   red_card?: string; // Indicates if the team received a red card
   seeding?: number; // Seeding of the team (if applicable)
   team_stats?: TeamStats; // Statistics of the team
   penalty_score?: number; // Penalty score (if applicable)
   goal_summary?: GoalSummary[]; // Summary of goals scored by players
   red_cards_summary?: RedCardSummary[]; // Summary of red cards received by players
}

interface TeamStats {
   wins?: number; // Number of wins
   losses?: number; // Number of losses
}

interface GoalSummary {
   player: Player; // Player who scored the goal
   goals: Goal[]; // List of goals scored by the player
}

interface Player {
   name: string; // Player name
   jersey_number?: string; // Player jersey number
   position?: string; // Player position
}

interface Goal {
   type?: string; // Type of goal (e.g., penalty)
   in_game_time: GameTime; // Time when the goal was scored
}

interface GameTime {
   minute: number; // Minute of the game
   second: number; // Second of the game
   stoppage?: number; // Stoppage time (if applicable)
}

interface RedCardSummary {
   player: Player; // Player who received the red card
   cards: {
      in_game_time: GameTime;
   }[]; // List of times when red cards were received
}

/** Disambiguation Answer */
interface DisambiguationAnswerBox extends AnswerBoxBase {
   type: 'disambiguation';
   list: Array<{
      title: string;
      snippet: string;
      link: string;
   }>;
}

/** List of all possible AnswerBox types */
export type AnswerBox =
   | CalculatorAnswerBox
   | CurrencyConverterAnswerBox
   | TimeAnswerBox
   | WeatherAnswerBox
   | DictionaryAnswerBox
   | TranslationAnswerBox
   | UnitConverterAnswerBox
   | FeaturedSnippetAnswerBox
   | KnowledgeGraphAnswerBox
   | FinanceAnswerBox
   | DisambiguationAnswerBox;

export interface ImmersiveProductSnippet {
   title: string;
   link?: string;
   source: string;
}

export interface ImmersiveProduct {
   category?: string;
   source: string;
   title: string;
   price?: string;
   extracted_price?: number;
   original_price?: string;
   extracted_original_price?: number;
   location?: string;
   delivery?: string;
   returns?: string;
   extensions?: string[];
}

export interface NewsResult {
   position: number;
   title: string;
   link: string;
   source: string;
   date: string;
   snippet?: string;
}

export interface TwitterTweetFromResult {
   author?: {
      twitter_blue: boolean;
      name: string;
      handle: string;
   };
   link: string;
   snippet?: string;
   published_date?: string;
}

export interface TwitterResult {
   title: string;
   link: string;
   displayed_link: string;
   tweets?: TwitterTweetFromResult[];
}

export interface EventResult {
   title: string;
   time?: string;
   date?:
      | {
           start_date: string;
           when: string;
        }
      | string;
   venue?: string;
   address?: string[];
   link?: string;
}

export interface KnowledgeGraph {
   title: string;
   description: string;
   source?: {
      name: string;
      link: string;
   };
}

// Function to process the AnswerBox based on its type
const processAnswerBox = (
   answerBox: AnswerBox
): WebSearchSourceRelevantData[] => {
   const relevantData: WebSearchSourceRelevantData[] = [];

   switch (answerBox.type) {
      case 'calculator_result': {
         const { input, answer } = answerBox as CalculatorAnswerBox;
         relevantData.push({
            title: 'Calculator Result',
            content: `Input: ${input}, Answer: ${answer}`,
         });
         break;
      }
      case 'currency_converter': {
         const { conversion } = answerBox as CurrencyConverterAnswerBox;
         relevantData.push({
            title: 'Currency Converter',
            content: `Converted ${conversion.from.amount} ${conversion.from.name} to ${conversion.to.amount} ${conversion.to.name}`,
         });
         break;
      }
      case 'time': {
         const { time, day, date, timezone, location } =
            answerBox as TimeAnswerBox;
         relevantData.push({
            title: 'Time',
            content: `Current time in ${location}: ${time}, ${day}, ${date}, Timezone: ${timezone}`,
         });
         break;
      }
      case 'weather_result': {
         const { location, temperature, unit, weather, forecast } =
            answerBox as WeatherAnswerBox;
         let content = `Weather in ${location}: ${temperature}°${unit}, ${weather}`;

         if (forecast) {
            content += '\nForecast:';
            forecast.forEach((dayForecast) => {
               content += `\n${dayForecast.day}, ${dayForecast.temperature.high}°${unit}, ${dayForecast.temperature.low}°${unit}, ${dayForecast.weather}`;
            });
         }
         relevantData.push({
            title: 'Weather',
            content,
         });
         break;
      }
      case 'dictionary_results': {
         const { word, phonetic, definitions } =
            answerBox as DictionaryAnswerBox;
         let content = `Word: ${word} [${phonetic}]`;

         definitions.forEach((definition, index) => {
            content += `\n${index + 1}. (${definition.type}) ${
               definition.definition
            }${definition.example ? ` - Example: ${definition.example}` : ''}${
               definition.synonyms
                  ? ` - Synonyms: ${definition.synonyms.join(', ')}`
                  : ''
            }`;
         });
         relevantData.push({
            title: 'Dictionary',
            content,
         });
         break;
      }
      case 'translation_result': {
         const {
            source_language,
            target_language,
            source_text,
            translated_text,
         } = answerBox as TranslationAnswerBox;

         relevantData.push({
            title: 'Translation',
            content: `Translation from ${source_language} to ${target_language}:\n"${source_text}" => "${translated_text}"`,
         });
         break;
      }
      case 'unit_converter': {
         const { input, output } = answerBox as UnitConverterAnswerBox;
         relevantData.push({
            title: 'Unit Converter',
            content: `Converted ${input.value} ${input.unit} to ${output.value} ${output.unit}`,
         });
         break;
      }
      case 'snippet': {
         const { title, snippet, url } = answerBox as FeaturedSnippetAnswerBox;
         relevantData.push({
            title: 'Featured Snippet',
            content: `Title: ${title}\nSnippet: ${snippet}\nURL: ${url}`,
         });
         break;
      }
      case 'knowledge_graph': {
         const { title, description, url, attributes } =
            answerBox as KnowledgeGraphAnswerBox;
         let content = `Title: ${title}\nDescription: ${description}\nURL: ${url}`;

         if (attributes) {
            content += '\nAttributes:';
            Object.entries(attributes).forEach(([key, value]) => {
               content += `\n${key}: ${value}`;
            });
         }
         relevantData.push({
            title: 'Knowledge Graph',
            content,
         });
         break;
      }
      case 'finance_results': {
         const {
            title,
            price,
            price_change,
            price_change_percentage,
            currency,
            market_time,
         } = answerBox as FinanceAnswerBox;
         relevantData.push({
            title: 'Finance Results',
            content: `Finance Results for ${title}:\nPrice: ${price} ${currency}\nChange: ${price_change} (${price_change_percentage})\nMarket Time: ${market_time}`,
         });
         break;
      }
      case 'disambiguation': {
         const { list } = answerBox as DisambiguationAnswerBox;
         let content = 'Disambiguation List:';
         list.forEach((item) => {
            content += `\nTitle: ${item.title}\nSnippet: ${item.snippet}\nLink: ${item.link}`;
         });
         relevantData.push({
            title: 'Disambiguation',
            content,
         });
         break;
      }
      default:
         logger.warn(`Unknown answer box type: ${JSON.stringify(answerBox)}`);
         break;
   }

   return relevantData;
};

const processEvents = (
   events: EventResult[]
): WebSearchSourceRelevantData[] => {
   const relevantData: WebSearchSourceRelevantData[] = [];

   events.forEach((event) => {
      let content = '';

      if (event.date) {
         content += `Date: ${event.date}\n`;
      }
      if (event.time) {
         content += `Time: ${event.time}\n`;
      }
      if (event.venue) {
         content += `Venue: ${event.venue}\n`;
      }

      if (event.address) {
         content += `Address: ${event.address.join(', ')}\n`;
      }

      if (event.link) {
         content += `Link: ${event.link}\n`;
      }

      relevantData.push({
         title: `Event - ${event.title}`,
         content,
      });
   });

   return relevantData;
};

const processImmersiveProducts = (
   products: ImmersiveProduct[]
): WebSearchSourceRelevantData[] => {
   const relevantData: WebSearchSourceRelevantData[] = [];

   products.forEach((product) => {
      let content = `Source: ${product.source}`;

      if (product.category) {
         content += `\nCategory: ${product.category}`;
      }
      if (product.price) {
         content += `\nPrice: ${product.price}`;
      }
      if (product.original_price) {
         content += `\nOriginal Price: ${product.original_price}`;
      }
      if (product.location && !product.location.includes('nearby')) {
         content += `\nLocation: ${product.location}`;
      }
      if (product.delivery) {
         content += `\nDelivery: ${product.delivery}`;
      }
      if (product.returns) {
         content += `\nReturns: ${product.returns}`;
      }
      relevantData.push({
         title: `Product - ${product.title}`,
         content,
      });
   });

   return relevantData;
};

const processNewsResults = (
   news: NewsResult[]
): WebSearchSourceRelevantData[] => {
   const relevantData: WebSearchSourceRelevantData[] = [];

   news.forEach((item) => {
      let content = `Title: ${item.title}\nDate: ${item.date}`;
      if (item.snippet) {
         content += `\nSnippet: ${item.snippet}`;
      }

      relevantData.push({
         title: `News - ${item.title}`,
         content,
      });
   });

   return relevantData;
};

const processTwitterResults = (
   twitter: TwitterResult[]
): WebSearchSourceRelevantData[] => {
   const relevantData: WebSearchSourceRelevantData[] = [];

   for (const item of twitter) {
      if (!item.tweets) {
         continue;
      }

      const tweets = item.tweets.filter((t) => t.published_date && t.snippet);

      if (tweets.length === 0) {
         continue;
      }

      let content = 'Tweets Overview:\n';

      for (const tweet of tweets) {
         content += `\n${tweet.published_date!}: ${tweet.snippet}`;
      }

      relevantData.push({
         title: `Twitter - ${item.title}`,
         content,
      });
   }

   return relevantData;
};

const processKnowledgeGraph = (
   knowledgeGraph: KnowledgeGraph
): WebSearchSourceRelevantData[] => {
   return [
      {
         title: `Knowledge Graph${
            knowledgeGraph.source?.name
               ? ` - ${knowledgeGraph.source.name}`
               : ''
         }`,
         content: `Title: ${knowledgeGraph.title}\nDescription: ${knowledgeGraph.description}`,
      },
   ];
};

const processSportsResults = (
   sports: SportsResults
): WebSearchSourceRelevantData[] => {
   let content = `## Sports Results\n------------\nTitle: ${sports.title}`;
   if (sports.rankings) {
      content += `\nTeam Rankings: ${sports.rankings}`;
   }
   if (sports.rankings) {
      content += `\nPlayer Rankings: ${sports.rankings}`;
   }

   if (sports.games) {
      content += `\n### Games`;
      for (const game of sports.games) {
         if (game.tournament) {
            content += `\nTournament: ${game.tournament} - Stage: ${game.stage}`;
         }
         if (game.stadium) {
            content += `\nStadium: ${game.stadium}`;
         }
         if (game.status) {
            content += `\nStatus: ${game.status}`;
         }
         if (game.date) {
            content += `\nDate: ${game.date}`;
         }
         if (game.time) {
            content += `\nTime: ${game.time}`;
         }
         if (game.teams) {
            game.teams.forEach((team) => {
               content += `\nTeam: ${team.name} - Score: ${team.score}`;
            });
         }
      }
   }

   if (sports.game_spotlight) {
      const gsp = sports.game_spotlight;

      content += `\n\n### Game Spotlight`;
      if (gsp.league) {
         content += `\nLeague: ${gsp.league}`;
      }
      if (gsp.stadium) {
         content += `\nStadium: ${gsp.stadium}`;
      }
      if (gsp.stage) {
         content += `\nStage: ${gsp.stage}`;
      }
      if (gsp.date) {
         content += `\nDate: ${gsp.date}`;
      }
      if (gsp.status) {
         content += `\nStatus: ${gsp.status}`;
      }
      if (gsp.teams) {
         gsp.teams.forEach((team) => {
            content += `\nTeam: ${team.name}`;

            if (team.team_stats) {
               content += ` - Stats: ${team.team_stats.wins} wins and ${team.team_stats.losses} losses`;
            }

            if (team.score) {
               content += `\nScore: ${team.score}`;
            }
            if (team.penalty_score) {
               content += `\nPenalty Score: ${team.penalty_score}`;
            }

            if (team.goal_summary) {
               content += '\n### Goals Summary';
               team.goal_summary.forEach((goalSummary) => {
                  if (goalSummary.player) {
                     content += `\nPlayer: ${goalSummary.player.name} (${goalSummary.player.position}) - Position: ${goalSummary.player.position}`;
                  }
                  if (goalSummary.goals) {
                     content += '\nGoals';
                     goalSummary.goals.forEach((goal, i) => {
                        content += `\n${i + 1}. goal - ${
                           goal.in_game_time.minute
                        }' ${
                           goal.in_game_time.stoppage
                              ? '+' + goal.in_game_time.stoppage
                              : ''
                        }`;
                     });
                  }
               });
            }

            if (team.red_cards_summary) {
               content += '\n### Red Cards Summary';
               team.red_cards_summary.forEach((cardSummary) => {
                  if (cardSummary.player) {
                     content += `\nPlayer: ${cardSummary.player.name} (${cardSummary.player.position}) - Position: ${cardSummary.player.position}`;
                  }

                  if (cardSummary.cards) {
                     content += '\nCards';
                     cardSummary.cards
                        .filter((card) => card.in_game_time.minute)
                        .forEach((card, i) => {
                           content += `\n${i + 1}. card - ${
                              card.in_game_time.minute
                           }' ${
                              card.in_game_time.stoppage
                                 ? '+' + card.in_game_time.stoppage
                                 : ''
                           }`;
                        });
                  }
               });
            }
         });

         content += '\n';
      }
   }

   return [
      {
         title: `Sports - ${sports.title}`,
         content,
      },
   ];
};

export async function parseSerpApiSearchResult(
   result: SerpApiResponse
): Promise<WebSearchResult> {
   const searchResult: WebSearchResult = {
      sources: result.organic_results.filter(({ link }) => isURL(link)),
      relevantData: [],
   };

   const relevantData: WebSearchSourceRelevantData[] = [];
   try {
      // Process the answer box
      if (result.answer_box) {
         const answerBoxData = processAnswerBox(result.answer_box);
         relevantData.push(...answerBoxData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed answer box'
         );
      }

      // Process the events
      if (result.events_results) {
         const eventsData = processEvents(result.events_results);
         relevantData.push(...eventsData);
         logger.info('parseSerpApiSearchResult: Found and processed events');
      }

      // Process the news results
      if (result.news_results) {
         const newsData = processNewsResults(result.news_results);
         relevantData.push(...newsData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed news results'
         );
      }

      // Process the twitter results
      if (result.twitter_results) {
         const twitterData = processTwitterResults(result.twitter_results);
         relevantData.push(...twitterData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed twitter results'
         );
      }

      // Process the knowledge graph
      if (result.knowledge_graph) {
         const knowledgeGraphData = processKnowledgeGraph(
            result.knowledge_graph
         );
         relevantData.push(...knowledgeGraphData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed knowledge graph'
         );
      }

      // Process the immersive products
      if (result.immersive_products) {
         const immersiveProductsData = processImmersiveProducts(
            result.immersive_products
         );
         relevantData.push(...immersiveProductsData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed immersive products'
         );
      }

      // Process the sports results
      if (result.sports_results) {
         const sportsData = processSportsResults(result.sports_results);
         relevantData.push(...sportsData);
         logger.info(
            'parseSerpApiSearchResult: Found and processed sports results'
         );
      }

      return searchResult;
   } catch (error) {
      logger.error(
         'parseSerpApiSearchResult: Failed to parse SerpApi search result',
         JSON.stringify(error, null, 2)
      );
      return searchResult;
   }
}
