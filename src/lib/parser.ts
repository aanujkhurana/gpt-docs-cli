import fs from 'fs';
import path from 'path';

/**
 * Represents a code entity (function, class, method) in the source code
 */
export interface CodeEntity {
  /** Type of the entity (function, class, method, etc.) */
  type: string;
  /** Name of the entity */
  name: string;
  /** Full code of the entity */
  code: string;
  /** Start position in the source file */
  start: number;
  /** End position in the source file */
  end: number;
  /** Whether the entity already has a JSDoc comment */
  hasJSDoc: boolean;
  /** File path of the entity */
  filePath: string;
}

/**
 * Parse a file to find code entities (functions, classes, methods)
 */
export function parseFile(content: string, filePath: string): CodeEntity[] {
  const entities: CodeEntity[] = [];
  
  // Simple regex-based parsing for demonstration
  // In a production environment, you would use a proper AST parser like TypeScript Compiler API or Babel
  
  // Match function declarations, function expressions, arrow functions, class declarations, and methods
  const patterns = [
    // Function declarations: function name(...) {...}
    /(?<!\w)function\s+(\w+)\s*\([^)]*\)\s*{/g,
    
    // Class declarations: class Name {...}
    /(?<!\w)class\s+(\w+)(?:\s+extends\s+\w+)?\s*{/g,
    
    // Class methods: methodName(...) {...}
    /(?<!\w)(\w+)\s*\([^)]*\)\s*{/g,
    
    // Arrow functions with block body: const name = (...) => {...}
    /(?<!\w)const\s+(\w+)\s*=\s*\([^)]*\)\s*=>\s*{/g,
    
    // Arrow functions with expression body: const name = (...) => expression
    /(?<!\w)const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(content)) !== null) {
      const name = match[1];
      const matchStart = match.index;
      
      // Skip if this is part of a comment
      const contentBeforeMatch = content.substring(0, matchStart);
      if (isInComment(contentBeforeMatch)) {
        continue;
      }
      
      // Determine the type of the entity
      let type = 'function';
      if (match[0].includes('class')) {
        type = 'class';
      } else if (match[0].includes('=>')) {
        type = 'arrow function';
      } else if (
        !match[0].includes('function') && 
        contentBeforeMatch.split('\n').pop()?.trim().startsWith('class')
      ) {
        type = 'method';
      }
      
      // Find the end of the entity
      let braceCount = 1;
      let endPos = matchStart + match[0].length;
      
      // For arrow functions with expression body, find the end of the expression
      if (type === 'arrow function' && !match[0].includes('{')) {
        // Find the end of the expression (next semicolon or end of line)
        const restOfLine = content.substring(endPos);
        const semicolonPos = restOfLine.indexOf(';');
        const newlinePos = restOfLine.indexOf('\n');
        
        if (semicolonPos !== -1 && (newlinePos === -1 || semicolonPos < newlinePos)) {
          endPos += semicolonPos + 1;
        } else if (newlinePos !== -1) {
          endPos += newlinePos;
        } else {
          endPos += restOfLine.length;
        }
      } else {
        // For block bodies, find the matching closing brace
        for (let i = endPos; i < content.length; i++) {
          if (content[i] === '{') {
            braceCount++;
          } else if (content[i] === '}') {
            braceCount--;
            if (braceCount === 0) {
              endPos = i + 1;
              break;
            }
          }
        }
      }
      
      // Extract the full code
      const code = content.substring(matchStart, endPos).trim();
      
      // Check if the entity already has a JSDoc comment
      const hasJSDoc = hasJSDocComment(contentBeforeMatch);
      
      entities.push({
        type,
        name,
        code,
        start: matchStart,
        end: endPos,
        hasJSDoc,
        filePath
      });
    }
  }
  
  return entities;
}

/**
 * Check if a position is inside a comment
 */
function isInComment(text: string): boolean {
  // Check for single-line comments
  const lastLineBreak = text.lastIndexOf('\n');
  const lastLine = text.substring(lastLineBreak + 1);
  if (lastLine.includes('//')) {
    return true;
  }
  
  // Check for multi-line comments
  const lastCommentStart = text.lastIndexOf('/*');
  if (lastCommentStart !== -1) {
    const lastCommentEnd = text.lastIndexOf('*/');
    return lastCommentEnd < lastCommentStart;
  }
  
  return false;
}

/**
 * Check if there's a JSDoc comment before the current position
 */
function hasJSDocComment(text: string): boolean {
  // Get the last few lines
  const lines = text.split('\n');
  const lastLines = lines.slice(-5).join('\n');
  
  // Check for JSDoc pattern
  return /\/\*\*[\s\S]*?\*\//.test(lastLines);
}