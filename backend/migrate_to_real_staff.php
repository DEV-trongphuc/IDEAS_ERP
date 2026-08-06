<?php
// backend/migrate_to_real_staff.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== MIGRATING TO REAL STAFF USERS ===\n";

// 1. Delete user 100063 (Kế Toán Trưởng) and move references to 100064 (Nguyễn Thu Thảo)
$pdo->exec("UPDATE expenses SET refunder_id = 100064 WHERE refunder_id = 100063");
$pdo->exec("UPDATE expenses SET approver_id = 100064 WHERE approver_id = 100063");
$pdo->exec("UPDATE expenses SET approver_id_2 = 100064 WHERE approver_id_2 = 100063");
$pdo->exec("UPDATE expenses SET approver_id_3 = 100064 WHERE approver_id_3 = 100063");
$pdo->exec("UPDATE expenses SET created_by = 100064 WHERE created_by = 100063");

$pdo->exec("UPDATE deposits SET created_by = 100064 WHERE created_by = 100063");

$pdo->exec("UPDATE audit_logs SET user_id = 100064 WHERE user_id = 100063");

$pdo->exec("DELETE FROM users WHERE id = 100063");
echo "Deleted user 100063 (Kế Toán Trưởng) and redirected references to 100064 (Nguyễn Thu Thảo)\n";

// 2. Update placeholder approvers in expenses
// Let's set approver_id (Level 1) to 100062 (Mai Thị Nữ)
// And approver_id_2 (Level 2) to 100064 (Nguyễn Thu Thảo)
$pdo->exec("UPDATE expenses SET approver_id = 100062 WHERE approver_id IS NULL OR approver_id = 0");
$pdo->exec("UPDATE expenses SET approver_id_2 = 100064 WHERE approver_id_2 IS NULL OR approver_id_2 = 0");
echo "Updated default approver_id to 100062 (Mai Thị Nữ) and approver_id_2 to 100064 (Nguyễn Thu Thảo) for all expenses\n";

echo "=== MIGRATION COMPLETED ===\n";
unlink(__FILE__);
