// Central prompt registry. Add new prompt modules here so controllers have a
// single import point, e.g.:
//   export { buildProductRecommenderPrompt } from "./recommender.prompt.js";
export { STORE_FACTS, buildChatSystemPrompt } from "./chat.prompt.js";
