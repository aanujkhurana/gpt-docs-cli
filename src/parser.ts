import fs from 'fs/promises';
import path from 'path';

// Interface for a documentable item (function, class, method, etc.)
interface DocumentableItem {
  type: 'function' | 'class' | 'method' | 'arrow' | 'variable';
  name: string;
  code: string;
  startLine: number;
  endLine: number;
  hasComment: boolean;
  indentation: string;
}

// Interface for the result of parsing a file
interface ParseResult {
  items: DocumentableItem[];
  context: string;
}

/**
 * Parse a file to find documentable items
 */
export async function parseFile(content: string, filePath: string): Promise<ParseResult> {
  const lines = content.split('\n');
  const items: DocumentableItem[] = [];
  
  // Simple regex patterns to identify documentable items
  // Note: In a production tool, you might want to use a proper AST parser
  const patterns = {
    function: /^(\s*)(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\(/,
    class: /^(\s*)(?:export\s+)?class\s+(\w+)/,
    method: /^(\s*)(?:async\s+)?(?:static\s+)?(\w+)\s*\([^)]*\)\s*\{/,
    arrow: /^(\s*)(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>\s*[{\(]/,
    variable: /^(\s*)(?:export\s+)?(?:const|let|var)\s+(\w+)\s*=\s*(?:function|class|new)/
  };
  
  // Check for existing comments
  const commentPattern = /\/\*\*[\s\S]*?\*\//;
  
  let i = 0;
  while (i < lines.length) {
    let matched = false;
    
    // Skip existing comments
    if (lines[i].trim().startsWith('/**')) {
      while (i < lines.length && !lines[i].includes('*/')) {
        i++;
      }
      i++;
      continue;
    }
    
    // Check for each pattern
    for (const [type, pattern] of Object.entries(patterns)) {
      const match = lines[i].match(pattern);
      
      if (match) {
        const indentation = match[1] || '';
        const name = match[2];
        const startLine = i;
        
        // Check if there's already a comment above
        const hasComment = i > 0 && commentPattern.test(lines[i-1]);
        
        // Find the end of the block
        let endLine = i;
        let braceCount = 0;
        let foundOpenBrace = false;
        
        // For one-liners or simple declarations
        if (type === 'variable' && !lines[i].includes('{')) {
          endLine = i;
        } else {
          // For blocks with braces
          while (endLine < lines.length) {
            const line = lines[endLine];
            
            // Count braces to find matching closing brace
            for (let j = 0; j < line.length; j++) {
              if (line[j] === '{') {
                foundOpenBrace = true;
                braceCount++;
              } else if (line[j] === '}') {
                braceCount--;
              }
            }
            
            if (foundOpenBrace && braceCount === 0) {
              break;
            }
            
            endLine++;
          }
        }
        
        // Extract the code
        const code = lines.slice(startLine, endLine + 1).join('\n');
        
        items.push({
          type: type as any,
          name,
          code,
          startLine,
          endLine,
          hasComment,
          indentation
        });
        
        matched = true;
        i = endLine + 1;
        break;
      }
    }
    
    if (!matched) {
      i++;
    }
  }
  
  // Extract context (imports, type definitions, etc.)
  const contextLines: string[] = [];
  const importPattern = /^\s*import\s+/;
  const typePattern = /^\s*(?:export\s+)?(?:type|interface|enum)\s+/;
  
  for (let i = 0; i < lines.length; i++) {
    if (importPattern.test(lines[i]) || typePattern.test(lines[i])) {
      let endLine = i;
      while (endLine < lines.length - 1 && !lines[endLine].trim().endsWith(';') && !lines[endLine].trim().endsWith('}')) {
        endLine++;
      }
      
      contextLines.push(lines.slice(i, endLine + 1).join('\n'));
      i = endLine;
    }
  }
  
  return {
    items,
    context: contextLines.join('\n')
  };
}

/**
 * Insert a comment above a documentable item
 */
export function insertComment(content: string, item: DocumentableItem, comment: string): string {
  const lines = content.split('\n');
  
  // Format the comment with proper indentation
  const indentedComment = comment
    .split('\n')
    .map((line, i) => i === 0 ? line : `${item.indentation}${line}`)
    .join('\n');
  
  // Insert the comment above the item
  lines.splice(item.startLine, 0, indentedComment);
  
  return lines.join('\n');
}