import { format } from 'date-fns';
import type { ObjectId } from 'mongodb';

import type { Message } from '@lib/types/Message';
import { logger } from '@logger';

import { downloadFile } from '../files/downloadFile';
import type { EndpointMessage } from './endpoints';

export async function preprocessMessages(
   messages: Message[],
   webSearch: Message['webSearch'],
   convId?: ObjectId
): Promise<EndpointMessage[]> {
   return Promise.resolve(messages)
      .then((msgs) => addWebSearchContext(msgs, webSearch))
      .then((msgs) => downloadFiles(msgs, convId));
}

function addWebSearchContext(
   messages: Message[],
   webSearch: Message['webSearch']
) {
   const webSearchContext = webSearch?.contextSources
      .map(({ context }) => context.trim())
      .join('\n\n----------\n\n');

   // No web search context available, skip
   if (!webSearch || !webSearchContext?.trim()) {
      return messages;
   }
   // No messages available, skip
   if (messages.length === 0) {
      return messages;
   }

   const lastQuestion = messages.at(-1)?.content ?? '';
   const previousQuestions = messages
      .filter((el) => el.from === 'user')
      .slice(0, -1)
      .map((el) => el.content);
   const currentDate = format(new Date(), 'MMMM d, yyyy HH:mm');

   const finalMessage = {
      ...messages[messages.length - 1],
      content: `I searched the web using the query: ${webSearch.searchQuery}.
Today is ${currentDate} and here are the results:
=====================
${webSearchContext}
${
   webSearch.relevantData
      ? `\n\nRelevant data found on Google: \n${webSearch.relevantData}\n`
      : ''
}
=====================
${
   previousQuestions.length > 0
      ? `Previous questions: \n- ${previousQuestions.join('\n- ')}`
      : ''
}
Answer the question: ${lastQuestion}`,
   };

   logger.info(`Final message: ${JSON.stringify(finalMessage, null, 2)}`);

   return [...messages.slice(0, -1), finalMessage];
}

async function downloadFiles(
   messages: Message[],
   convId?: ObjectId
): Promise<EndpointMessage[]> {
   return Promise.all(
      messages.map<Promise<EndpointMessage>>((message) =>
         Promise.all(
            (message.files ?? []).map((file) =>
               downloadFile(file.value, convId)
            )
         ).then((files) => ({ ...message, files }))
      )
   );
}
