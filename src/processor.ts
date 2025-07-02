import fs from 'fs/promises';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import pLimit from 'p-limit';
import { fileURLToPath } from 'url';
import { generateComment } from './openai.js';
import { parseFile, insertComment } from './parser.js';
import { countTokens } from './utils/tokenCounter.js';

// Define the interface for the options
interface ProcessOptions {
  path: string;
  apiKey: string;
  extensions: string[];
  dryRun: boolean;
  model: string;
  overwrite: boolean;
  output?: string;
}

/**
 * Process all files in the given path
 */
export async function processFiles(options: ProcessOptions): Promise<void> {
  const spinner = ora('Scanning files...').start();
  
  try {
    const stats = await fs.stat(options.path);
    
    if (stats.isFile()) {
      // Process a single file
      spinner.text = `Processing file: ${options.path}`;
      await processFile(options.path, options);
      spinner.succeed(`Processed file: ${options.path}`);
    } else if (stats.isDirectory()) {
      // Process a directory recursively
      const files = await findFiles(options.path, options.extensions);
      
      if (files.length === 0) {
        spinner.warn(`No matching files found in ${options.path}`);
        return;
      }
      
      spinner.text = `Found ${files.length} files to process`;
      
      // Use p-limit to control concurrency
      const limit = pLimit(5); // Process 5 files concurrently
      const tasks = files.map(file => {
        return limit(() => processFile(file, options));
      });
      
      let completed = 0;
      const results = await Promise.allSettled(tasks.map(task => {
        return task.then(() => {
          completed++;
          spinner.text = `Processing files: ${completed}/${files.length}`;
        }).catch(error => {
          completed++;
          spinner.text = `Processing files: ${completed}/${files.length}`;
          throw error;
        });
      }));
      
      const succeeded = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;
      
      if (failed > 0) {
        spinner.warn(`Processed ${succeeded} files, ${failed} files failed`);
      } else {
        spinner.succeed(`Successfully processed ${succeeded} files`);
      }
    } else {
      spinner.fail(`Invalid path: ${options.path}`);
    }
  } catch (error: any) {
    spinner.fail(`Error processing files: ${error.message || 'Unknown error'}`);
    throw error;
  }
}

/**
 * Process a single file
 */
async function processFile(filePath: string, options: ProcessOptions): Promise<void> {
  try {
    // Read the file content
    const content = await fs.readFile(filePath, 'utf-8');
    
    // Parse the file to find functions, classes, etc.
    const parseResult = await parseFile(content, filePath);
    
    if (parseResult.items.length === 0) {
      console.log(chalk.yellow(`No documentable items found in ${filePath}`));
      return;
    }
    
    let modifiedContent = content;
    let totalTokensUsed = 0;
    
    // Process each item
    for (const item of parseResult.items) {
      // Skip if already has a comment and overwrite is false
      if (item.hasComment && !options.overwrite) {
        continue;
      }
      
      // Generate a comment using OpenAI
      const comment = await generateComment({
        code: item.code,
        context: parseResult.context,
        filePath,
        apiKey: options.apiKey,
        model: options.model
      });
      
      // Count tokens for tracking
      const tokensUsed = countTokens(item.code + parseResult.context);
      totalTokensUsed += tokensUsed;
      
      // Insert the comment into the content
      modifiedContent = insertComment(modifiedContent, item, comment);
    }
    
    // If content was modified
    if (modifiedContent !== content) {
      if (options.dryRun) {
        console.log(chalk.blue(`[DRY RUN] Would update: ${filePath}`));
        console.log(chalk.gray(`Tokens used: ${totalTokensUsed}`));
      } else if (options.output) {
        // Save to output file
        const outputPath = typeof options.output === 'boolean' && options.output === true ? 
          `${filePath}.documented` : 
          path.resolve(options.output as string, path.basename(filePath));
          
        await fs.writeFile(outputPath, modifiedContent, 'utf-8');
        console.log(chalk.green(`Created documented version: ${outputPath}`));
        console.log(chalk.gray(`Tokens used: ${totalTokensUsed}`));
      } else {
        // Update the original file
        await fs.writeFile(filePath, modifiedContent, 'utf-8');
        console.log(chalk.green(`Updated: ${filePath}`));
        console.log(chalk.gray(`Tokens used: ${totalTokensUsed}`));
      }
    } else {
      console.log(chalk.yellow(`No changes made to: ${filePath}`));
    }
  } catch (error: any) {
    console.error(chalk.red(`Error processing ${filePath}: ${error.message || 'Unknown error'}`));
    throw error;
  }
}

/**
 * Find all files with the given extensions recursively
 */
async function findFiles(dir: string, extensions: string[]): Promise<string[]> {
  const files: string[] = [];
  
  async function scan(directory: string) {
    const entries = await fs.readdir(directory, { withFileTypes: true });
    
    for (const entry of entries) {
      const fullPath = path.join(directory, entry.name);
      
      if (entry.isDirectory()) {
        // Skip node_modules and hidden directories
        if (entry.name !== 'node_modules' && !entry.name.startsWith('.')) {
          await scan(fullPath);
        }
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (extensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }
  }
  
  await scan(dir);
  return files;
}