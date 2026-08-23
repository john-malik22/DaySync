const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else if (fullPath.endsWith('.js') || fullPath.endsWith('.jsx')) {
      results.push(fullPath);
    }
  });
  return results;
}

const files = walk('./src');
files.forEach(f => {
  const content = fs.readFileSync(f, 'utf8');
  const lines = content.split('\n');
  lines.forEach((line, idx) => {
    if (line.includes('startupPage') || line.includes('daysync_startup_page') || line.includes('STARTUP')) {
      console.log(`${f}:${idx + 1}: ${line.trim()}`);
    }
  });
});
