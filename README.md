# gpt-docs-cli

A CLI tool that uses OpenAI to automatically generate meaningful JSDoc-style comments for your JavaScript/TypeScript codebase.

## Features

- Recursively scans folders for JavaScript and TypeScript files
- Identifies functions, classes, methods, and other documentable code elements
- Uses OpenAI (GPT-4 or GPT-3.5-Turbo) to generate meaningful documentation
- Inserts JSDoc comments above each code element
- Supports various configuration options
- Handles API key securely (environment variables, .env file, or system keychain)
- Includes rate-limiting and token counting to manage API usage

## Installation

```bash
npm install -g gpt-docs-cli
```

Or use it directly with npx:

```bash
npx gpt-docs-cli
```

## Usage

```bash
gpt-docs [path] [options]
```

### Options

- `--key <key>`: OpenAI API key
- `--ext <extensions>`: File extension filter (default: .ts,.js)
- `--dry-run`: Preview changes without writing
- `--model <model>`: OpenAI model to use (default: gpt-4)
- `--overwrite`: Overwrite existing comments (default: false)
- `--output <output>`: Save output to a new file instead

### Examples

```bash
# Document all JS/TS files in the current directory
gpt-docs .

# Document a specific file
gpt-docs src/index.js

# Document only TypeScript files
gpt-docs src --ext .ts

# Use a specific OpenAI model
gpt-docs . --model gpt-3.5-turbo

# Preview changes without writing to files
gpt-docs . --dry-run

# Overwrite existing JSDoc comments
gpt-docs . --overwrite

# Save documented versions to new files
gpt-docs . --output docs/
```

## API Key

You can provide your OpenAI API key in several ways:

1. Use the `--key` option: `gpt-docs --key sk-...`
2. Set the `OPENAI_API_KEY` environment variable
3. Create a `.env` file with `OPENAI_API_KEY=sk-...`
4. The first time you use the tool with `--key`, it will store the key in your system's secure keychain for future use

## Development

```bash
# Clone the repository
git clone https://github.com/yourusername/gpt-docs-cli.git
cd gpt-docs-cli

# Install dependencies
npm install

# Build the project
npm run build

# Link for local development
npm link
```

## License

MIT