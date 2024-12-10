# ZODs LLM Web Scrapper

An advanced web scraping service that intelligently extracts and processes web content using embedding models. The service makes smart decisions about content relevancy based on embedding analysis, with support for multi-language and region-specific scraping.

Main purpose of this service is to extract relevant data from the web to feed provide fresh data to LLMs (AI models).

## Overview

This service performs intelligent web scraping by combining search engine results with deep content analysis. It uses embedding models to evaluate content relevance and processes HTML content to extract meaningful information across different languages and regions.

## Key Features

- Intelligent web search and content discovery
- Multi-language and region-specific content scraping
- Smart HTML content processing and relevancy analysis
- Multiple embedding model integrations:
  - HuggingFace
  - OpenAI
  - Google VertexAI
  - AWS Bedrock
  - Anthropic
  - Cohere
- Built-in rate limiting and request management
- Automated content relevancy scoring
- Browser-based scraping with Playwright
- Ad blocking and content cleaning
- Metrics and monitoring integration

## Tech Stack

- TypeScript / Node.js
- Express.js
- Playwright for browser automation
- MongoDB for data storage
- Vite for build tooling
- Winston/Pino for logging
- Prometheus for metrics
- Multiple AI provider SDKs

# Getting Started

Quick setup guide for ZODs LLM Web Scrapper.

## Prerequisites

- Node.js >= 20
- pnpm
- MongoDB instance
- API keys for:
  - OpenAI
  - Google API (VertexAI)
  - HuggingFace
  - Search API

## Installation

1. Clone and install dependencies:
```bash
git clone https://github.com/ZODs-Labs/zods-llm-web-scrapper.git
cd zods-llm-web-scrapper
pnpm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

### More setup steps will be added here.
