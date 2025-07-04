// Direct test of the CLI module
const path = require('path');
const { execSync } = require('child_process');

function runCommand(command) {
  console.log(`\nRunning command: ${command}`);
  try {
    const output = execSync(command, { encoding: 'utf8', stdio: 'pipe' });
    console.log('Output:', output);
    return { success: true, output };
  } catch (error) {
    console.log('Error:', error.message);
    return { success: false, error: error.message };
  }
}

// Test the CLI help command
runCommand('node dist/bin/cli.js --help');

// Test the CLI version command
runCommand('node dist/bin/cli.js --version');

// Test the CLI with a dry run on the example file
runCommand('node dist/bin/cli.js examples/example.js --dry-run --key fake-key');

// Test the CLI with invalid arguments
runCommand('node dist/bin/cli.js --invalid-option');