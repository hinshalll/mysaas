const fs = require('fs');
const path = require('path');

function walkDir(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    let dirPath = path.join(dir, f);
    let isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walkDir(dirPath, callback) : callback(path.join(dir, f));
  });
}

let count = 0;
walkDir('c:/Users/hinsh/Desktop/saas-prototype/ui/src/app', function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts') || filePath.endsWith('.jsx') || filePath.endsWith('.js')) {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;
    content = content.replace(/className="/g, 'className="');
    content = content.replace(/className={`/g, 'className={`');
    content = content.replace(/ className=""/g, ' className=""');
    content = content.replace(/ "/g, ' "');
    content = content.replace(/"/g, '"');
    content = content.replace(/ /g, ' ');
    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      count++;
      console.log('Updated ' + filePath);
    }
  }
});
console.log('Total files modified: ' + count);
