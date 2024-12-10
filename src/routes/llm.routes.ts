import { Router } from 'express';

import { promptLLMWithSearch } from '@controllers/llm.controller';

const router = Router();

router.post('/prompt-search', promptLLMWithSearch);
export { router as llmRouter };
