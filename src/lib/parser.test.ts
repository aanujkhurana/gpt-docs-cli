import { parseFile, CodeEntity } from './parser';

describe('Parser', () => {
  describe('parseFile', () => {
    it('should parse function declarations', () => {
      const content = `
        function add(a, b) {
          return a + b;
        }
      `;
      
      const entities = parseFile(content, 'test.js');
      
      expect(entities.length).toBe(1);
      expect(entities[0].type).toBe('function');
      expect(entities[0].name).toBe('add');
      expect(entities[0].hasJSDoc).toBe(false);
    });
    
    it('should parse class declarations', () => {
      const content = `
        class Person {
          constructor(name) {
            this.name = name;
          }
          
          greet() {
            return 'Hello, ' + this.name;
          }
        }
      `;
      
      const entities = parseFile(content, 'test.js');
      
      expect(entities.length).toBe(3); // class + constructor + method
      expect(entities[0].type).toBe('class');
      expect(entities[0].name).toBe('Person');
      expect(entities[1].name).toBe('constructor');
      expect(entities[2].name).toBe('greet');
    });
    
    it('should parse arrow functions', () => {
      const content = `
        const multiply = (a, b) => {
          return a * b;
        };
        
        const square = (x) => x * x;
      `;
      
      const entities = parseFile(content, 'test.js');
      
      expect(entities.length).toBe(2);
      expect(entities[0].type).toBe('arrow function');
      expect(entities[0].name).toBe('multiply');
      expect(entities[1].name).toBe('square');
    });
    
    it('should detect existing JSDoc comments', () => {
      const content = `
        /**
         * Adds two numbers
         * @param {number} a First number
         * @param {number} b Second number
         * @returns {number} Sum of a and b
         */
        function add(a, b) {
          return a + b;
        }
        
        function subtract(a, b) {
          return a - b;
        }
      `;
      
      const entities = parseFile(content, 'test.js');
      
      expect(entities.length).toBe(2);
      expect(entities[0].hasJSDoc).toBe(true);
      expect(entities[1].hasJSDoc).toBe(false);
    });
  });
});