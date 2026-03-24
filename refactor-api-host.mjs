import fs from 'fs';
import path from 'path';

const dir = 'c:/Users/guilh/OneDrive/Documents/GitHub/hadron-portal/supabase/functions';
const files = [];

function findTsFiles(dirPath) {
  const items = fs.readdirSync(dirPath);
  for (const item of items) {
    const fullPath = path.join(dirPath, item);
    if (fs.statSync(fullPath).isDirectory()) {
      findTsFiles(fullPath);
    } else if (fullPath.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
}

findTsFiles(dir);

const snippet = `
const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');
`;

let replacedFiles = 0;

for (const file of files) {
  let content = fs.readFileSync(file, 'utf8');
  
  // Check if file has the hardcoded dev url
  if (content.includes('https://dev.hadronweb.com.br')) {
    
    // Inject the constant after the imports
    if (!content.includes('API_BASE_URL')) {
      // Find the last import statement
      const importMatches = [...content.matchAll(/^import .*$/gm)];
      if (importMatches.length > 0) {
        const lastImport = importMatches[importMatches.length - 1];
        const insertPos = lastImport.index + lastImport[0].length;
        content = content.slice(0, insertPos) + '\n' + snippet + content.slice(insertPos);
      } else {
        // If no imports, put at the top
        content = snippet + '\n' + content;
      }
    }

    // Replace literal string fetches
    // From: fetch('https://dev.hadronweb.com.br/api/
    // To: fetch(`${API_BASE_URL}/api/
    content = content.replace(/['"]https:\/\/dev\.hadronweb\.com\.br(.*?)['"]/g, '`${API_BASE_URL}$1`');
    
    fs.writeFileSync(file, content);
    replacedFiles++;
    console.log(`Updated: ${path.basename(path.dirname(file))}/index.ts`);
  }
}

console.log(`Refactored ${replacedFiles} files!`);
