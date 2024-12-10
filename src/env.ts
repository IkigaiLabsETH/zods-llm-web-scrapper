import dotenv from 'dotenv';

const isProduction = process.env.NODE_ENV === 'production';
if (isProduction) {
   dotenv.config();
} else {
   dotenv.config({ path: '.env.local' });
}

export const env = {
   NODE_ENV: process.env.NODE_ENV!,
   IS_PRODUCTION: isProduction,
   ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || '',
   PORT: process.env.PORT!,
   PLAYWRIGHT_ADBLOCKER: process.env.PLAYWRIGHT_ADBLOCKER!,
   WEBSEARCH_JAVASCRIPT: process.env.WEBSEARCH_JAVASCRIPT!,
   WEBSEARCH_TIMEOUT: process.env.WEBSEARCH_TIMEOUT!,
   METRICS_ENABLED: process.env.METRICS_ENABLED!,
   METRICS_PORT: process.env.METRICS_PORT!,
   BING_SUBSCRIPTION_KEY: process.env.BING_SUBSCRIPTION_KEY,
   SEARCHAPI_KEY: process.env.SEARCHAPI_KEY,
   SEARXNG_QUERY_URL: process.env.SEARXNG_QUERY_URL,
   SERPAPI_KEY: process.env.SERPAPI_KEY,
   TASK_MODEL: process.env.TASK_MODEL!,
   HF_TOKEN: process.env.HF_TOKEN,
   OPENAI_API_KEY: process.env.OPENAI_API_KEY!,
   ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY!,
   GOOGLE_GENAI_API_KEY: process.env.GOOGLE_GENAI_API_KEY,
   ENABLE_ASSISTANTS_RAG: process.env.ENABLE_ASSISTANTS_RAG!,
   LLM_SUMMARIZATION: process.env.LLM_SUMMARIZATION!,
   TOOLS: process.env.TOOLS!,
   WEBSEARCH_ALLOWLIST: process.env.WEBSEARCH_ALLOWLIST!,
   WEBSEARCH_BLOCKLIST: process.env.WEBSEARCH_BLOCKLIST!,
   COHERE_API_TOKEN: process.env.COHERE_API_TOKEN,
   HF_ACCESS_TOKEN: process.env.HF_ACCESS_TOKEN,
   ENABLE_LOCAL_FETCH: process.env.ENABLE_LOCAL_FETCH,
   IP_TOKEN_SECRET: process.env.IP_TOKEN_SECRET,
   SERPER_API_KEY: process.env.SERPER_API_KEY,
   SERPSTACK_API_KEY: process.env.SERPSTACK_API_KEY,
   YDC_API_KEY: process.env.YDC_API_KEY,
   USE_LOCAL_WEBSEARCH: process.env.USE_LOCAL_WEBSEARCH,
   MONGODB_URL: process.env.MONGODB_URL!,
   MONGODB_DIRECT_CONNECTION: process.env.MONGODB_DIRECT_CONNECTION,
   MONGODB_DB_NAME: process.env.MONGODB_DB_NAME!,
   TEXT_EMBEDDING_MODELS: process.env.TEXT_EMBEDDING_MODELS!,
   CLOUDFLARE_ACCOUNT_ID: process.env.CLOUDFLARE_ACCOUNT_ID,
   CLOUDFLARE_API_TOKEN: process.env.CLOUDFLARE_API_TOKEN,
   RATE_LIMIT: process.env.RATE_LIMIT,
   USAGE_LIMITS: process.env.USAGE_LIMITS,
   MODELS: process.env.MODELS!,
   HF_API_ROOT: process.env.HF_API_ROOT,
   OLD_MODELS: process.env.OLD_MODELS,
   AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID!,
   AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY!,
   AWS_REGION: process.env.AWS_REGION!,
   AWS_CLOUDWATCH_LOG_GROUP: process.env.AWS_CLOUDWATCH_LOG_GROUP!,
};

console.log(`Env loaded: ${JSON.stringify(env)}`);
