import fs from 'fs';
import path from 'path';

const baseDir = 'c:/Users/guilh/OneDrive/Documents/GitHub/hadron-portal/supabase/functions';
const folders = fs.readdirSync(baseDir).filter(f => fs.statSync(path.join(baseDir, f)).isDirectory());

for (const folder of folders) {
  const filePath = path.join(baseDir, folder, 'index.ts');
  if (!fs.existsSync(filePath)) continue;

  let content = fs.readFileSync(filePath, 'utf8');

  // Fix the recursive definition bug
  // Replace: const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : `${API_BASE_URL}`);
  // With:    const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');
  
  content = content.replace(/const API_BASE_URL = Deno\.env\.get\('HADRON_API_URL'\) \?\? \(_API_ENV === 'production' \? 'https:\/\/app\.hadronweb\.com\.br' : `\$\{API_BASE_URL\}`\);/, 
    "const API_BASE_URL = Deno.env.get('HADRON_API_URL') ?? (_API_ENV === 'production' ? 'https://app.hadronweb.com.br' : 'https://dev.hadronweb.com.br');");

  fs.writeFileSync(filePath, content);
}
console.log('Fixed all recursive definitions!');
