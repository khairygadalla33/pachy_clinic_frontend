const fs = require('fs');
const path = require('path');

const dir = 'F:/PachyClinic/frontend/src/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace <h1 ...>...</h1> optionally inside a <div> and with a <p>
  // Pattern 1: <div> <h1>...</h1> <p>...</p> </div>
  let newContent = content.replace(/<div[^>]*>\s*<h1[^>]*text-2xl\s+font-bold[^>]*>.*?<\/h1>(?:\s*<p[^>]*>.*?<\/p>)?\s*<\/div>/gs, '');
  
  // Pattern 2: just <h1>...</h1>
  newContent = newContent.replace(/<h1[^>]*text-2xl\s+font-bold[^>]*>.*?<\/h1>/gs, '');

  // In RTL, moving to "right" means flex-start.
  // Many containers use justify-between. We replace justify-between with justify-start.
  // e.g. className="flex justify-between" => className="flex justify-start"
  // e.g. className="flex flex-col md:flex-row items-start md:items-center justify-between"
  newContent = newContent.replace(/justify-between/g, 'justify-start');

  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent, 'utf8');
    console.log('Updated', file);
  }
}
