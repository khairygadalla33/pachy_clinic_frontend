const fs = require('fs');
const path = require('path');
function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if(file.endsWith('.ts') || file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}
walk('./src').forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  // Replace api.get('/api/ or api.get(`/api/ with api.get('/ or api.get(`/
  let newContent = content
    .replace(/api\.get\(['"`]\/api\//g, match => match.replace('/api/', '/'))
    .replace(/api\.post\(['"`]\/api\//g, match => match.replace('/api/', '/'))
    .replace(/api\.put\(['"`]\/api\//g, match => match.replace('/api/', '/'))
    .replace(/api\.delete\(['"`]\/api\//g, match => match.replace('/api/', '/'));
  
  if(content !== newContent) {
    fs.writeFileSync(f, newContent);
    console.log('Updated ' + f);
  }
});
