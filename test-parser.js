const { parseFile } = require('./dist/lib/parser');
const fs = require('fs');
const path = require('path');

// Read the example file
const examplePath = path.join(__dirname, 'examples', 'example.js');
const content = fs.readFileSync(examplePath, 'utf8');

// Parse the file
const entities = parseFile(content, examplePath);

// Display the results
console.log(`Found ${entities.length} code entities:`);
entities.forEach((entity, index) => {
  console.log(`\n${index + 1}. ${entity.type}: ${entity.name}`);
  console.log(`   Has JSDoc: ${entity.hasJSDoc}`);
  console.log(`   Start: ${entity.start}, End: ${entity.end}`);
  console.log(`   Code snippet: ${entity.code.substring(0, 50)}...`);
});