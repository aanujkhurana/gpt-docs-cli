#!/usr/bin/env node

/**
 * Simple test script to verify the gpt-docs CLI tool
 * Run with: node test.js
 */

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Check if the API key is available
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  console.error('Error: OPENAI_API_KEY environment variable is not set.');
  console.error('Please set it before running the test:');
  console.error('export OPENAI_API_KEY=your_api_key_here');
  process.exit(1);
}

// Path to the examples directory
const examplesDir = path.join(__dirname, 'examples');

// Run the CLI tool on the examples directory with dry-run mode
const cli = spawn('node', [
  path.join(__dirname, 'dist', 'index.js'),
  examplesDir,
  '--dry-run',
  '--model', 'gpt-3.5-turbo' // Use a cheaper model for testing
]);

// Collect output
let output = '';
cli.stdout.on('data', (data) => {
  const chunk = data.toString();
  output += chunk;
  process.stdout.write(chunk);
});

cli.stderr.on('data', (data) => {
  process.stderr.write(data.toString());
});

// Check the result
cli.on('close', (code) => {
  if (code === 0) {
    console.log('\n✅ Test completed successfully!');
    
    // Check if the output contains expected messages
    if (output.includes('Would update:') && 
        (output.includes('sample.js') || output.includes('sample.ts'))) {
      console.log('✅ CLI tool correctly identified files to update.');
    } else {
      console.log('❌ CLI tool did not correctly identify files to update.');
    }
  } else {
    console.error(`\n❌ Test failed with exit code ${code}`);
  }
});