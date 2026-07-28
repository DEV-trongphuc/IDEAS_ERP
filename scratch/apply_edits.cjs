const fs = require('fs');

const editsPath = 'd:\\GITHUB_SPACE\\IDEAS_ERP\\scratch\\edits_chronological.json';
const filePath = 'd:\\GITHUB_SPACE\\IDEAS_ERP\\src\\pages\\DepositsPage.tsx';

if (!fs.existsSync(editsPath)) {
  console.error('edits_chronological.json not found!');
  process.exit(1);
}

const edits = JSON.parse(fs.readFileSync(editsPath, 'utf8'));
let code = fs.readFileSync(filePath, 'utf8');

// Filter edits starting from the drawer feature (step_index >= 4700)
const filtered = edits.filter(e => e.step_index >= 4700);
console.log(`Applying ${filtered.length} edits to DepositsPage.tsx...`);

const cleanString = (str) => {
  if (typeof str !== 'string') return '';
  let res = str;
  try {
    res = JSON.parse(res);
  } catch (e) {}
  
  if (typeof res === 'string') {
    res = res.replace(/\\r/g, '\r')
             .replace(/\\n/g, '\n')
             .replace(/\\t/g, '\t')
             .replace(/\\"/g, '"')
             .replace(/\\\\/g, '\\');
             
    if (res.startsWith('"') && res.endsWith('"')) {
      res = res.substring(1, res.length - 1);
    }
  }
  return res;
};

filtered.forEach((edit) => {
  console.log(`\nStep ${edit.step_index}: ${edit.description}`);
  const target = cleanString(edit.targetContent);
  const replacement = cleanString(edit.replacementContent);

  if (!target) {
    console.log('Skipping because target is empty/undefined (possibly multi_replace_file_content chunk)');
    return;
  }

  // Standardize carriage returns
  const normalizedCode = code.replace(/\r\n/g, '\n');
  const normalizedTarget = target.replace(/\r\n/g, '\n');
  const normalizedReplacement = replacement.replace(/\r\n/g, '\n');

  if (normalizedCode.includes(normalizedTarget)) {
    const newNormalizedCode = normalizedCode.replace(normalizedTarget, normalizedReplacement);
    // Restore carriage returns
    code = newNormalizedCode.replace(/\n/g, '\r\n');
    console.log('-> Success!');
  } else {
    console.warn('-> WARNING: Target content not found in file!');
  }
});

fs.writeFileSync(filePath, code, 'utf8');
console.log('\nFinished applying edits to DepositsPage.tsx');
