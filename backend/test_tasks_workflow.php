<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

define('DIAG_TOKEN', 'Ideas_Diag_Secure_Token_2026_9e88d6c701fbc6b7');
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/controllers/ActivityController.php';

// Helper respond override to capture controller outputs in memory
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
    function logActivity($db, $tid, $uid, string $action, ?string $resource = null, $resourceId = null, ?string $data = null): void {
        // Mocked logActivity for testing environment
    }
}

echo "====================================================\n";
echo "🧪 KHỞI CHẠY KIỂM THỬ TÍCH HỢP QUY TRÌNH TASK & PHÊ DUYỆT\n";
echo "====================================================\n\n";

$tenantId = 1;
$adminId = 100010; // Director
$managerId = 100011; // Manager (Designated Approver)
$salesId = 100012; // Sales
$accountantId = 100014; // Accountant
$marketingId = 100015; // Marketing (Invalid Approver for Sales)

$ctrl = new ActivityController($pdo);

// Clean up old test items
$pdo->exec("DELETE FROM activities WHERE subject LIKE '[TEST_SUITE]%'");
$pdo->exec("DELETE FROM notifications WHERE link LIKE '%activities/%'");

// ----------------------------------------------------------------
// 1. KIỂM THỬ TẠO TASK TỪ PAYLOAD GIẢ LẬP UI
// ----------------------------------------------------------------
echo "--- 1. Kiểm thử tạo công việc từ UI Payload ---\n";

global $mockedBody;
$mockedBody = [
    'subject' => '[TEST_SUITE] Cấu hình cổng kết nối Sheets API',
    'body' => 'Thiết lập Sheets API cho Richland',
    'type' => 'task',
    'user_id' => $salesId, // Giao cho Sales thực hiện
    'priority' => 'high',
    'due_date' => date('Y-m-d H:i:s', strtotime('+3 days')),
    'require_approval' => 1, // Yêu cầu phê duyệt
    'approver_id' => $managerId, // Người phê duyệt chỉ định: Manager
    'participant_ids' => (string)$accountantId, // Người liên quan: Accountant
    'progress' => 0,
    'link' => 'https://docs.google.com/document/d/test-sheets'
];

$authAdmin = [
    'user_id' => $adminId,
    'tenant_id' => $tenantId,
    'role' => 'director',
    'full_name' => 'Dev Director'
];

$taskId = 0;
try {
    $ctrl->store($authAdmin);
} catch (Exception $e) {
    if (strpos($e->getMessage(), 'RESPOND_TRIGGERED') !== false) {
        $jsonStr = str_replace('RESPOND_TRIGGERED: ', '', $e->getMessage());
        $resp = json_decode($jsonStr, true);
        $taskId = (int)($resp['data']['id'] ?? 0);
    } else {
        echo "Lỗi không xác định: " . $e->getMessage() . "\n";
    }
}

assertTest("UI Payload: Giao việc & Lưu Database thành công", $taskId > 0, "Task ID mới: " . $taskId);
assertDbField($conn, 'activities', 'progress', "id = {$taskId}", 0, "Tiến độ ban đầu là 0%");
assertDbField($conn, 'activities', 'approver_id', "id = {$taskId}", $managerId, "Người duyệt chỉ định đúng là Manager ({$managerId})");
assertDbField($conn, 'activities', 'link', "id = {$taskId}", $mockedBody['link'], "Đường dẫn đính kèm dán đúng");


// ----------------------------------------------------------------
// 2. KIỂM THỬ TIẾN ĐỘ CẬP NHẬT 100% & THAY ĐỔI TRẠNG THÁI TỰ ĐỘNG
// ----------------------------------------------------------------
echo "\n--- 2. Kiểm thử cập nhật tiến độ 100% từ UI ---\n";

$authSales = [
    'user_id' => $salesId,
    'tenant_id' => $tenantId,
    'role' => 'sales',
    'full_name' => 'Dev Sales'
];

$mockedBody = [
    'progress' => 100 // Cập nhật tiến độ 100% từ UI
];

try {
    $ctrl->update($authSales, $taskId);
} catch (Exception $e) {}

// Theo quy tắc, vì require_approval = 1 nên progress = 100 sẽ bắt buộc status = 'planned' (chưa được done) và approval_status = 'pending'
assertDbField($conn, 'activities', 'status', "id = {$taskId}", 'planned', "Hệ thống chặn không cho Sales tự ý hoàn thành, status giữ nguyên 'planned'");
assertDbField($conn, 'activities', 'approval_status', "id = {$taskId}", 'pending', "Trạng thái phê duyệt tự động chuyển sang 'pending'");


// ----------------------------------------------------------------
// 3. KIỂM THỬ PHÂN QUYỀN PHÊ DUYỆT (RBAC APPROVAL BLOCK)
// ----------------------------------------------------------------
echo "\n--- 3. Kiểm thử phân quyền phê duyệt (Chặn Sales duyệt) ---\n";

$mockedBody = [
    'approval_status' => 'approved' // Sales tự gửi phê duyệt cho chính mình
];

$approvalBlocked = false;
try {
    $ctrl->update($authSales, $taskId);
} catch (Exception $e) {
    if (strpos($e->getMessage(), '403') !== false) {
        $approvalBlocked = true;
    }
}
assertTest("Sales bị chặn không được tự phê duyệt công việc của mình", $approvalBlocked);


// ----------------------------------------------------------------
// 4. KIỂM THỬ PHÊ DUYỆT HỢP LỆ BỞI NGƯỜI DUYỆT ĐƯỢC CHỈ ĐỊNH
// ----------------------------------------------------------------
echo "\n--- 4. Kiểm thử phê duyệt hợp lệ bởi Người duyệt chỉ định ---\n";

$authManager = [
    'user_id' => $managerId,
    'tenant_id' => $tenantId,
    'role' => 'manager',
    'full_name' => 'Dev Manager'
];

$mockedBody = [
    'approval_status' => 'approved' // Manager duyệt approved
];

try {
    $ctrl->update($authManager, $taskId);
} catch (Exception $e) {}

assertDbField($conn, 'activities', 'approval_status', "id = {$taskId}", 'approved', "Trạng thái phê duyệt cập nhật thành 'approved'");
assertDbField($conn, 'activities', 'status', "id = {$taskId}", 'done', "Công việc tự động hoàn thành chuyển sang 'done'");


// ----------------------------------------------------------------
// 5. KIỂM THỬ CHECK TRƯỜNG CHỈ ĐỊNH NGƯỜI DUYỆT KHÔNG HỢP LỆ (RULE CHECK)
// ----------------------------------------------------------------
echo "\n--- 5. Kiểm thử lựa chọn Người duyệt không hợp lệ ---\n";

$mockedBody = [
    'subject' => '[TEST_SUITE] Công việc test người duyệt',
    'type' => 'task',
    'require_approval' => 1,
    'approver_id' => $marketingId // Sales chỉ định nhân viên Marketing duyệt (Sai quy tắc)
];

$approverValidationBlocked = false;
try {
    $ctrl->store($authSales);
} catch (Exception $e) {
    // Sẽ tạo ra lỗi khi cập nhật approver trái quy tắc
}

// Thử cập nhật approver_id qua API Update
$mockedBody = [
    'approver_id' => $marketingId // Cố tình đổi sang Marketing
];

try {
    $ctrl->update($authSales, $taskId);
} catch (Exception $e) {
    if (strpos($e->getMessage(), '403') !== false || strpos($e->getMessage(), 'Người phê duyệt phải là Admin') !== false) {
        $approverValidationBlocked = true;
    }
}
assertTest("Chặn thành công Sales chỉ định Người duyệt không có quyền (Marketing)", $approverValidationBlocked);


// ----------------------------------------------------------------
// 6. KIỂM THỬ CÔNG VIỆC LẶP LẠI (RECURRING CRON ENGINE)
// ----------------------------------------------------------------
echo "\n--- 6. Kiểm thử quy trình Công việc lặp lại (Recurring Cron) ---\n";

$recurrenceConfig = [
    "erp_task" => [
        "recurrence" => [
            "pattern" => "daily",
            "weekly_days" => [],
            "monthly_day" => 1,
            "days_interval" => 1,
            "last_generated" => ""
        ],
        "checklist" => [
            ["text" => "Kiểm tra hệ thống buổi sáng", "done" => true],
            ["text" => "Đối soát giao dịch", "done" => false]
        ]
    ]
];
$recurrenceJson = json_encode($recurrenceConfig, JSON_UNESCAPED_UNICODE);

// Tạo Task cha cấu hình lặp lại
$parentSubject = '[TEST_SUITE] Task định kỳ hàng ngày';
$conn->query("
    INSERT INTO activities (tenant_id, user_id, created_by, type, subject, body, status, priority, due_date)
    VALUES ({$tenantId}, {$salesId}, {$adminId}, 'task', '{$parentSubject}', '{$recurrenceJson}', 'planned', 'medium', NOW())
");
$parentTaskId = $conn->insert_id;
assertTest("Tạo công việc cha lặp lại thành công", $parentTaskId > 0, "Parent ID: {$parentTaskId}");

// Nhúng file cron và chạy
require_once __DIR__ . '/cron_recurring_tasks.php';
if (function_exists('runRecurringTasksCron')) {
    runRecurringTasksCron($conn);
}

// Đếm xem có công việc con nào được tạo ra hôm nay không
$chkChild = $conn->query("SELECT id, body, due_date FROM activities WHERE type = 'task' AND subject = '{$parentSubject}' AND id != {$parentTaskId} LIMIT 1");
$childRow = $chkChild && $chkChild->num_rows > 0 ? $chkChild->fetch_assoc() : null;

assertTest("Cron tự động nhận diện lịch và tạo Task con", !empty($childRow), "Child Task ID: " . ($childRow['id'] ?? 'NONE'));

if ($childRow) {
    $childBodyData = json_decode($childRow['body'], true);
    
    // Kiểm tra checklist của con được reset về false chưa
    $checklistOk = true;
    if (!empty($childBodyData['erp_task']['checklist'])) {
        foreach ($childBodyData['erp_task']['checklist'] as $chkItem) {
            if ($chkItem['done'] === true) {
                $checklistOk = false;
            }
        }
    }
    assertTest("Đã reset toàn bộ checklist của công việc con về done = false", $checklistOk);
    assertTest("Hạn chót (due_date) công việc con đặt là ngày hôm nay", strpos($childRow['due_date'], date('Y-m-d')) !== false, "Due date: " . $childRow['due_date']);
}

// Kiểm tra xem công việc cha có cập nhật ngày tạo gần nhất (last_generated) để tránh tạo lại trong ngày
$chkParentUpdate = $conn->query("SELECT body FROM activities WHERE id = {$parentTaskId}");
$parentBodyText = $chkParentUpdate->fetch_assoc()['body'];
$parentBodyData = json_decode($parentBodyText, true);
$lastGen = $parentBodyData['erp_task']['recurrence']['last_generated'] ?? '';
assertTest("Công việc cha cập nhật 'last_generated' thành công", $lastGen === date('Y-m-d'), "Last generated: " . $lastGen);


// ----------------------------------------------------------------
// 7. DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP)
// ----------------------------------------------------------------
echo "\n--- 7. Dọn dẹp dữ liệu kiểm thử ---\n";

// Xóa dữ liệu sinh ra bởi cron
if ($childRow) {
    $conn->query("DELETE FROM activities WHERE id = " . (int)$childRow['id']);
}
$conn->query("DELETE FROM activities WHERE id = {$parentTaskId}");
$conn->query("DELETE FROM activities WHERE id = {$taskId}");
$conn->query("DELETE FROM notifications WHERE user_id IN ({$salesId}, {$managerId}, {$accountantId}) AND link LIKE '%activities/%'");

echo "Đã dọn dẹp sạch sẽ toàn bộ bản ghi kiểm thử công việc.\n";

printTestSummary();
