const fs = require('fs');
const readline = require('readline');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript.jsonl';
const outputPath = 'd:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\extracted_drawer_edits_utf8.txt';

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let output = '';

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
            output += `\n========================================\n`;
            output += `STEP INDEX: ${data.step_index}\n`;
            output += `TOOL: ${tc.name}\n`;
            output += `DESCRIPTION: ${args.Description || args.description}\n`;
            output += `START LINE: ${args.StartLine || args.startLine}\n`;
            output += `END LINE: ${args.EndLine || args.endLine}\n`;
            output += `TARGET CONTENT:\n${args.TargetContent || args.targetContent}\n`;
            output += `REPLACEMENT CONTENT:\n${args.ReplacementContent || args.replacementContent}\n`;
          }
        }
      });
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});

rl.on('close', () => {
  fs.writeFileSync(outputPath, output, 'utf8');
  console.log('Done writing UTF8 file');
});
