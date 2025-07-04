# gpt-docs

A CLI tool that uses OpenAI to automatically generate meaningful JSDoc-style comments for your JavaScript/TypeScript codebase.

## Installation

```bash
npm install -g gpt-docs
# or
yarn global add gpt-docs
```

## Usage

Just run it on your project folder and watch it add helpful documentation above your functions, classes, and methods.

```bash
gpt-docs [path]
```

### Options

```
--key        OpenAI API key
--ext        File extension filter (default: .ts,.js)
--dry-run    Preview changes without writing
--model      OpenAI model to use (default: gpt-4)
--overwrite  Overwrite existing comments (default: false)
--output     Save output to a new file instead
```

## How It Works

1. Recursively scans the folder for .ts, .js files
2. Parses each file, identifies functions/classes
3. Sends context to OpenAI (using gpt-4 or gpt-3.5-turbo)
4. Receives JSDoc comment
5. Inserts comment above the function

## OpenAI Key

You can provide your OpenAI API key in several ways:
- Pass it directly using the `--key` option
- Store it in a `.env` file in your project
- Store it in your system's keychain

The tool includes rate-limit handling and token counting to help you stay under budget.

## License

MIT
