import { Configuration, OpenAIApi } from 'openai';
import keytar from 'keytar';
import fs from 'fs';
import path from 'path';
import { CodeEntity } from './parser';
// Node.js globals are available in CommonJS

// Service name for keytar
const SERVICE_NAME = 'gpt-docs';
const ACCOUNT_NAME = 'openai-api-key';

// Rate limiting
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms
const DEFAULT_RATE_LIMIT = 20; // requests per minute

// Token tracking
let tokenUsage = {
  prompt: 0,
  completion: 0,
  total: 0
};

/**
 * Get the OpenAI API key from various sources
 */
export async function getApiKey(providedKey?: string): Promise<string | null> {
  // 1. Use the provided key if available
  if (providedKey) {
    return providedKey;
  }
  
  // 2. Check environment variables
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  
  // 3. Check keychain
  try {
    const keychainKey = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (keychainKey) {
      return keychainKey;
    }
  } catch (error) {
    // Keychain access might not be available, continue to next method
  }
  
  // 4. Check for .env file in the current directory
  const envPath = path.join(process.cwd(), '.env');
  if (fs.existsSync(envPath)) {
    try {
      const envContent = fs.readFileSync(envPath, 'utf8');
      const match = envContent.match(/OPENAI_API_KEY=([^\s]+)/);
      if (match && match[1]) {
        return match[1];
      }
    } catch (error) {
      // Error reading .env file, continue to next method
    }
  }
  
  return null;
}

/**
 * Save the API key to keychain
 */
export async function saveApiKey(apiKey: string): Promise<boolean> {
  try {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Generate a JSDoc comment for a code entity using OpenAI
 */
export async function generateComment(
  entity: CodeEntity,
  apiKey: string,
  model: string = 'gpt-4'
): Promise<string> {
  const configuration = new Configuration({ apiKey });
  const openai = new OpenAIApi(configuration);
  
  // Load the prompt template
  const promptTemplate = getPromptTemplate();
  
  // Create the prompt
  const prompt = promptTemplate
    .replace('{{CODE}}', entity.code)
    .replace('{{TYPE}}', entity.type)
    .replace('{{NAME}}', entity.name);
  
  // Call OpenAI API with rate limiting and retries
  let retries = 0;
  while (retries <= MAX_RETRIES) {
    try {
      const response = await openai.createChatCompletion({
        model,
        messages: [
          {
            role: 'system',
            content: 'You are a documentation expert that writes clear, concise, and helpful JSDoc comments.'
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.5,
        max_tokens: 500
      });
      
      // Track token usage
      if (response.data.usage) {
        tokenUsage.prompt += response.data.usage.prompt_tokens || 0;
        tokenUsage.completion += response.data.usage.completion_tokens || 0;
        tokenUsage.total += response.data.usage.total_tokens || 0;
      }
      
      return response.data.choices[0]?.message?.content || '';
    } catch (error: any) {
      if (error.response?.status === 429) {
        // Rate limit exceeded, wait and retry
        retries++;
        if (retries <= MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * retries));
          continue;
        }
      }
      throw error;
    }
  }
  
  throw new Error('Failed to generate comment after multiple retries');
}

/**
 * Get the prompt template for generating JSDoc comments
 */
function getPromptTemplate(): string {
  const templatePath = path.join(__dirname, '../../templates/jsdocPrompt.txt');
  
  if (fs.existsSync(templatePath)) {
    return fs.readFileSync(templatePath, 'utf8');
  }
  
  // Fallback template if file doesn't exist
  return `
Please write a comprehensive JSDoc comment for the following {{TYPE}} named {{NAME}}.

Code:
\`\`\`
{{CODE}}
\`\`\`

Provide a clear description of what the {{TYPE}} does, including:
- Purpose and functionality
- Parameters with types and descriptions
- Return value with type and description
- Any thrown exceptions
- Example usage if helpful

Format your response as a valid JSDoc comment only, without any additional text.
`;
}

/**
 * Get the current token usage statistics
 */
export function getTokenUsage(): typeof tokenUsage {
  return { ...tokenUsage };
}

/**
 * Reset the token usage statistics
 */
export function resetTokenUsage(): void {
  tokenUsage = { prompt: 0, completion: 0, total: 0 };
}