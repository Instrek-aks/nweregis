const fs = require('fs');
const path = 'c:/Users/Hp/Downloads/sanchat/ind.html';
let content = fs.readFileSync(path, 'utf8');

// Replace em-dash (—) and en-dash (–) with hyphen (-)
// We use a regex to catch both.
content = content.replace(/[—–]/g, '-');

fs.writeFileSync(path, content, 'utf8');
console.log('Successfully replaced long hyphens with short hyphens.');
