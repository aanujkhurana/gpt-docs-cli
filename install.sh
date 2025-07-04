#!/bin/bash

# Install script for gpt-docs-cli

echo "Installing gpt-docs-cli..."

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed. Please install Node.js and npm first."
    exit 1
fi

# Install dependencies
npm install

# Build the project
npm run build

# Make the CLI executable
chmod +x dist/index.js

# Check if .env file exists, if not create it from example
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "Creating .env file from .env.example"
        cp .env.example .env
        echo "Please edit .env file and add your OpenAI API key"
    else
        echo "Creating .env file"
        echo "OPENAI_API_KEY=your_openai_api_key_here" > .env
        echo "Please edit .env file and add your OpenAI API key"
    fi
fi

# Create a symlink to make the CLI available globally
echo "Creating symlink for global access..."
npm link

echo ""
echo "Installation complete!"
echo "You can now use gpt-docs command from anywhere."
echo ""
echo "Before using, make sure to set your OpenAI API key using one of these methods:"
echo "1. Edit the .env file in this directory"
echo "2. Set the OPENAI_API_KEY environment variable"
echo "3. Use the --key option when running the command"
echo ""
echo "Example usage:"
echo "gpt-docs path/to/your/project --dry-run"
echo ""