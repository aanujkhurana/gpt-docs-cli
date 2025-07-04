// Test programmatic usage of gpt-docs
const { processFiles } = require('./dist/index');
const path = require('path');

console.log('=== TESTING PROGRAMMATIC USAGE OF GPT-DOCS ===');

async function testProgrammaticUsage() {
  try {
    // Test with dry run to avoid making actual API calls
    const options = {
      targetPath: path.join(__dirname, 'examples', 'example.js'),
      apiKey: 'fake-api-key',  // Using fake key for testing
      extensions: ['.js'],
      dryRun: true,           // Don't actually modify files
      model: 'gpt-4',
      overwrite: false
    };
    
    console.log(`Processing file: ${options.targetPath}`);
    
    // Capture console.log output to extract results
    const originalLog = console.log;
    let logOutput = [];
    
    console.log = function() {
      logOutput.push(Array.from(arguments).join(' '));
      originalLog.apply(console, arguments);
    };
    
    await processFiles(options);
    
    // Restore console.log
    console.log = originalLog;
    
    // Extract results from log output
    const filesProcessed = logOutput.find(line => line.includes('Total files processed:'))?.match(/\d+/)?.[0] || '0';
    const entitiesFound = logOutput.find(line => line.includes('Total code entities found:'))?.match(/\d+/)?.[0] || '0';
    const commentsGenerated = logOutput.find(line => line.includes('Comments generated:'))?.match(/\d+/)?.[0] || '0';
    
    console.log('\nProcessing results:');
    console.log(`- Total files processed: ${filesProcessed}`);
    console.log(`- Total entities found: ${entitiesFound}`);
    console.log(`- Comments generated: ${commentsGenerated}`);
    console.log(`- Dry run: ${options.dryRun}`);
    
    return parseInt(filesProcessed) > 0 && parseInt(entitiesFound) > 0;
  } catch (error) {
    console.error('Error in programmatic usage test:', error);
    return false;
  }
}

// Run the test
testProgrammaticUsage()
  .then(success => {
    if (success) {
      console.log('\n✅ PROGRAMMATIC USAGE TEST PASSED');
    } else {
      console.log('\n❌ PROGRAMMATIC USAGE TEST FAILED');
    }
  })
  .catch(error => {
    console.error('Test execution error:', error);
    console.log('\n❌ PROGRAMMATIC USAGE TEST FAILED');
  });