const fs = require('fs');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const line = lines.find(l => l.includes('"step_index":4787'));

if (line) {
  const startIndex = line.indexOf('"tool_calls":');
  const endIndex = line.lastIndexOf(']}');
  if (startIndex !== -1 && endIndex !== -1) {
    const toolCallsJson = '{' + line.slice(startIndex, endIndex + 2);
    console.log('toolCallsJson length:', toolCallsJson.length);
    console.log('Slice around 2041 in toolCallsJson:', JSON.stringify(toolCallsJson.slice(2011, 2071)));
  }
}
