<?php
// backend/test_deposit_currency_approval.php
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/controllers/DepositController.php';

// Mock getBody and respond functions
global $mockPayload;
$mockPayload = [];

global $lastResponse;
$lastResponse = null;

if (!function_exists('getBody')) {
    function getBody() {
        global $mockPayload;
        return $mockPayload;
    }
}

if (!function_exists('respond')) {
    function respond(int $code, $data = null, string $message = '', bool $success = true): void {
        global $lastResponse;
        $lastResponse = [
            'code' => $code,
            'data' => $data,
            'message' => $message,
            'success' => $success
        ];
    }
}

if (!function_exists('requireRole')) {
    function requireRole(array $payload, array $roles): void {
        // Pass validation in test mode
    }
}

if (!function_exists('logActivity')) {
    function logActivity($db, $tid, $uid, string $action, ?string $resource = null, $resourceId = null, ?string $data = null): void {
        // Mocked logActivity
    }
}

echo "====================================================\n";
echo "🧪 RUNNING DEPOSIT FOREIGN CURRENCY APPROVAL TESTS\n";
echo "====================================================\n\n";

$db = $pdo;

// 1. Create temporary test records
$db->exec("DELETE FROM deposit_milestones WHERE milestone_name LIKE '[TEST_CURR]%'");
$db->exec("DELETE FROM deposits WHERE unit_code LIKE '[TEST_CURR]%'");
$db->exec("DELETE FROM contacts WHERE phone = '0999999999'");

// Create test contact
$db->exec("
    INSERT INTO contacts (tenant_id, first_name, last_name, phone, pipeline_status, status)
    VALUES (1, 'Test', 'Currency User', '0999999999', 'lead', 'lead')
");
$contactId = $db->lastInsertId();

// Create test deposit (foreign currency USD)
$db->prepare("
    INSERT INTO deposits (contact_id, project_id, unit_code, price, expected_commission, status, created_by, currency, exchange_rate)
    VALUES (?, 2, '[TEST_CURR] Unit', 25000000.00, 1000000.00, 'pending_admin', 100009, 'USD', 25000.00)
")->execute([$contactId]);
$depositId = $db->lastInsertId();

// Create test milestone
$db->prepare("
    INSERT INTO deposit_milestones (deposit_id, milestone_name, expected_amount, original_amount, status, unc_file_path)
    VALUES (?, '[TEST_CURR] Milestone 1', 25000000.00, 1000.00, 'paid', 'uploads/test_unc.jpg')
")->execute([$depositId]);
$milestoneId = $db->lastInsertId();

$auth = [
    'user_id' => 100009,
    'tenant_id' => 1,
    'role' => 'accountant'
];

$controller = new DepositController($db);

// --- TEST 1: Approve foreign currency milestone without actual_amount (Should Fail 400) ---
$mockPayload = []; // Empty body, actual_amount = null
$lastResponse = null;

try {
    $controller->approveMilestone($auth, $depositId, $milestoneId);
    $is400 = ($lastResponse && $lastResponse['code'] === 400);
    $msgMatch = ($lastResponse && strpos($lastResponse['message'], 'Vui lòng cung cấp số tiền thực tế nhận được bằng VND') !== false);
    assertTest("Test 1: Approve milestone without actual_amount status 400", $is400, "Response: " . json_encode($lastResponse));
    assertTest("Test 1: Approve milestone without actual_amount message", $msgMatch, "Message: " . ($lastResponse['message'] ?? 'null'));
} catch (Throwable $t) {
    assertTest("Test 1: Approve milestone without actual_amount", false, "Unexpected exception: " . $t->getMessage() . "\n" . $t->getTraceAsString());
}

// --- TEST 2: Approve foreign currency milestone with actual_amount (Should Succeed 200) ---
$mockPayload = ['actual_amount' => 24500000.00];
$lastResponse = null;

try {
    $controller->approveMilestone($auth, $depositId, $milestoneId);
    $is200 = ($lastResponse && $lastResponse['code'] === 200);
    assertTest("Test 2: Approve milestone responds with 200", $is200, "Response: " . json_encode($lastResponse));
    
    // Check DB states
    $stmtM = $db->prepare("SELECT status, actual_amount FROM deposit_milestones WHERE id = ?");
    $stmtM->execute([$milestoneId]);
    $mRow = $stmtM->fetch();
    
    $statusOk = ($mRow['status'] === 'approved');
    $amountOk = ((float)$mRow['actual_amount'] === 24500000.00);
    
    assertTest("Test 2: Approve milestone with valid actual_amount status is approved", $statusOk, "Milestone status: " . $mRow['status']);
    assertTest("Test 2: Approve milestone with valid actual_amount value is 24,500,000", $amountOk, "Actual amount in DB: " . $mRow['actual_amount']);
    
    // Check if deposit status is updated (since all milestones are approved)
    $stmtD = $db->prepare("SELECT status FROM deposits WHERE id = ?");
    $stmtD->execute([$depositId]);
    $dRow = $stmtD->fetch();
    assertTest("Test 2: Deposit slip status is updated to approved", $dRow['status'] === 'approved', "Deposit status: " . $dRow['status']);
    
} catch (Throwable $t) {
    assertTest("Test 2: Approve milestone with valid actual_amount", false, "Unexpected exception: " . $t->getMessage() . "\n" . $t->getTraceAsString());
}

// Clean up
$db->exec("DELETE FROM deposit_milestones WHERE milestone_name LIKE '[TEST_CURR]%'");
$db->exec("DELETE FROM deposits WHERE unit_code LIKE '[TEST_CURR]%'");
$db->exec("DELETE FROM contacts WHERE phone = '0999999999'");

printTestSummary();
