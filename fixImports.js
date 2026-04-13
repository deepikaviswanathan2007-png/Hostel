const fs = require('fs');
const path = require('path');

const originalPositions = {
  'frontend/src/pages/admin/users/UsersPage.js': 'frontend/src/pages/admin/',
  'frontend/src/pages/admin/users/StudentsPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/users/AdminWardenDetailPage.js': 'frontend/src/pages/admin/',
  'frontend/src/pages/admin/users/FloorWardenPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/hostels/RoomsPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/hostels/AdminHostelsPage.js': 'frontend/src/pages/admin/',
  'frontend/src/pages/admin/hostels/AllocationsPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/hostels/MessMenuPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/hostels/VisitorManagementPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/complaints/ComplaintsPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/complaints/NoticesPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/complaints/AdminMessagesPage.js': 'frontend/src/pages/admin/',
  'frontend/src/pages/admin/reports/DashboardPage.js': 'frontend/src/pages/',
  'frontend/src/pages/admin/reports/AdminAttendanceReportsPage.js': 'frontend/src/pages/admin/'
};

for (const [newPath, oldDir] of Object.entries(originalPositions)) {
  const fullNewPath = path.join(process.cwd(), newPath);
  if (!fs.existsSync(fullNewPath)) continue;
  
  let content = fs.readFileSync(fullNewPath, 'utf8');
  
  content = content.replace(/from\s+(['"])([.]{1,2}\/.*?)\1/g, (match, quote, relPath) => {
    const oldTarget = path.resolve(process.cwd(), oldDir, relPath);
    let newRelPath = path.relative(path.dirname(fullNewPath), oldTarget);
    newRelPath = newRelPath.replace(/\\/g, '/'); // normalize slashes
    if (!newRelPath.startsWith('.')) {
       newRelPath = './' + newRelPath;
    }
    return `from ${quote}${newRelPath}${quote}`;
  });
  
  // also handle standard import expressions e.g. import '../styles.css';
  content = content.replace(/(?<!from\s+)import\s+(['"])([.]{1,2}\/.*?)\1/g, (match, quote, relPath) => {
    const oldTarget = path.resolve(process.cwd(), oldDir, relPath);
    let newRelPath = path.relative(path.dirname(fullNewPath), oldTarget);
    newRelPath = newRelPath.replace(/\\/g, '/'); // normalize slashes
    if (!newRelPath.startsWith('.')) {
       newRelPath = './' + newRelPath;
    }
    return `import ${quote}${newRelPath}${quote}`;
  });
  
  fs.writeFileSync(fullNewPath, content, 'utf8');
  console.log('Fixed imports in', newPath);
}
