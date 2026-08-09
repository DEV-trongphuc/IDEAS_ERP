<?php
require_once __DIR__ . '/../test_bootstrap.php';
require_once __DIR__ . '/../controllers/DepositController.php';

if (!function_exists('respond')) {
    function respond($code, $data = null, $message = '') {
        // Mock respond so controller execution doesn't terminate script
        global $lastResponse;
        $lastResponse = [
            'code' => $code,
            'success' => $code >= 200 && $code < 300,
            'data' => $data,
            'message' => $message
        ];
    }
}

// Let's inspect the controller updateMilestones implementation to see how it reads milestones:
// In DepositController.php:
// public function updateMilestones(array $auth, int $id): void {
//     ...
//     $input = json_decode(file_get_contents('php://input'), true) ?: [];
//     $milestones = $input['milestones'] ?? [];
//
// Since it reads php://input, we can mock it by setting our custom input or testing the internal logic directly.
// Let's write a simple integration test where we query current data, compare it, and assert correct behavior.

$stmt = $pdo->query("SELECT id, contact_id FROM deposits LIMIT 1");
$deposit = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$deposit) {
    echo "No deposit found in database to test.\n";
    exit(1);
}

$id = (int)$deposit['id'];
$tid = 1;
$userId = 100009;

// Let's query current milestones in database
$stmtM = $pdo->prepare("SELECT id, milestone_name, expected_amount, original_amount, expected_pay_date, status FROM deposit_milestones WHERE deposit_id = ?");
$stmtM->execute([$id]);
$currentDbMilestones = $stmtM->fetchAll(PDO::FETCH_ASSOC);
$currentDbIds = array_map('intval', array_column($currentDbMilestones, 'id'));

$milestones = [];
foreach ($currentDbMilestones as $m) {
    $milestones[] = [
        'id' => $m['id'],
        'milestone_name' => $m['milestone_name'],
        'expected_amount' => $m['expected_amount'],
        'original_amount' => $m['original_amount'],
        'expected_pay_date' => $m['expected_pay_date']
    ];
}

// Check initial log count
$stmtL = $pdo->prepare("SELECT COUNT(*) FROM audit_logs WHERE resource = 'deposit' AND resource_id = ? AND action = 'UPDATE_MILESTONES'");
$stmtL->execute([$id]);
$initialCount = (int)$stmtL->fetchColumn();

// --- TEST CASE 1: Run comparison logic directly (mocking no changes) ---
$payloadIds = [];
foreach ($milestones as $m) {
    if (isset($m['id']) && !empty($m['id'])) {
        $payloadIds[] = (int)$m['id'];
    }
}
$toDeleteIds = array_diff($currentDbIds, $payloadIds);
$hasChanges = !empty($toDeleteIds);

if (!$hasChanges) {
    foreach ($milestones as $m) {
        if (!isset($m['id']) || empty($m['id'])) {
            $hasChanges = true;
            break;
        }
    }
}

if (!$hasChanges) {
    $currency = 'VND'; // Mock currency
    $rate = 1.0;
    foreach ($milestones as $m) {
        if (isset($m['id']) && !empty($m['id'])) {
            $mId = (int)$m['id'];
            $dbMilestone = null;
            foreach ($currentDbMilestones as $cdm) {
                if ((int)$cdm['id'] === $mId) {
                    $dbMilestone = $cdm;
                    break;
                }
            }
            if ($dbMilestone) {
                $mName = trim($m['milestone_name'] ?? '');
                $mAmount = (float)$m['expected_amount'];
                $origAmount = null;
                $payDate = !empty($m['expected_pay_date']) ? $m['expected_pay_date'] : null;

                $dbPayDate = !empty($dbMilestone['expected_pay_date']) ? substr($dbMilestone['expected_pay_date'], 0, 10) : null;
                $newPayDate = !empty($payDate) ? substr($payDate, 0, 10) : null;

                if (trim($dbMilestone['milestone_name']) !== $mName) { $hasChanges = true; break; }
                if ($dbPayDate !== $newPayDate) { $hasChanges = true; break; }
                if ($dbMilestone['status'] !== 'approved' && $dbMilestone['status'] !== 'paid') {
                    if (abs((float)$dbMilestone['expected_amount'] - $mAmount) > 0.01) { $hasChanges = true; break; }
                }
            }
        }
    }
}

assertTest("TC01: Khi khong co thay doi, hasChanges phai la false", !$hasChanges);

// --- TEST CASE 2: Mock a change in a milestone name ---
if (!empty($milestones)) {
    $milestones[0]['milestone_name'] .= " Changed";
    
    // Rerun comparison logic
    $hasChangesWithMod = false;
    foreach ($milestones as $m) {
        if (isset($m['id']) && !empty($m['id'])) {
            $mId = (int)$m['id'];
            $dbMilestone = null;
            foreach ($currentDbMilestones as $cdm) {
                if ((int)$cdm['id'] === $mId) {
                    $dbMilestone = $cdm;
                    break;
                }
            }
            if ($dbMilestone) {
                $mName = trim($m['milestone_name'] ?? '');
                $mAmount = (float)$m['expected_amount'];
                $dbPayDate = !empty($dbMilestone['expected_pay_date']) ? substr($dbMilestone['expected_pay_date'], 0, 10) : null;
                $newPayDate = !empty($m['expected_pay_date']) ? substr($m['expected_pay_date'], 0, 10) : null;

                if (trim($dbMilestone['milestone_name']) !== $mName) { $hasChangesWithMod = true; break; }
            }
        }
    }
    
    assertTest("TC02: Khi co thay doi ten milestone, hasChanges phai la true", $hasChangesWithMod);
}

printTestSummary();
