import type OpenAI from 'openai';
import type { Stream } from 'openai/streaming';

import type { TextGenerationStreamOutput } from '@huggingface/inference';

/**
 * Transform a stream of OpenAI.Completions.Completion into a stream of TextGenerationStreamOutput
 */
export async function* openAICompletionToTextGenerationStream(
   completionStream: Stream<OpenAI.Completions.Completion>
) {
   let generatedText = '';
   let tokenId = 0;
   for await (const completion of completionStream) {
      const { choices } = completion;
      const text = choices[0]?.text ?? '';
      const last =
         choices[0]?.finish_reason === 'stop' ||
         choices[0]?.finish_reason === 'length';
      if (text) {
         generatedText = generatedText + text;
      }
      const output: TextGenerationStreamOutput = {
         token: {
            id: tokenId++,
            text,
            logprob: 0,
            special: last,
         },
         generatedText: last ? generatedText : null,
         details: null,
      };
      yield output;
   }
}
