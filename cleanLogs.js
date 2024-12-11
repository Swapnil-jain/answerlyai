const fs = require('fs');
const path = require('path');

const directory = './src'; // Adjust this to your source folder

function cleanFileContent(content) {
  // Updated regex to remove single-line console statements and logger.log calls
  return content
    .replace(
      /(console\.(log|warn|error|info|debug|trace)\([^()\n]*\);?|logger\.log\([^()\n]*\);?)/g,
      ''
    )
    .replace(
      /import\s+\{\s*logger\s*\}\s+from\s+['"]@\/lib\/utils\/logger['"];?/g,
      ''
    );
}

function removeLogs(dir) {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      removeLogs(fullPath); // Recursively process subdirectories
    } else if (/\.(js|ts|tsx)$/.test(file)) {
      const content = fs.readFileSync(fullPath, 'utf-8');
      const updatedContent = cleanFileContent(content);

      if (content !== updatedContent) {
        fs.writeFileSync(fullPath, updatedContent, 'utf-8');
        console.log(`Cleaned: ${fullPath}`);
      }
    }
  });
}

console.log('Starting log cleanup...');
removeLogs(directory);
console.log('Log cleanup complete!');