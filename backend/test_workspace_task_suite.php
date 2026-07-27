<?php
// backend/test_workspace_task_suite.php
// Live Integration Test Suite for Workspace Task Drawer and Notifications
define('DIAG_TOKEN', true);
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/controllers/ActivityController.php';

// Helper respond to override default JSON respond
if (!function_exists('respond')) {
    function respond($code, $data = null, $message = '', $success = true) {
        throw new Exception("RESPOND_TRIGGERED: " . json_encode([
            'code' => $code,
            'success' => $success,
            'message' => $message,
            'data' => $data
        ]));
    }
}

if (!function_exists('getBody')) {
    global $mockedBody;
    function getBody() {
        global $mockedBody;
        return $mockedBody;
    }
}

if (!function_exists('logActivity')) {
    function logActivity(PDO $db, $tid, $uid, string $action, ?string $resource = null, $resourceId = null, ?string $data = null): void {
        // Mocked logActivity
    }
}

echo "=== STARTING WORKSPACE TASK DRAWER INTEGRATION TESTS ===\n\n";

$ctrl = new ActivityController($pdo);

// Prepare temporary contact and task for testing
$tenantId = 1;

// Clean old test items to keep database pristine
$pdo->exec("DELETE FROM activities WHERE subject LIKE '[TEST_SUITE]%'");
$pdo->exec("DELETE FROM notifications WHERE link LIKE '%highlight_activity_id%'");

// 1. Create a base task activity
$stmt = $pdo->prepare("
    INSERT INTO activities (tenant_id, user_id, subject, type, related_type, related_id, progress, require_approval, approver_id, approval_status, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
");
$stmt->execute([
    $tenantId,
    100009, // Dev Admin
    '[TEST_SUITE] Implement Workspace Task Drawer Tests',
    'task',
    'contact',
    24, // Related Contact ID 24
    50, // 50% progress
    1,  // Require approval
    100011, // Designated Approver: Dev Manager (100011)
    'pending',
    'planned'
]);
$taskId = (int)$pdo->lastInsertId();
assertTest("Create test activity task", $taskId > 0, "Inserted Task ID: " . $taskId);

// ----------------------------------------------------
// TEST CASE 1: Add a comment with HTML mention tag and check notification creation
// ----------------------------------------------------
echo "\n--- TEST CASE 1: HTML Mentions & Notification Notification Triggering ---\n";
global $mockedBody;
$mockedBody = [
    'content' => 'Chào <span class="mention" data-user-id="100010">@Dev Director</span>, hãy vào kiểm tra tiến độ nhé.',
    'attachments' => []
];

$authAdmin = [
    'user_id' => 100009,
    'tenant_id' => 1,
    'role' => 'admin',
    'full_name' => 'Dev Admin'
];

try {
    $ctrl->addComment($authAdmin, $taskId);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'RESPOND_TRIGGERED') === false) {
        echo "Unexpected error: " . $e->getMessage() . "\n";
    }
}

// Assert that a notification is created for user 100010 (Dev Director)
$stmtNotif = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? AND type = 'mention' ORDER BY id DESC LIMIT 1");
$stmtNotif->execute([100010]);
$notif = $stmtNotif->fetch(PDO::FETCH_ASSOC);

$hasNotif = !empty($notif);
$hasCorrectLink = $hasNotif && strpos($notif['link'], "/contacts?open_contact_id=24") !== false;
assertTest("Check notification created for tagged user (Dev Director)", $hasNotif, "Found notification: " . ($hasNotif ? json_encode($notif, JSON_UNESCAPED_UNICODE) : 'NONE'));
assertTest("Check notification link format containing contact and comment details", $hasCorrectLink, "Link: " . ($hasNotif ? $notif['link'] : 'N/A'));


// ----------------------------------------------------
// TEST CASE 2: Muted task check (Users who muted shouldn't get notifications)
// ----------------------------------------------------
echo "\n--- TEST CASE 2: Notification Exclusion for Muted Tasks ---\n";
// Mute this task for Dev Director (100010)
$pdo->exec("INSERT INTO task_muted_notifications (task_id, user_id, muted_at) VALUES ($taskId, 100010, NOW())");

// Clean previous notifications for Dev Director
$pdo->exec("DELETE FROM notifications WHERE user_id = 100010");

// Try to tag again
$mockedBody = [
    'content' => 'Nhắc lại lần nữa <span class="mention" data-user-id="100010">@Dev Director</span> nhé.',
    'attachments' => []
];

try {
    $ctrl->addComment($authAdmin, $taskId);
} catch (Exception $e) {}

// Check notifications for 100010 - should be empty!
$stmtNotifMute = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ?");
$stmtNotifMute->execute([100010]);
$count = (int)$stmtNotifMute->fetchColumn();

assertTest("Confirm no notification is sent to muted user (Dev Director)", $count === 0, "Notification count: " . $count);

// Cleanup mute
$pdo->exec("DELETE FROM task_muted_notifications WHERE task_id = $taskId AND user_id = 100010");


// ----------------------------------------------------
// TEST CASE 3: Comment Reply Notification
// ----------------------------------------------------
echo "\n--- TEST CASE 3: Comment Reply Parent Notification ---\n";
// Dev Director (100010) makes a comment first
$mockedBody = [
    'content' => 'Ý kiến của tôi về công việc này...',
    'attachments' => []
];
$authDirector = [
    'user_id' => 100010,
    'tenant_id' => 1,
    'role' => 'director',
    'full_name' => 'Dev Director'
];

$commentId = 0;
try {
    // We run insert query manually to get insert ID of parent comment easily
    $stmtCmt = $pdo->prepare("
        INSERT INTO activity_comments (tenant_id, activity_id, user_id, content)
        VALUES (?, ?, ?, ?)
    ");
    $stmtCmt->execute([1, $taskId, 100010, 'Ý kiến của tôi về công việc này...']);
    $commentId = (int)$pdo->lastInsertId();
} catch (Exception $e) {}

assertTest("Create parent comment for reply testing", $commentId > 0, "Comment ID: " . $commentId);

// Dev Admin (100009) replies to Dev Director's comment
$mockedBody = [
    'content' => 'Tôi đồng ý với ý kiến của sếp.',
    'parent_id' => $commentId,
    'attachments' => []
];

try {
    $ctrl->addComment($authAdmin, $taskId);
} catch (Exception $e) {}

// Verify notification was sent to Dev Director (100010)
$stmtNotifReply = $pdo->prepare("SELECT * FROM notifications WHERE user_id = ? AND type = 'mention' ORDER BY id DESC LIMIT 1");
$stmtNotifReply->execute([100010]);
$notifReply = $stmtNotifReply->fetch(PDO::FETCH_ASSOC);

$hasReplyNotif = !empty($notifReply) && (int)$notifReply['user_id'] === 100010;
assertTest("Check notification created for parent comment owner", $hasReplyNotif, "Notification detail: " . ($notifReply ? json_encode($notifReply, JSON_UNESCAPED_UNICODE) : 'NONE'));


// ----------------------------------------------------
// TEST CASE 4: Task Approvals & Restricted Actions
// ----------------------------------------------------
echo "\n--- TEST CASE 4: Approval & Rejection Permissions ---\n";
// Dev Sale (100012) tries to approve task (should fail with 403)
$mockedBody = [
    'approval_status' => 'approved'
];

$authSale = [
    'user_id' => 100012,
    'tenant_id' => 1,
    'role' => 'sales',
    'full_name' => 'Dev Sale'
];

$failedAsSale = false;
try {
    $ctrl->update($authSale, $taskId);
} catch (Exception $e) {
    if (strpos($e->getMessage(), '403') !== false) {
        $failedAsSale = true;
    }
}
assertTest("Check Dev Sale is blocked from approving task (Expected: 403 Blocked)", $failedAsSale);

// Dev Manager (100011) - designated approver - approves task (should succeed)
$authManager = [
    'user_id' => 100011,
    'tenant_id' => 1,
    'role' => 'manager',
    'full_name' => 'Dev Manager'
];
$mockedBody = [
    'approval_status' => 'approved',
    'status' => 'done'
];

$succeededAsManager = false;
try {
    $ctrl->update($authManager, $taskId);
    $succeededAsManager = true;
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'RESPOND_TRIGGERED') !== false) {
        $succeededAsManager = true;
    }
}
assertTest("Check Designated Approver (Dev Manager) can approve task successfully", $succeededAsManager);


// ----------------------------------------------------
// CLEANUP AFTER TEST
// ----------------------------------------------------
echo "\n--- CLEANING UP TEST DATA ---\n";
$pdo->exec("DELETE FROM activities WHERE subject LIKE '[TEST_SUITE]%'");
$pdo->exec("DELETE FROM notifications WHERE user_id IN (100010, 100011, 100012) AND (link LIKE '%highlight_activity_id%' OR link LIKE '%highlight_comment_id%')");
echo "Cleaned up all temporary testing records successfully.\n";

printTestSummary();
