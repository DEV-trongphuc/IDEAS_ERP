const fs = require('fs');
const path = 'src/pages/SalePortal.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the useEffect for databank
const targetEffect = `  useEffect(() => {
    if (activeTab === 'databank') {
      fetchPublicLeads();
    }
  }, [activeTab, showDeletedFilter]);`;

content = content.replace(targetEffect, '');

// 2. Remove the "Nhận data" button
const targetButton = `            <button \n              onClick={() => setActiveTab('databank')}\n              className="welcome-action-btn outline-btn"\n            >\n              <Database size={14} />\n              {t('Nhận data')}\n            </button>`;

content = content.replace(targetButton, '');

fs.writeFileSync(path, content, 'utf8');
console.log("Successfully fixed SalePortal compilation errors!");
