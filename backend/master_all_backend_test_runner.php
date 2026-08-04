<?php
// backend/master_all_backend_test_runner.php
// MASTER TEST RUNNER - GOM TOAN BO ALL BACKEND TEST SUITES VA CONTROLLERS

require_once __DIR__ . '/test_bootstrap.php';

echo "====================================================\n";
echo "👑 MASTER BACKEND INTEGRATION TEST RUNNER\n";
echo "   Kiem thu gop toan bo tat ca 72+ file Backend\n";
echo "====================================================\n\n";

$masterStart = microtime(true);

// 1. Audit Controllers Syntax & Class Loading
echo "--- 1. AUDIT CONTROLLERS LOAD & SYNTAX ---\n";
$controllersDir = __DIR__ . '/controllers';
if (is_dir($controllersDir)) {
    $cFiles = glob($controllersDir . '/*Controller.php');
    foreach ($cFiles as $cFile) {
        $cName = basename($cFile);
        try {
            require_once $cFile;
            assertTest("Controller File Load: {$cName}", true);
        } catch (\Throwable $e) {
            assertTest("Controller File Load: {$cName}", false, "Error: " . $e->getMessage());
        }
    }
}

echo "\n--- 2. CHAY TEST SUITE: FULL SYSTEM HEALTH ---\n";
require_once __DIR__ . '/test_full_system.php';

echo "\n--- 3. CHAY TEST SUITE: SCHEMA & PAYLOAD AUDIT ---\n";
require_once __DIR__ . '/full_schema_payload_audit.php';

echo "\n--- 4. CHAY TEST SUITE: FULL MATRIX LOGIC & SHIFTS ---\n";
require_once __DIR__ . '/test_full_matrix_audit.php';

echo "\n--- 5. CHAY TEST SUITE: RBAC PERMISSION MATRIX ---\n";
require_once __DIR__ . '/test_permission_matrix.php';

echo "\n--- 6. CHAY TEST SUITE: EXTENDED BUSINESS RULES 1-4 ---\n";
require_once __DIR__ . '/test_extended_business_rules.php';

echo "\n--- 7. CHAY TEST SUITE: SQLSTATE & 500 STRESS TEST ---\n";
require_once __DIR__ . '/test_sqlstate_stress.php';

echo "\n--- 8. CHAY TEST SUITE: SMART LOGIC & DEFAULT CONFIGS AUDIT ---\n";
require_once __DIR__ . '/test_smart_logic_audit.php';

echo "\n--- 9. CHAY TEST SUITE: APPROVALS REJECTION REASON AUDIT ---\n";
require_once __DIR__ . '/test_approvals_rejection_audit.php';

echo "\n--- 10. CHAY TEST SUITE: COMPLETE ACADEMIC AUDIT ---\n";
require_once __DIR__ . '/test_complete_academic_audit.php';

echo "\n--- 11. CHAY TEST SUITE: ACADEMIC REMINDERS PAYLOAD AUDIT ---\n";
require_once __DIR__ . '/test_academic_reminders_payload.php';

echo "\n--- 12. CHAY TEST SUITE: SHARED CLASS AGGREGATION AUDIT ---\n";
require_once __DIR__ . '/test_shared_class_aggregation.php';

echo "\n--- 13. CHAY TEST SUITE: ALL LECTURERS SCHEDULE INTEGRITY ---\n";
require_once __DIR__ . '/test_all_lecturers_schedule.php';

echo "\n--- 14. CHAY TEST SUITE: WORKSPACE OPERATIONS INTEGRITY ---\n";
require_once __DIR__ . '/test_workspace_operations_suite.php';

echo "\n--- 15. CHAY TEST SUITE: WORKSPACE CONTACTS NOTIFICATIONS AUDIT ---\n";
require_once __DIR__ . '/test_workspace_contacts_notifications_audit.php';

echo "\n--- 16. CHAY TEST SUITE: SO/PO BOUNDARY CONCURRENCY AUDIT ---\n";
require_once __DIR__ . '/test_so_po_boundary_concurrency.php';

echo "\n--- 17. CHAY TEST SUITE: SO/PO APPROVALS AUDIT ---\n";
require_once __DIR__ . '/test_so_po_approvals_audit.php';

echo "\n--- 18. CHAY TEST SUITE: PARTNER PO BANKING INTEGRITY ---\n";
require_once __DIR__ . '/test_partner_po_banking.php';

$masterEnd = microtime(true);
$duration = round(($masterEnd - $masterStart) * 1000, 2);

echo "\n====================================================\n";
echo "🏆 MASTER TEST RUNNER HOAN THANH TRONG {$duration} ms\n";
printTestSummary();
