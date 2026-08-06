<?php
// backend/fix_seeded_data.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== FIXING PIPELINE STATUS FOR SEEDED CONTACTS ===\n";

$conn->query("UPDATE contacts SET pipeline_status = 'nop_ho_so' WHERE stage_id = 4");
echo "Updated stage_id = 4 contacts to pipeline_status = 'nop_ho_so'\n";

$conn->query("UPDATE contacts SET pipeline_status = 'dong_le_phi_ho_so' WHERE stage_id = 5");
echo "Updated stage_id = 5 contacts to pipeline_status = 'dong_le_phi_ho_so'\n";

echo "=== FIXING COMPLETED ===\n";
unlink(__FILE__);
