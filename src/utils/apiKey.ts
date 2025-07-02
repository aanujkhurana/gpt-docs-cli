import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import keytar from 'keytar';

// Service name for keytar
const SERVICE_NAME = 'gpt-docs-cli';
const ACCOUNT_NAME = 'openai-api-key';

/**
 * Load the OpenAI API key from various sources
 * Priority: 1. Provided key, 2. Environment variable, 3. .env file, 4. Keychain
 */
export async function loadApiKey(providedKey?: string): Promise<string | null> {
  // 1. Use the provided key if available
  if (providedKey) {
    // Store the key in keychain for future use
    await storeApiKey(providedKey);
    return providedKey;
  }

  // 2. Check environment variable
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }

  // 3. Load from .env file
  try {
    // Try to load from current directory first
    const envPath = path.resolve(process.cwd(), '.env');
    try {
      await fs.access(envPath);
      dotenv.config({ path: envPath });
    } catch (e) {
      // .env not found in current directory, try package directory
      const packageEnvPath = path.resolve(
        path.dirname(fileURLToPath(import.meta.url)),
        '../../.env'
      );
      dotenv.config({ path: packageEnvPath });
    }

    if (process.env.OPENAI_API_KEY) {
      return process.env.OPENAI_API_KEY;
    }
  } catch (error) {
    // Ignore error, continue to next method
  }

  // 4. Try to load from keychain
  try {
    const key = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME);
    if (key) {
      return key;
    }
  } catch (error) {
    // Ignore error, keytar might not be available
  }

  return null;
}

/**
 * Store the API key in the system keychain
 */
export async function storeApiKey(apiKey: string): Promise<void> {
  try {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, apiKey);
  } catch (error: any) {
    console.warn(`Warning: Could not store API key in keychain: ${error.message || 'Unknown error'}`);
  }
}