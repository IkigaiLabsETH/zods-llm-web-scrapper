module.exports = {
   tabWidth: 3,
   singleQuote: true,
   endOfLine: "auto",
   trailingComma: "es5",
   useTabs: false,
   importOrder: [
     "^(react|next)(/[a-zA-Z0-9]*)*$",
     "^@((reduxjs|types).)[\\w]+(.*)$",
     "^(?!src)[a-zA-Z0-9]+(.*)$",
     "^@((?!(reduxjs|types)).)[\\w]+(.*)$",
     "/^src/.*$/",
     "^(.)*(/)+(.*)$",
   ],
   importOrderSeparation: true,
   importOrderSort: "asc",
   jsxSingleQuote: true,
   plugins: ["@trivago/prettier-plugin-sort-imports"],
 };
 