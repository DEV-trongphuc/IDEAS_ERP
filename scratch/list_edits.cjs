const fs = require('fs');

const logPath = 'C:\\Users\\LENOVO\\.gemini\\antigravity-ide\\brain\\b2b8cb83-8820-496d-986f-dfe26f432881\\.system_generated\\logs\\transcript_full.jsonl';
const lines = fs.readFileSync(logPath, 'utf8').split('\n');

const edits = [];

lines.forEach(line => {
  if (!line.trim()) return;
  try {
    const data = JSON.parse(line);
    if (data.type === 'PLANNER_RESPONSE' && data.tool_calls) {
      data.tool_calls.forEach(tc => {
        if (tc.name === 'replace_file_content' || tc.name === 'multi_replace_file_content' || tc.name === 'write_to_file') {
          const targetFile = tc.args.TargetFile || tc.args.targetFile;
          if (targetFile && targetFile.includes('DepositsPage.tsx')) {
            edits.push({
              step_index: data.step_index,
              tool: tc.name,
              description: tc.args.Description || tc.args.description,
              startLine: tc.args.StartLine || tc.args.startLine,
              endLine: tc.args.EndLine || tc.args.endLine,
              targetContent: tc.args.TargetContent || tc.args.targetContent,
              replacementContent: tc.args.ReplacementContent || tc.args.replacementContent
            });
          }
        }
      });
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});

console.log(`Found ${edits.length} edits to DepositsPage.tsx.`);
fs.writeFileSync('d:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\edits_chronological.json', JSON.stringify(edits, null, 2), 'utf8');
console.log('Saved to edits_chronological.json');
