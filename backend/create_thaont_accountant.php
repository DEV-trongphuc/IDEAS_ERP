<?php
// backend/create_thaont_accountant.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== CREATING & MIGRATING TO REAL ACCOUNTANT NGUYEN THU THAO ===\n";

$email = 'thaont@ideas.edu.vn';
$fullName = 'Nguyễn Thu Thảo';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userRow) {
    $hash = password_hash('accountant123', PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare("
        INSERT INTO users (tenant_id, username, email, password_hash, full_name, role, is_active, status) 
        VALUES (1, 'thaont', ?, ?, ?, 'accountant', 1, 'active')
    ");
    $stmtInsert->execute([$email, $hash, $fullName]);
    $accId = (int)$pdo->lastInsertId();
    echo "Created accountant user '{$fullName}' successfully with ID: {$accId}!\n";
} else {
    $accId = (int)$userRow['id'];
    $hash = password_hash('accountant123', PASSWORD_BCRYPT);
    $stmtUpdate = $pdo->prepare("UPDATE users SET password_hash = ?, full_name = ?, role = 'accountant' WHERE id = ?");
    $stmtUpdate->execute([$hash, $fullName, $accId]);
    echo "Updated accountant user '{$fullName}' password & role successfully (ID: {$accId})!\n";
}

// Update all workflow tables to use this new accountant ID
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
