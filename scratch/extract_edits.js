const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript.jsonl';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

rl.on('line', (line) => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      data.tool_calls.forEach(tc => {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content') {
          const args = tc.args;
          const targetFile = args.TargetFile || args.targetFile;
          if (targetFile && targetFile.includes('DepositsPage.tsx')) {
            console.log(`\n========================================`);
            console.log(`STEP INDEX: ${data.step_index}`);
            console.log(`TOOL: ${tc.name}`);
            console.log(`DESCRIPTION: ${args.Description || args.description}`);
            console.log(`START LINE: ${args.StartLine || args.startLine}`);
            console.log(`END LINE: ${args.EndLine || args.endLine}`);
            console.log(`TARGET CONTENT:\n${args.TargetContent || args.targetContent}`);
            console.log(`REPLACEMENT CONTENT:\n${args.ReplacementContent || args.replacementContent}`);
          }
        }
      });
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});
