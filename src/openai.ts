import OpenAI from 'openai';
import { countTokens } from './utils/tokenCounter.js';

interface GenerateCommentOptions {
  code: string;
  context: string;
  filePath: string;
  apiKey: string;
  model: string;
}

/**
 * Generate a JSDoc comment for the given code using OpenAI
 */
export async function generateComment(options: GenerateCommentOptions): Promise<string> {
  const openai = new OpenAI({
    apiKey: options.apiKey,
  });

  // Prepare the prompt
  const prompt = `Generate a comprehensive JSDoc comment for the following code. 
  Include a description, parameters with types, return value, and any thrown exceptions.
  Make the description meaningful and specific to what the code actually does.
  Do not include @example unless absolutely necessary.
  
  File: ${options.filePath}
  
  Context:
  ${options.context}
  
  Code to document:
  ${options.code}`;

  try {
    // Check token count to avoid exceeding limits
    const tokenCount = countTokens(prompt);
    const maxTokens = options.model.includes('gpt-4') ? 8192 : 4096;
    
    if (tokenCount > maxTokens * 0.75) {
      throw new Error(`Token count (${tokenCount}) is too high for the model. Please try with a smaller code snippet.`);
    }

    // Make the API call with exponential backoff for rate limits
    const response = await callWithRetry(() => openai.chat.completions.create({
      model: options.model,
      messages: [
        {
          role: 'system',
          content: 'You are a documentation expert specializing in writing clear, concise, and accurate JSDoc comments for JavaScript and TypeScript code.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Lower temperature for more consistent output
      max_tokens: 1000, // Limit response size
    }));

    // Extract and format the comment
    const comment = response.choices[0]?.message?.content?.trim() || '';
    
    // Ensure the comment is properly formatted as JSDoc
    if (!comment.startsWith('/**')) {
      return formatAsJSDoc(comment);
    }
    
    return comment;
  } catch (error: any) {
    const errorMessage = error.message || 'Unknown error';
    console.error(`OpenAI API error: ${errorMessage}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data)}`);
    }
    throw new Error(`Failed to generate comment: ${errorMessage}`);
  }
}

/**
 * Format a plain text comment as JSDoc
 */
function formatAsJSDoc(comment: string): string {
  // Remove any existing JSDoc-like formatting
  let cleanComment = comment.replace(/\/\*\*|\*\/|^\s*\*\s*/gm, '');
  
  // Split into lines and trim each line
  const lines = cleanComment.split('\n').map(line => line.trim());
  
  // Build the JSDoc comment
  let jsDoc = '/**\n';
  
  for (const line of lines) {
    if (line) {
      jsDoc += ` * ${line}\n`;
    } else {
      jsDoc += ` *\n`;
    }
  }
  
  jsDoc += ' */';
  return jsDoc;
}

/**
 * Call a function with exponential backoff for handling rate limits
 */
async function callWithRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
  try {
    return await fn();
  } catch (error: any) {
    // Check if it's a rate limit error
    if (error.status === 429 && retries > 0) {
      // Get retry delay from response headers or use exponential backoff
      const retryAfter = error.response?.headers?.['retry-after'] 
        ? parseInt(error.response.headers['retry-after']) * 1000 
        : delay;
      
      console.warn(`Rate limited. Retrying in ${retryAfter/1000} seconds...`);
      
      // Wait for the specified delay
      await new Promise(resolve => setTimeout(resolve, retryAfter));
      
      // Retry with exponential backoff
      return callWithRetry(fn, retries - 1, delay * 2);
    }
    
    throw error;
  }
}