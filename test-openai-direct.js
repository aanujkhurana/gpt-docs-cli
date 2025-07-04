// Direct test of the OpenAI module
const openai = require('./dist/lib/openai');
const parser = require('./dist/lib/parser');

// Test getApiKey function
async function testGetApiKey() {
  console.log('Testing getApiKey function:');
  try {
    // Test with provided key
    const providedKey = await openai.getApiKey('test-key');
    console.log('- With provided key:', providedKey === 'test-key' ? 'SUCCESS' : 'FAILED');
    
    // Test with env var
    process.env.OPENAI_API_KEY = 'env-var-key';
    const envKey = await openai.getApiKey();
    console.log('- With env var:', envKey === 'env-var-key' ? 'SUCCESS' : 'FAILED');
    
    // Test without env var (will try keychain)
    delete process.env.OPENAI_API_KEY;
    try {
      const keychainKey = await openai.getApiKey();
      console.log('- With keychain:', keychainKey ? 'SUCCESS' : 'FAILED');
    } catch (error) {
      console.log('- With keychain: FAILED (expected if not set up)');
    }
  } catch (error) {
    console.error('Error testing getApiKey:', error);
  }
}

// Test generateComment function with a mock (don't actually call OpenAI API)
async function testGenerateComment() {
  console.log('\nTesting generateComment function:');
  
  // Create a sample code entity
  const entity = {
    type: 'function',
    name: 'add',
    code: 'function add(a, b) { return a + b; }',
    start: 0,
    end: 33,
    hasJSDoc: false,
    filePath: 'test.js'
  };
  
  try {
    // This will fail without a valid API key, which is expected
    console.log('- Attempting to generate comment (will fail without valid API key)');
    await openai.generateComment(entity, 'fake-api-key');
    console.log('  Result: UNEXPECTED SUCCESS');
  } catch (error) {
    console.log('  Result: EXPECTED FAILURE (', error.message, ')');
  }
}

// Run tests
async function runTests() {
  await testGetApiKey();
  await testGenerateComment();
}

runTests().catch(console.error);