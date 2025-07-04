// Direct test of the parser module
const parser = require('./dist/lib/parser');

const testCode = `
function add(a, b) {
  return a + b;
}

class Person {
  constructor(name) {
    this.name = name;
  }
  
  greet() {
    return 'Hello, ' + this.name;
  }
}

const multiply = (a, b) => {
  return a * b;
};

const square = (x) => x * x;
`;

const entities = parser.parseFile(testCode, 'test.js');

console.log('Parsed entities:', entities.length);
entities.forEach((entity, index) => {
  console.log(`\n${index + 1}. ${entity.type}: ${entity.name}`);
  console.log(`   Has JSDoc: ${entity.hasJSDoc}`);
  console.log(`   Start: ${entity.start}, End: ${entity.end}`);
});