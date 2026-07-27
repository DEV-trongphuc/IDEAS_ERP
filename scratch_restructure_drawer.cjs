const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Approvals.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const startPhrase = '{showCreateModal &&';
const startIdx = content.indexOf(startPhrase);
if (startIdx === -1) {
  console.error('Start phrase not found');
  process.exit(1);
}

// Find the opening brace of the expression {showCreateModal ...}
let braceCount = 0;
let endIdx = -1;

for (let i = startIdx; i < content.length; i++) {
  if (content[i] === '{') {
    braceCount++;
  } else if (content[i] === '}') {
    braceCount--;
    if (braceCount === 0) {
      endIdx = i;
      break;
    }
  }
}

if (endIdx === -1) {
  console.error('Matching closing brace not found');
  process.exit(1);
}

console.log('Successfully found range!');
console.log('Start substring:', content.substring(startIdx, startIdx + 50));
console.log('End substring:', content.substring(endIdx - 50, endIdx + 1));
