const fs = require('fs');

function searchInFile(filePath, query) {
    if (!fs.existsSync(filePath)) return;
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const matches = [];
    lines.forEach((line, index) => {
        if (line.toLowerCase().includes(query.toLowerCase())) {
            matches.push({ lineNum: index + 1, content: line.trim() });
        }
    });
    console.log(`=== Matches for "${query}" in ${filePath} ===`);
    matches.forEach(m => console.log(`${m.lineNum}: ${m.content}`));
}

searchInFile('backend/api.php', 'get_settings');
searchInFile('backend/api.php', 'save_settings');
searchInFile('backend/api.php', 'update_settings');
