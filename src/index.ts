#!/usr/bin/env node

import { Command } from 'commander';
import { processFiles } from './processor.js';
import { loadApiKey } from './utils/apiKey.js';
// Import version from package.json
// Using dynamic import for ESM compatibility
let version = '1.0.0';
try {
  const { readFile } = await import('fs/promises');
  const { fileURLToPath } = await import('url');
  const { dirname, resolve } = await import('path');
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const packageJson = JSON.parse(
    await readFile(resolve(__dirname, '../package.json'), 'utf-8')
  );
  version = packageJson.version;
} catch (err) {
  console.warn('Could not read package.json version, using default');
}
import chalk from 'chalk';

// Define the CLI program
const program = new Command();

program
  .name('gpt-docs')
  .description('Automatically generate JSDoc-style comments for your JavaScript/TypeScript codebase using OpenAI')
  .version(version)
  .argument('[path]', 'Path to the directory or file to process', '.')
  .option('--key <key>', 'OpenAI API key')
  .option('--ext <extensions>', 'File extension filter (comma separated)', '.ts,.js')
  .option('--dry-run', 'Preview changes without writing', false)
  .option('--model <model>', 'OpenAI model to use', 'gpt-4')
  .option('--overwrite', 'Overwrite existing comments', false)
  .option('--output <output>', 'Save output to a new file instead')
  .action(async (path, options) => {
    try {
      // Load API key from options, environment, or keychain
      const apiKey = await loadApiKey(options.key);
      if (!apiKey) {
        console.error(chalk.red('Error: OpenAI API key is required.'));
        console.error(chalk.yellow('You can provide it using --key option, .env file, or it will be stored in your system keychain after first use.'));
        process.exit(1);
      }

      // Process the files
      await processFiles({
        path,
        apiKey,
        extensions: options.ext.split(','),
        dryRun: options.dryRun,
        model: options.model,
        overwrite: options.overwrite,
        output: options.output
      });

    } catch (error: any) {
      console.error(chalk.red(`Error: ${error.message || 'Unknown error'}`));
      process.exit(1);
    }
  });

program.parse();