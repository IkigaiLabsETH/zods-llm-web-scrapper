import { Request, Response } from 'express';
import { z } from 'zod';

import { models } from '@lib/server/models';
import { nonStreamingTextGeneration } from '@lib/server/textGeneration';
import { NonStreamingContentGenerationContext } from '@lib/server/textGeneration/types';
import { CountryCode } from '@lib/types/Country';
import { LanguageCode } from '@lib/types/Language';
import { isValidCountry, isValidLanguage } from '@lib/utils/country.utils';

export const promptLLMWithSearch = async (req: Request, res: Response) => {
   const data = await req.body;

   if (!data) {
      return res.status(400).json({ error: 'Invalid request' });
   }

   const {
      prompt: newPrompt,
      systemPrompt,
      model: modelName,
      language,
      country,
   } = z
      .object({
         prompt: z
            .string()
            .min(1)
            .transform((s) => s.replace(/\r\n/g, '\n')),
         systemPrompt: z.optional(z.string()),
         model: z.string().min(3),
         language: z.optional(z.string()),
         country: z.optional(z.string()),
      })
      .parse(data);

   if (country && !isValidCountry(country)) {
      return res.status(400).json({ error: 'Invalid country code' });
   }

   if (language && !isValidLanguage(language)) {
      return res.status(400).json({ error: 'Invalid language code' });
   }

   const model = models.find((model) => model.id === modelName);
   if (!model) {
      res.status(400).json({ error: 'Model not supported' });
   }

   const ctx: NonStreamingContentGenerationContext = {
      model: model!,
      endpoint: await model!.getEndpoint(),
      messages: [
         {
            from: 'system',
            id: '0',
            content: systemPrompt ?? 'You are a web scrapper that extracts data from the web.',
         },
         {
            from: 'user',
            id: '1',
            content: newPrompt,
         },
      ],
      webSearch: true,
      languageCode: (language as LanguageCode) ?? 'en',
      countryCode: (country as CountryCode) ?? 'us',
      promptedAt: new Date(),
   };

   const result = await nonStreamingTextGeneration(ctx);
   res.status(200).json({ ...result });
};
