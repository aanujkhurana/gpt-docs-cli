#!/usr/bin/env node

import { Command } from 'commander';
import { processFiles } from './processor.js';
import { loadApiKey } from './utils/apiKey.js';
import { version } from '../package.json' assert { type: 'json' };
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

    } catch (error) {
      console.error(chalk.red(`Error: ${error.message}`));
      process.exit(1);
    }
  });

program.parse();