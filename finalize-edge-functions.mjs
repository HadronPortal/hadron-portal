import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/guilh/OneDrive/Documents/GitHub/hadron-portal/supabase/functions';
const folders = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

for (const folder of folders) {
  const filePath = path.join(baseDir, folder, 'index.ts');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // 1. Ensure API_BASE_URL and _API_ENV are defined
  if (!content.includes('const API_BASE_URL')) {
    const snippet = `
const _API_ENV = Deno.env.get('ENVIRONMENT') || 'development';
const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');
`;
    // Find last import
    const imports = [...content.matchAll(/^import .*$/gm)];
    if (imports.length > 0) {
      const last = imports[imports.length - 1];
      const pos = last.index + last[0].length;
      content = content.slice(0, pos) + '\n' + snippet + content.slice(pos);
    } else {
      content = snippet + content;
    }
  }

  // 2. Ensure CONTEXT is defined for paths like /DEV/ or /APP/
  if (!content.includes('const CONTEXT =')) {
    const contextSnippet = `const CONTEXT = _API_ENV === 'production' ? 'APP' : 'DEV';\n`;
    // Place after API_BASE_URL
    content = content.replace(/(const API_BASE_URL = .*?;)/, '$1\n' + contextSnippet);
  }

  // 3. Replace hardcoded URLs/hosts
  content = content.replace(/['"]https:\/\/dev\.hadronweb\.com\.br(.*?)['"]/g, '`${API_BASE_URL}$1`');
  
  // 4. Replace hardcoded /DEV/ in paths if it's following a base URL variable
  // Matches: ${API_BASE_URL}/DEV/   or  `${API_BASE_URL}/DEV/
  content = content.replace(/\$\{API_BASE_URL\}\/DEV\//g, '${API_BASE_URL}/${CONTEXT}/');
  
  // 5. Special case for proxy-image if it has double /products/ or something
  // (We'll trust the manual fix we just did, but this script will reinforce it)

  fs.writeFileSync(filePath, content);
  console.log(`Refactored: ${folder}`);
}
