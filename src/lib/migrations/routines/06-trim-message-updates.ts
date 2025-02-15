import type { Migration } from '.';

import { ObjectId, type WithId } from 'mongodb';

import { collections } from '@lib/server/database';
import type { Conversation } from '@lib/types/Conversation';
import type { Message } from '@lib/types/Message';
import {
   MessageUpdateType,
   MessageWebSearchUpdateType,
   type MessageUpdate,
} from '@lib/types/MessageUpdate';
import { logger } from '@logger';

// -----------

/** Converts the old message update to the new schema */
function convertMessageUpdate(
   message: Message,
   update: MessageUpdate
): MessageUpdate | null {
   try {
      // trim final websearch update, and sources update

      if (update.type === 'webSearch') {
         if (update.subtype === MessageWebSearchUpdateType.Sources) {
            return {
               type: MessageUpdateType.WebSearch,
               subtype: MessageWebSearchUpdateType.Sources,
               message: update.message,
               sources: update.sources.map(({ link, title }) => ({
                  link,
                  title,
               })),
            };
         } else if (update.subtype === MessageWebSearchUpdateType.Finished) {
            return {
               type: MessageUpdateType.WebSearch,
               subtype: MessageWebSearchUpdateType.Finished,
            };
         }
      }

      return update;
   } catch (error) {
      logger.error(
         `Error converting message update during migration. Skipping it. ${error}`,
         {
            message: update,
         }
      );
      return null;
   }
}

const trimMessageUpdates: Migration = {
   _id: new ObjectId('5f9f5f5f5f5f5f5f5f5f3f5f'),
   name: 'Trim message updates to reduce stored size',
   up: async () => {
      const allConversations = collections.conversations.find({});

      let conversation: WithId<Pick<Conversation, 'messages'>> | null = null;
      while ((conversation = await allConversations.tryNext())) {
         const messages = conversation.messages.map((message) => {
            // Convert all of the existing updates to the new schema
            const updates = message.updates
               ?.map((update) => convertMessageUpdate(message, update))
               .filter((update): update is MessageUpdate => Boolean(update));

            return { ...message, updates };
         });

         // Set the new messages array
         await collections.conversations.updateOne(
            { _id: conversation._id },
            { $set: { messages } }
         );
      }

      return true;
   },
   runEveryTime: false,
};

export default trimMessageUpdates;
