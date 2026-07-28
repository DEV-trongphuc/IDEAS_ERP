const fs = require('fs');

let text = fs.readFileSync('d:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\step_4787_full.txt', 'utf8');

if (text.startsWith('"')) text = text.substring(1);
if (text.endsWith('"')) text = text.substring(0, text.length - 1);

text = text.replace(/\\n/g, '\n')
           .replace(/\\t/g, '\t')
           .replace(/\\"/g, '"')
           .replace(/\\\\/g, '\\');

fs.writeFileSync('d:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\step_4787_formatted.txt', text, 'utf8');
console.log('Formatted Step 4787 content.');
