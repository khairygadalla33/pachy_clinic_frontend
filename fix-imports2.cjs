const fs = require('fs');

const filesToFix = [
  'src/pages/AuditLog.tsx',
  'src/pages/Dashboard.tsx',
  'src/pages/InjectionSessions.tsx',
  'src/pages/LaserSessions.tsx',
  'src/pages/SkinCareSessions.tsx',
];

for (const file of filesToFix) {
  const filePath = `F:/PachyClinic/frontend/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Remove unused lucide-react imports that cause errors
  content = content.replace(/import\s*{\s*ShieldAlert\s*}\s*from\s*['"]lucide-react['"];?\n?/, '');
  content = content.replace(/import\s*{\s*Activity\s*}\s*from\s*['"]lucide-react['"];?\n?/, '');
  
  // Remove unused useAuth in Dashboard
  if (file.includes('Dashboard.tsx')) {
    content = content.replace(/import\s*{\s*useAuth\s*}\s*from\s*['"]\.\.\/lib\/auth['"];?\n?/, '');
  }

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
}
