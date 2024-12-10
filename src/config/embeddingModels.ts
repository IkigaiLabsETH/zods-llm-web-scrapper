export const embeddingModelsConfig = [
   {
      id: 'text-embedding-3-small',
      name: 'text-embedding-3-small',
      displayName: 'text-embedding-3-small',
      description: 'OpenAI Text Embedding 3 Small',
      chunkCharLength: 1536,
      endpoints: [
         {
            type: 'openai',
         },
      ],
   },
   {
      id: 'text-embedding-3-large',
      name: 'text-embedding-3-large',
      displayName: 'text-embedding-3-large',
      chunkCharLength: 1536,
      endpoints: [
         {
            type: 'openai',
         },
      ],
   },
];
