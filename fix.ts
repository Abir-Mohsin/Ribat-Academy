import fs from 'fs';
import path from 'path';

function walk(dir: string, callback: (path: string) => void) {
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) walk(file, callback);
    else callback(file);
  });
}

walk('src', (filepath) => {
  if (filepath.endsWith('.tsx')) {
    let content = fs.readFileSync(filepath, 'utf8');
    
    // Simple fix: find all <img ...> tags and if they have more than one referrerPolicy="no-referrer", remove the extra ones.
    content = content.replace(/<img[^>]+>/g, (match) => {
      let count = 0;
      return match.replace(/referrerPolicy="no-referrer"\s*/g, (p) => {
        count++;
        return count === 1 ? p : '';
      });
    });

    fs.writeFileSync(filepath, content, 'utf8');
  }
});
