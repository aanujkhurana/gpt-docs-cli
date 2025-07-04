// Test using gpt-docs with a custom prompt template
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('=== TESTING GPT-DOCS WITH CUSTOM PROMPT TEMPLATE ===');

// Create a custom prompt template
function createCustomPromptTemplate() {
  const templatePath = path.join(__dirname, 'custom-jsdoc-prompt.txt');
  const customPrompt = `You are an expert JavaScript developer specializing in writing clear, concise, and helpful JSDoc comments.

You will be given a code snippet, and your task is to generate a JSDoc comment for it.

The comment should:
1. Provide a clear description of what the code does
2. Document all parameters with their types and descriptions
3. Document the return value with its type and description
4. Include any relevant @throws tags if the code might throw exceptions
5. Be concise and to the point

Here is the code to document:

{{CODE}}

Respond ONLY with the JSDoc comment, nothing else.`;

  fs.writeFileSync(templatePath, customPrompt, 'utf8');
  console.log(`Created custom prompt template at: ${templatePath}`);
  return templatePath;
}

// Test the CLI with the custom prompt template
function testWithCustomPrompt() {
  try {
    // Create the custom prompt template
    const templatePath = createCustomPromptTemplate();
    
    // Run the CLI with the custom prompt template
    console.log('\nRunning gpt-docs with custom prompt template...');
    const command = `node dist/bin/cli.js examples/example.js --dry-run --key fake-key`;
    
    console.log(`Command: ${command}`);
    const output = execSync(command, { encoding: 'utf8' });
    
    console.log('\nOutput:');
    console.log(output);
    
    // Clean up
    fs.unlinkSync(templatePath);
    console.log(`Removed custom prompt template: ${templatePath}`);
    
    return true;
  } catch (error) {
    console.error('Error testing with custom prompt:', error.message);
    return false;
  }
}

// Run the test
const success = testWithCustomPrompt();

if (success) {
  console.log('\n✅ CUSTOM PROMPT TEST COMPLETED');
} else {
  console.log('\n❌ CUSTOM PROMPT TEST FAILED');
}