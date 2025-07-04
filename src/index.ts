import fs from 'fs';
import path from 'path';
import { glob } from 'glob';
import chalk from 'chalk';
import ora from 'ora';
import { parseFile, CodeEntity } from './lib/parser';
import { generateComment } from './lib/openai';

interface ProcessOptions {
  targetPath: string;
  apiKey: string;
  extensions: string[];
  dryRun: boolean;
  model: string;
  overwrite: boolean;
  outputPath?: string;
}

/**
 * Process all files matching the given extensions in the target path
 */
export async function processFiles(options: ProcessOptions): Promise<void> {
  const {
    targetPath,
    apiKey,
    extensions,
    dryRun,
    model,
    overwrite,
    outputPath
  } = options;

  const spinner = ora('Scanning files...').start();
  
  try {
    // Check if target is a directory or a file
    const stats = fs.statSync(targetPath);
    
    let filePaths: string[] = [];
    
    if (stats.isDirectory()) {
      // Get all files with the specified extensions
      const pattern = `**/*+(${extensions.join('|')})`;
      filePaths = await glob(pattern, { 
        cwd: targetPath,
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });
    } else if (stats.isFile()) {
      // Check if the file has one of the specified extensions
      const ext = path.extname(targetPath);
      if (extensions.includes(ext)) {
        filePaths = [targetPath];
      } else {
        spinner.fail(`File ${targetPath} does not have one of the specified extensions: ${extensions.join(', ')}`);
        return;
      }
    }

    spinner.succeed(`Found ${filePaths.length} files to process`);

    if (filePaths.length === 0) {
      console.log(chalk.yellow('No files found to process.'));
      return;
    }

    // Process each file
    let totalEntities = 0;
    let processedEntities = 0;

    for (const filePath of filePaths) {
      const relativeFilePath = path.relative(process.cwd(), filePath);
      const fileSpinner = ora(`Processing ${chalk.cyan(relativeFilePath)}`).start();
      
      try {
        // Read the file content
        const content = fs.readFileSync(filePath, 'utf8');
        
        // Parse the file to find functions, classes, etc.
        const entities = parseFile(content, filePath);
        
        if (entities.length === 0) {
          fileSpinner.info(`No code entities found in ${chalk.cyan(relativeFilePath)}`);
          continue;
        }

        totalEntities += entities.length;
        
        // Generate comments for each entity
        let updatedContent = content;
        let hasChanges = false;
        
        for (const entity of entities) {
          // Skip if already has a JSDoc comment and overwrite is false
          if (entity.hasJSDoc && !overwrite) {
            continue;
          }
          
          const entitySpinner = ora(`Generating comment for ${chalk.cyan(entity.name)}`).start();
          
          try {
            // Generate comment using OpenAI
            const comment = await generateComment(entity, apiKey, model);
            
            // Insert the comment into the content
            if (comment) {
              updatedContent = insertComment(updatedContent, entity, comment);
              hasChanges = true;
              processedEntities++;
              entitySpinner.succeed(`Generated comment for ${chalk.cyan(entity.name)}`);
            } else {
              entitySpinner.fail(`Failed to generate comment for ${chalk.cyan(entity.name)}`);
            }
          } catch (error: any) {
            entitySpinner.fail(`Error generating comment for ${chalk.cyan(entity.name)}: ${error.message || 'Unknown error'}`);
          }
        }
        
        // Write the updated content back to the file or to a new file
        if (hasChanges) {
          if (!dryRun) {
            const targetFilePath = outputPath 
              ? path.join(outputPath, path.relative(targetPath, filePath))
              : filePath;
            
            if (outputPath) {
              // Ensure the directory exists
              const targetDir = path.dirname(targetFilePath);
              if (!fs.existsSync(targetDir)) {
                fs.mkdirSync(targetDir, { recursive: true });
              }
            }
            
            fs.writeFileSync(targetFilePath, updatedContent, 'utf8');
            fileSpinner.succeed(`Updated ${chalk.cyan(relativeFilePath)}`);
          } else {
            fileSpinner.succeed(`Would update ${chalk.cyan(relativeFilePath)} (dry run)`);
          }
        } else {
          fileSpinner.info(`No changes needed for ${chalk.cyan(relativeFilePath)}`);
        }
      } catch (error: any) {
        fileSpinner.fail(`Error processing ${chalk.cyan(relativeFilePath)}: ${error.message || 'Unknown error'}`);
      }
    }

    // Summary
    console.log('\n' + chalk.bold('Summary:'));
    console.log(`Total files processed: ${chalk.cyan(filePaths.length)}`);
    console.log(`Total code entities found: ${chalk.cyan(totalEntities)}`);
    console.log(`Comments generated: ${chalk.cyan(processedEntities)}`);
    
    if (dryRun) {
      console.log(chalk.yellow('\nThis was a dry run. No files were modified.'));
    }
  } catch (error: any) {
    spinner.fail(`Error: ${error.message || 'Unknown error'}`);
    throw error;
  }
}

/**
 * Insert a JSDoc comment above a code entity
 */
function insertComment(content: string, entity: CodeEntity, comment: string): string {
  // Ensure the comment has the correct format
  const formattedComment = formatJSDocComment(comment);
  
  // Insert the comment at the correct position
  const contentBefore = content.substring(0, entity.start);
  const contentAfter = content.substring(entity.start);
  
  // Handle indentation
  const lines = content.substring(0, entity.start).split('\n');
  const lastLine = lines[lines.length - 1];
  const indentation = lastLine.match(/^\s*/)![0];
  
  // Add indentation to each line of the comment
  const indentedComment = formattedComment
    .split('\n')
    .map(line => indentation + line)
    .join('\n');
  
  return contentBefore + indentedComment + '\n' + contentAfter;
}

/**
 * Format a comment as a JSDoc comment
 */
function formatJSDocComment(comment: string): string {
  // Remove any existing JSDoc formatting
  let cleanComment = comment.trim();
  cleanComment = cleanComment.replace(/^\/\*\*|\*\/$/g, '');
  cleanComment = cleanComment.replace(/^\s*\*\s?/gm, '');
  
  // Split into lines and trim each line
  const lines = cleanComment.split('\n').map(line => line.trim());
  
  // Format as JSDoc
  const jsDocLines = ['/**'];
  for (const line of lines) {
    jsDocLines.push(` * ${line}`);
  }
  jsDocLines.push(' */');
  
  return jsDocLines.join('\n');
}