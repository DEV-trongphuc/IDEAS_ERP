const fs = require('fs');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const line = lines.find(l => l.includes('"step_index":4787'));

if (line) {
  const startIndex = line.indexOf('"tool_calls":');
  const endIndex = line.lastIndexOf(']}');
  if (startIndex !== -1 && endIndex !== -1) {
    const toolCallsJson = '{' + line.slice(startIndex, endIndex + 2);
    for (let i = 0; i < toolCallsJson.length; i++) {
      const code = toolCallsJson.charCodeAt(i);
      if (code < 32 && code !== 32) {
        console.log(`Control character found at index ${i}: code=${code}, context: ${JSON.stringify(toolCallsJson.slice(i - 10, i + 10))}`);
      }
    }
  }
}
