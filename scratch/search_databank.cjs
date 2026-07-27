const fs = require('fs');
const path = require('path');

function searchDir(dir, query) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
            if (file !== 'node_modules' && file !== '.git' && file !== 'dist') {
                searchDir(fullPath, query);
            }
        } else {
            if (file.endsWith('.php') || file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.sql')) {
                const content = fs.readFileSync(fullPath, 'utf8');
                const matches = [];
                const lines = content.split(/\r?\n/);
                lines.forEach((line, index) => {
                    if (line.toLowerCase().includes(query.toLowerCase())) {
                        matches.push({ lineNum: index + 1, content: line.trim() });
                    }
                });
                if (matches.length > 0) {
                    console.log(`\n=== Matches for "${query}" in ${fullPath} (${matches.length} matches) ===`);
                    matches.slice(0, 5).forEach(m => console.log(`  L${m.lineNum}: ${m.content}`));
                }
            }
        }
    }
}

console.log("Searching for 'databank'...");
searchDir('src', 'databank');
searchDir('backend', 'databank');

console.log("\nSearching for 'recall'...");
searchDir('backend', 'recall');
