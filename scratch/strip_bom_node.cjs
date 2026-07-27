const fs = require('fs');
const path = 'src/pages/CustomerProfileDrawer.tsx';
let content = fs.readFileSync(path, 'utf8');
if (content.charCodeAt(0) === 0xFEFF) {
    content = content.slice(1);
    fs.writeFileSync(path, content, 'utf8');
    console.log("BOM successfully stripped!");
} else {
    console.log("No BOM detected at position 0.");
}
