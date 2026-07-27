const fs = require('fs');
const path = 'src/pages/DataList.tsx';
let content = fs.readFileSync(path, 'utf8');

const originalIsCrlf = content.includes('\r\n');
if (originalIsCrlf) {
    content = content.replace(/\r\n/g, '\n');
}

// 1. Hide the databank view mode toggle button
const targetToggleBlock = `              <button
                type="button"
                className={\`btn-toggle-view \${viewMode === 'databank' ? 'active' : ''}\`}
                onClick={() => {
                  setLocalViewMode('databank');
                  navigate('/data?view=databank');
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: 'none',
                  background: viewMode === 'databank' ? 'var(--color-primary)' : 'transparent',
                  color: viewMode === 'databank' ? 'white' : 'var(--color-text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  height: '28px'
                }}
              >
                <Database size={13} /> <span className="hide-on-mobile">{t('Kho chung (Databank)')}</span>
              </button>`;

if (content.includes(targetToggleBlock)) {
    content = content.replace(targetToggleBlock, '/* databank tab disabled */');
    console.log("Successfully replaced toggle block in DataList.tsx!");
} else {
    console.log("Error: Toggle block not found in DataList.tsx!");
}

// 2. Disable release button in lead details view
const targetReleaseCondition = `                      const canRelease = isAdmin ? (
                        selectedLead.status !== 'databank' && selectedLead.status !== 'released_to_kho' && selectedLead.is_public !== 1 && Number(selectedLead.is_public) !== 1 && !isAdminEditingLead
                      ) : (
                        isClaimer && selectedLead.status !== 'databank' && selectedLead.status !== 'released_to_kho' && selectedLead.is_public !== 1 && Number(selectedLead.is_public) !== 1
                      );`;

if (content.includes(targetReleaseCondition)) {
    content = content.replace(targetReleaseCondition, '                      const canRelease = false;');
    console.log("Successfully replaced release condition in DataList.tsx!");
} else {
    console.log("Error: Release condition not found in DataList.tsx!");
}

if (originalIsCrlf) {
    content = content.replace(/\n/g, '\r\n');
}

fs.writeFileSync(path, content, 'utf8');
console.log("Completed DataList.tsx cleanups!");
