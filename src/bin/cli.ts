#!/usr/bin/env node

import { Command } from 'commander';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { processFiles } from '../index';
import { getApiKey } from '../lib/openai';
// Node.js globals are available in CommonJS

// Load environment variables from .env file
dotenv.config();

// Package information
const packageJson = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../../package.json'), 'utf8')
);

const program = new Command();

program
  .name('gpt-docs')
  .description('Generate JSDoc comments for your JavaScript/TypeScript code using OpenAI')
  .version(packageJson.version)
  .argument('[path]', 'Path to the directory or file to process', '.')
  .option('--key <key>', 'OpenAI API key')
  .option('--ext <extensions>', 'File extensions to process', '.ts,.js')
  .option('--dry-run', 'Preview changes without writing to files', false)
  .option('--model <model>', 'OpenAI model to use', process.env.OPENAI_MODEL || 'gpt-4')
  .option('--overwrite', 'Overwrite existing comments', false)
  .option('--output <output>', 'Save output to a new file instead of modifying the original')
  .action(async (targetPath: string, options: {
    key?: string;
    ext: string;
    dryRun: boolean;
    model: string;
    overwrite: boolean;
    output?: string;
  }) => {
    try {
      // Resolve the target path
      const resolvedPath = path.resolve(process.cwd(), targetPath);
      
      // Check if the path exists
      if (!fs.existsSync(resolvedPath)) {
        console.error(`Error: Path '${resolvedPath}' does not exist`);
        process.exit(1);
      }

      // Get API key from options, environment, or keychain
      const apiKey = await getApiKey(options.key);
      if (!apiKey) {
        console.error('Error: OpenAI API key is required');
        console.error('You can provide it using --key option, .env file, or store it in your keychain');
        process.exit(1);
      }

      // Parse extensions
      const extensions = options.ext.split(',').map((ext: string) => 
        ext.startsWith('.') ? ext : `.${ext}`
      );

      // Process files
      await processFiles({
        targetPath: resolvedPath,
        apiKey,
        extensions,
        dryRun: options.dryRun,
        model: options.model,
        overwrite: options.overwrite,
        outputPath: options.output
      });

    } catch (error: any) {
      console.error('Error:', error.message || 'Unknown error');
      process.exit(1);
    }
  });

program.parse();