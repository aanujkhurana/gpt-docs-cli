/**
 * A simple token counter for estimating OpenAI API usage
 * This is a very rough approximation - for more accurate counts, use a proper tokenizer
 */
export function countTokens(text: string): number {
  // A very simple approximation: 1 token ≈ 4 characters for English text
  // This is not accurate for all languages and special tokens
  // For production use, consider using a proper tokenizer like GPT-3 Tokenizer
  return Math.ceil(text.length / 4);
}

/**
 * Calculate the approximate cost of tokens based on the model
 */
export function calculateCost(tokens: number, model: string): number {
  // Pricing as of November 2023 - may need updates
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4': { input: 0.03 / 1000, output: 0.06 / 1000 },
    'gpt-4-32k': { input: 0.06 / 1000, output: 0.12 / 1000 },
    'gpt-3.5-turbo': { input: 0.0015 / 1000, output: 0.002 / 1000 },
    'gpt-3.5-turbo-16k': { input: 0.003 / 1000, output: 0.004 / 1000 },
  };

  // Default to gpt-3.5-turbo pricing if model not found
  const rates = pricing[model] || pricing['gpt-3.5-turbo'];
  
  // Assume input tokens are 80% of total and output tokens are 20%
  // This is a rough estimate and will vary by use case
  const inputTokens = Math.ceil(tokens * 0.8);
  const outputTokens = Math.ceil(tokens * 0.2);
  
  return (inputTokens * rates.input) + (outputTokens * rates.output);
}