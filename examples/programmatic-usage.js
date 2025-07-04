// Example of using gpt-docs programmatically

const { processFiles } = require('gpt-docs');

async function main() {
  try {
    // Process files in a specific directory
    await processFiles({
      targetPath: './src',
      apiKey: process.env.OPENAI_API_KEY,
      extensions: ['.js', '.ts'],
      dryRun: false,
      model: 'gpt-4',
      overwrite: false
    });
    
    console.log('Documentation generation complete!');
  } catch (error) {
    console.error('Error generating documentation:', error);
  }
}

main();