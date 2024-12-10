import type { Assistant } from '@lib/types/Assistant';
import type { Conversation } from '@lib/types/Conversation';
import { CountryCode } from '@lib/types/Country';
import { LanguageCode } from '@lib/types/Language';
import type { Message } from '@lib/types/Message';

import type { Endpoint, StreamingEndpoint } from '../endpoints/endpoints';
import type { ProcessedModel } from '../models';

interface ContentGenerationContext<TEndpoint> {
   model: ProcessedModel;
   endpoint: TEndpoint;
   conv?: Conversation;
   messages: Message[];
   assistant?: Pick<
      Assistant,
      'rag' | 'dynamicPrompt' | 'generateSettings' | 'tools'
   >;
   isContinue?: boolean;
   webSearch: boolean;
   toolsPreference?: Array<string>;
   promptedAt: Date;
   ip?: string;
   username?: string;
   languageCode?: LanguageCode;
   countryCode?: CountryCode;
}

export interface StreamingContentGenerationContext
   extends ContentGenerationContext<StreamingEndpoint> {}

export interface NonStreamingContentGenerationContext
   extends ContentGenerationContext<Endpoint> {}
