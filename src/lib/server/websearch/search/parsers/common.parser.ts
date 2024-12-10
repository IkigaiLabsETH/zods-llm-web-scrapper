import { WebSearchSourceRelevantData } from '@lib/types/WebSearch';

export const convertRelevantDataToMarkdown = (
   relevantData: WebSearchSourceRelevantData[]
) => {
   const content = relevantData
      .map((data) => {
         return `### ${data.title}\n${data.content}`;
      })
      .join('\n');

   return `## Relevant Data\n${content}`;
};
