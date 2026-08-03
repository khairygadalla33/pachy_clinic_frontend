const fs = require('fs');

const filesToFix = {
  'src/pages/AuditLog.tsx': [{ find: /ShieldAlert,\s*/g, replace: '' }, { find: /,\s*ShieldAlert/g, replace: '' }],
  'src/pages/Dashboard.tsx': [{ find: /const { user } = useAuth\(\);\s*/g, replace: '' }],
  'src/pages/InjectionSessions.tsx': [{ find: /Activity,\s*/g, replace: '' }, { find: /,\s*Activity/g, replace: '' }],
  'src/pages/LaserSessions.tsx': [{ find: /Activity,\s*/g, replace: '' }, { find: /,\s*Activity/g, replace: '' }],
  'src/pages/SkinCareSessions.tsx': [{ find: /Activity,\s*/g, replace: '' }, { find: /,\s*Activity/g, replace: '' }],
  'src/pages/UserManagement.tsx': [{ find: /Shield,\s*/g, replace: '' }, { find: /,\s*Shield/g, replace: '' }],
  'src/pages/WhatsApp.tsx': [{ find: /MessageSquare,\s*/g, replace: '' }, { find: /,\s*MessageSquare/g, replace: '' }],
};

for (const [file, fixes] of Object.entries(filesToFix)) {
  const filePath = `F:/PachyClinic/frontend/${file}`;
  let content = fs.readFileSync(filePath, 'utf8');
  for (const fix of fixes) {
    content = content.replace(fix.find, fix.replace);
  }
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed', file);
}
