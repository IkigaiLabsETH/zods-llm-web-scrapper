import type { Conversation } from './Conversation';
import type { Timestamps } from './Timestamps';

export interface AbortedGeneration extends Timestamps {
   conversationId: Conversation['_id'];
}
