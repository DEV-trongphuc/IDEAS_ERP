const fs = require('fs');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const line = lines.find(l => l.includes('"step_index":4787'));

if (line) {
  console.log('Line length:', line.length);
  const pos = 2041;
  console.log('Slice around 2041:', JSON.stringify(line.slice(pos - 30, pos + 30)));
} else {
  console.log('Line 4787 not found.');
}
