import { getApiKey, generateComment } from './openai';
import { CodeEntity } from './parser';

// Mock the OpenAI API
jest.mock('openai', () => {
  return {
    Configuration: jest.fn(),
    OpenAIApi: jest.fn().mockImplementation(() => {
      return {
        createChatCompletion: jest.fn().mockResolvedValue({
          data: {
            choices: [
              {
                message: {
                  content: '/**\n * Test function description\n * @param {number} a - First parameter\n * @param {number} b - Second parameter\n * @returns {number} Sum of a and b\n */'
                }
              }
            ],
            usage: {
              prompt_tokens: 100,
              completion_tokens: 50,
              total_tokens: 150
            }
          }
        })
      };
    })
  };
});

// Mock keytar
jest.mock('keytar', () => ({
  getPassword: jest.fn().mockResolvedValue('mock-api-key-from-keychain'),
  setPassword: jest.fn().mockResolvedValue(undefined)
}));

// Mock fs
jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  readFileSync: jest.fn().mockReturnValue('OPENAI_API_KEY=mock-api-key-from-env')
}));

describe('OpenAI Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'mock-api-key-from-env-var';
  });
  
  describe('getApiKey', () => {
    it('should return the provided key', async () => {
      const key = await getApiKey('provided-key');
      expect(key).toBe('provided-key');
    });
    
    it('should return the key from environment variable', async () => {
      const key = await getApiKey();
      expect(key).toBe('mock-api-key-from-env-var');
    });
    
    it('should return the key from keychain if env var is not set', async () => {
      delete process.env.OPENAI_API_KEY;
      const key = await getApiKey();
      expect(key).toBe('mock-api-key-from-keychain');
    });
  });
  
  describe('generateComment', () => {
    it('should generate a JSDoc comment for a code entity', async () => {
      const entity: CodeEntity = {
        type: 'function',
        name: 'add',
        code: 'function add(a, b) { return a + b; }',
        start: 0,
        end: 33,
        hasJSDoc: false,
        filePath: 'test.js'
      };
      
      const comment = await generateComment(entity, 'test-api-key');
      
      expect(comment).toContain('Test function description');
      expect(comment).toContain('@param {number} a');
      expect(comment).toContain('@returns {number}');
    });
  });
});