const fs = require('fs');
const path = 'src/pages/Settings.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove searchableSettingsItems for databank_limits
content = content.replace(
    `    { id: 'databank_limits', tab: 'business_limits', category: t('Phân phối & Nghiệp vụ'), subtab: t('Nghiệp vụ & Hạn mức'), title: t('Hạn mức rút data Databank (Giờ/Ngày/Tháng)'), desc: t('Giới hạn số data tối đa Sale được chủ động lấy từ kho data chung'), keywords: ['databank', 'kho data', 'rút data', 'hạn mức kho'] },\n`,
    ''
);

// 2. Remove Nhóm 3 & Nhóm 4 layout blocks
const startAnchor = `{/* Nhóm 3: Hạn mức nhận Databank */}`;
const endAnchor = `{/* Nhóm 5: Quy tắc cọc & Bể cọc */}`;

const startIndex = content.indexOf(startAnchor);
const endIndex = content.indexOf(endAnchor);

if (startIndex !== -1 && endIndex !== -1) {
    content = content.slice(0, startIndex) + `\n                  {/* Kho Databank đã được lược bỏ */}\n                  ` + content.slice(endIndex);
    console.log("Successfully removed Databank layout blocks from Settings.tsx!");
} else {
    console.log("Error: Could not locate Databank layout blocks anchor.");
}

fs.writeFileSync(path, content, 'utf8');
console.log("Completed Settings.tsx modifications!");
