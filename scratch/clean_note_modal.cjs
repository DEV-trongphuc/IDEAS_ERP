const fs = require('fs');
const path = 'src/pages/CustomerProfileDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');

const startPattern = `{!editingNote && \\(\\r?\\n`;
const regex = new RegExp(startPattern);
const match = content.match(regex);

if (match) {
    const startIndex = match.index;
    const endAnchor = `/* Note Body Text Input */`;
    const endIndex = content.indexOf(endAnchor, startIndex);
    
    if (endIndex !== -1) {
        // We want to slice from startIndex to endIndex
        // Let's print out what we are removing to be 100% sure
        const targetString = content.slice(startIndex, endIndex);
        console.log("Removing block of size:", targetString.length);
        
        // Remove the block
        content = content.slice(0, startIndex) + content.slice(endIndex - 6); // -6 to keep "{/* Note"
        fs.writeFileSync(path, content, 'utf8');
        console.log("Successfully cleaned up the note modal layout!");
    } else {
        console.log("Error: End anchor not found after start pattern.");
    }
} else {
    console.log("Error: Start pattern not found.");
}
