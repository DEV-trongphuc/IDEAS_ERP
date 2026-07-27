const fs = require('fs');
const path = 'src/pages/SalePortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove from activeTabProp types
content = content.replace(
    `activeTabProp?: 'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'projects' | 'files' | 'consultants' | 'attendance-portal';`,
    `activeTabProp?: 'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'projects' | 'files' | 'consultants' | 'attendance-portal';`
);

// 2. Remove from activeTab useState types
content = content.replace(
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'projects' | 'files' | 'consultants' | 'attendance-portal'>(activeTabProp || 'dashboard');`,
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'projects' | 'files' | 'consultants' | 'attendance-portal'>(activeTabProp || 'dashboard');`
);

// 3. Remove Databank items from sidebar lists
const targetSidebarBlock = `                    { name: 'Tổng quan', key: 'dashboard', icon: LayoutDashboard },\n                    { name: 'Bàn làm việc', key: 'workspace', icon: CheckSquare },\n                    { name: 'Kho Databank', key: 'databank', icon: Layers }`;
const replacementSidebarBlock = `                    { name: 'Tổng quan', key: 'dashboard', icon: LayoutDashboard },\n                    { name: 'Bàn làm việc', key: 'workspace', icon: CheckSquare }`;

content = content.split(targetSidebarBlock).join(replacementSidebarBlock);

// 4. Disable databank tab render block
content = content.replace(
    `{activeTab === 'databank' && renderDatabankView()}`,
    `/* databank disabled */`
);

// 5. Disable release button in lead details view
content = content.replace(
    `const canRelease = isClaimer && activeDetailLead.status !== 'databank' && activeDetailLead.status !== 'released_to_kho' && activeDetailLead.is_public !== 1 && Number(activeDetailLead.is_public) !== 1;`,
    `const canRelease = false;`
);

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully cleaned databank from SalePortal.tsx!");
