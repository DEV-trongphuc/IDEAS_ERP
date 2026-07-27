const fs = require('fs');
const path = 'src/pages/SalePortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove lazy import
content = content.replace(
    `const InvoicesPage = lazy(() => import('./InvoicesPage').then(module => ({ default: module.InvoicesPage })));\n`,
    ''
);

// 2. Remove from activeTabProp types
content = content.replace(
    `activeTabProp?: 'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'invoices' | 'projects' | 'files' | 'consultants' | 'attendance-portal';`,
    `activeTabProp?: 'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'projects' | 'files' | 'consultants' | 'attendance-portal';`
);

// 3. Remove from activeTab useState types
content = content.replace(
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'invoices' | 'projects' | 'files' | 'consultants' | 'attendance-portal'>(activeTabProp || 'dashboard');`,
    `const [activeTab, setActiveTab] = useState<'dashboard' | 'workspace' | 'data' | 'tickets' | 'schedule' | 'calendar' | 'fair-share' | 'databank' | 'projects' | 'files' | 'consultants' | 'attendance-portal'>(activeTabProp || 'dashboard');`
);

// 4. Remove sidebar items (two occurrences)
const targetSidebarBlock = `                    { name: 'Hóa đơn', key: 'invoices', icon: Receipt },\n                    { name: 'Phiếu hợp tác', key: 'cooperation-slips', icon: Scale, route: '/cooperation-slips' },\n                    { name: 'Chi phí', key: 'expenses', icon: CreditCard, route: '/expenses' }`;
const replacementSidebarBlock = `                    { name: 'Chi phí', key: 'expenses', icon: CreditCard, route: '/expenses' }`;

content = content.split(targetSidebarBlock).join(replacementSidebarBlock);

// 5. Remove tab switch block
const targetTabBlock = `              {activeTab === 'invoices' && (
                <Suspense fallback={null}>
                  <InvoicesPage />
                </Suspense>
              )}\n`;

content = content.replace(targetTabBlock, '');

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully cleaned up SalePortal.tsx!");
