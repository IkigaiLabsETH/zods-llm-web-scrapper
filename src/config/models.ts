export const modelsConfig = [
   {
      name: 'gpt-4o',
      displayName: 'GPT 4o',
      endpoints: [
         {
            type: 'openai',
         },
      ],
   },
   {
      name: 'claude-3-5-sonnet-20240620',
      displayName: 'Claude 3.5 Sonnet',
      endpoints: [
         {
            type: 'anthropic',
         },
      ],
   },
   {
      name: 'gpt-4o-mini',
      displayName: 'GPT 4o Mini',
      tools: true,
      endpoints: [
         {
            type: 'openai',
         },
      ],
   },
   {
      name: 'gpt-3.5-turbo',
      displayName: 'GPT 3.5 Turbo',
      tools: true,
      endpoints: [
         {
            type: 'openai',
         },
      ],
   },
];
