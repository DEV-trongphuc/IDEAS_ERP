const fs = require('fs');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');
const line = lines.find(l => l.includes('"step_index":4787'));

if (line) {
  const startIndex = line.indexOf('"tool_calls":');
  const endIndex = line.lastIndexOf(']}');
  if (startIndex !== -1 && endIndex !== -1) {
    try {
      const toolCallsJson = '{' + line.slice(startIndex, endIndex + 2);
      const parsed = JSON.parse(toolCallsJson);
      const tc = parsed.tool_calls[0];
      const rawContent = tc.args.ReplacementContent || tc.args.replacementContent;

      let content = rawContent;
      // Strip outer quotes if present
      if (content.startsWith('"') && content.endsWith('"')) {
        content = content.substring(1, content.length - 1);
      }
      
      // Manually replace escaped sequences
      content = content.replace(/\\r/g, '\r')
                       .replace(/\\n/g, '\n')
                       .replace(/\\t/g, '\t')
                       .replace(/\\"/g, '"')
                       .replace(/\\\\/g, '\\');

      fs.writeFileSync('d:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\step_4787_full.txt', content, 'utf8');
      console.log('Saved Step 4787 successfully using manual unescaping from transcript_full.jsonl!');
    } catch (e) {
      console.error('Error in manual unescaping:', e);
    }
  } else {
    console.log('Could not find tool_calls block boundaries.');
  }
} else {
  console.log('Line 4787 not found in transcript_full.jsonl.');
}
