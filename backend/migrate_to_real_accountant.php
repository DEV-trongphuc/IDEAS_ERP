<?php
// backend/migrate_to_real_accountant.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== MIGRATING DATA WORKFLOWS TO REAL ACCOUNTANT ===\n";

// Find accountant user ID
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute(['accountant@Ideas.test']);
$accountant = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$accountant) {
    echo "ERROR: Accountant user not found!\n";
    exit;
}

$accId = (int)$accountant['id'];
echo "Real Accountant User ID: {$accId}\n";

// 1. Update deposits (Sales Orders)
$stmtDep = $pdo->prepare("UPDATE deposits SET accountant_id = ?");
$stmtDep->execute([$accId]);
echo "Updated deposits to set accountant_id = {$accId} (Rows: " . $stmtDep->rowCount() . ")\n";

// 2. Update purchase_orders
$stmtPo = $pdo->prepare("UPDATE purchase_orders SET approver_id_2 = ?, approver_id_3 = ?");
$stmtPo->execute([$accId, $accId]);
echo "Updated purchase_orders to set approver_id_2, approver_id_3 = {$accId} (Rows: " . $stmtPo->rowCount() . ")\n";

// 3. Update expenses
$stmtExp = $pdo->prepare("UPDATE expenses SET refunder_id = ?, approver_id_2 = ?");
$stmtExp->execute([$accId, $accId]);
echo "Updated expenses to set refunder_id, approver_id_2 = {$accId} (Rows: " . $stmtExp->rowCount() . ")\n";

echo "=== WORKFLOW MIGRATION COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
