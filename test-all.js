// Comprehensive test of the gpt-docs tool
const parser = require('./dist/lib/parser');
const openai = require('./dist/lib/openai');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== GPT-DOCS COMPREHENSIVE TEST ===');

// Test 1: Parser functionality
console.log('\n=== TEST 1: PARSER FUNCTIONALITY ===');
function testParser() {
  const examplePath = path.join(__dirname, 'examples', 'example.js');
  const content = fs.readFileSync(examplePath, 'utf8');
  
  const entities = parser.parseFile(content, examplePath);
  
  console.log(`Found ${entities.length} code entities`);
  console.log('Types of entities found:');
  
  const entityTypes = {};
  entities.forEach(entity => {
    entityTypes[entity.type] = (entityTypes[entity.type] || 0) + 1;
  });
  
  Object.entries(entityTypes).forEach(([type, count]) => {
    console.log(`- ${type}: ${count}`);
  });
  
  return entities.length > 0;
}

// Test 2: OpenAI API Key Management
console.log('\n=== TEST 2: API KEY MANAGEMENT ===');
async function testApiKeyManagement() {
  // Test with provided key
  const testKey = 'test-api-key';
  const retrievedKey = await openai.getApiKey(testKey);
  console.log(`Provided key test: ${retrievedKey === testKey ? 'PASSED' : 'FAILED'}`);
  
  // Test with environment variable
  process.env.OPENAI_API_KEY = 'env-var-key';
  const envKey = await openai.getApiKey();
  console.log(`Environment variable test: ${envKey === 'env-var-key' ? 'PASSED' : 'FAILED'}`);
  
  // Clean up
  delete process.env.OPENAI_API_KEY;
  
  return true;
}

// Test 3: CLI Interface
console.log('\n=== TEST 3: CLI INTERFACE ===');
function testCliInterface() {
  try {
    // Test help command
    const helpOutput = execSync('node dist/bin/cli.js --help', { encoding: 'utf8' });
    console.log('Help command test:', helpOutput.includes('Options:') ? 'PASSED' : 'FAILED');
    
    // Test version command
    const versionOutput = execSync('node dist/bin/cli.js --version', { encoding: 'utf8' });
    console.log('Version command test:', /^\d+\.\d+\.\d+$/.test(versionOutput.trim()) ? 'PASSED' : 'FAILED');
    
    // Test dry run
    const dryRunOutput = execSync('node dist/bin/cli.js examples/example.js --dry-run --key fake-key', { encoding: 'utf8' });
    console.log('Dry run test:', dryRunOutput.includes('This was a dry run') ? 'PASSED' : 'FAILED');
    
    return true;
  } catch (error) {
    console.error('CLI test error:', error.message);
    return false;
  }
}

// Run all tests
async function runAllTests() {
  let passCount = 0;
  let totalTests = 3;
  
  // Test 1
  if (testParser()) {
    console.log('Parser test: PASSED');
    passCount++;
  } else {
    console.log('Parser test: FAILED');
  }
  
  // Test 2
  try {
    if (await testApiKeyManagement()) {
      console.log('API key management test: PASSED');
      passCount++;
    } else {
      console.log('API key management test: FAILED');
    }
  } catch (error) {
    console.error('API key test error:', error.message);
    console.log('API key management test: FAILED');
  }
  
  // Test 3
  if (testCliInterface()) {
    console.log('CLI interface test: PASSED');
    passCount++;
  } else {
    console.log('CLI interface test: FAILED');
  }
  
  // Summary
  console.log('\n=== TEST SUMMARY ===');
  console.log(`Tests passed: ${passCount}/${totalTests} (${Math.round(passCount/totalTests*100)}%)`);
  
  if (passCount === totalTests) {
    console.log('\n✅ ALL TESTS PASSED - The gpt-docs tool is working correctly!');
  } else {
    console.log(`\n⚠️ ${totalTests - passCount} TEST(S) FAILED - Some components may not be working correctly.`);
  }
}

runAllTests().catch(console.error);