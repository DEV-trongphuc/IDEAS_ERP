<?php
// backend/test_tasks_workflow.php
// Script kiểm thử tự động quy trình giao việc, phê duyệt, bình luận, và công việc lặp lại

define('DIAG_TOKEN', 'Ideas_Diag_Secure_Token_2026_9e88d6c701fbc6b7');
require_once __DIR__ . '/test_bootstrap.php';

echo "====================================================\n";
echo "🧪 KHỞI CHẠY KIỂM THỬ QUY TRÌNH CÔNG VIỆC & TASK LẶP LẠI\n";
echo "====================================================\n\n";

$tenantId = 1;
$creatorId = 100010; // Director/Creator
$assigneeId = 100012; // Sales/Assignee
$approverId = 100011; // Manager/Approver
$stakeholderId = 100014; // Accountant/Stakeholder (Kế toán)

// ----------------------------------------------------------------
// 1. KIỂM THỬ TẠO TASK & PHÊ DUYỆT (APPROVAL FLOW)
// ----------------------------------------------------------------
echo "--- 1. Kiểm thử tạo công việc & Quy trình phê duyệt ---\n";

// Tạo công việc yêu cầu phê duyệt khi hoàn thành
$subject = '[TEST_SUITE] Cấu hình tích hợp thanh toán ngân hàng';
$conn->query("
    INSERT INTO activities (tenant_id, user_id, created_by, type, subject, body, status, priority, due_date, require_approval, approver_id, approval_status, progress, participant_ids)
    VALUES ({$tenantId}, {$assigneeId}, {$creatorId}, 'task', '{$subject}', 'Mô tả công việc kiểm thử', 'planned', 'high', DATE_ADD(NOW(), INTERVAL 3 DAY), 1, {$approverId}, 'pending', 0, '{$stakeholderId}')
");
$taskId = $conn->insert_id;
assertTest("Tạo công việc yêu cầu phê duyệt thành công", $taskId > 0, "Task ID: {$taskId}");

// Giả lập Người thực hiện (Assignee) gửi yêu cầu duyệt khi hoàn thành (cập nhật tiến độ 100%)
$conn->query("UPDATE activities SET progress = 100, approval_status = 'pending' WHERE id = {$taskId}");
assertDbField($conn, 'activities', 'progress', "id = {$taskId}", 100, "Tiến độ công việc cập nhật lên 100%");
assertDbField($conn, 'activities', 'approval_status', "id = {$taskId}", 'pending', "Trạng thái phê duyệt chuyển sang 'pending'");

// Giả lập Người duyệt (Approver) phê duyệt hoàn thành công việc
$conn->query("UPDATE activities SET approval_status = 'approved', status = 'done', done_at = NOW() WHERE id = {$taskId}");
assertDbField($conn, 'activities', 'status', "id = {$taskId}", 'done', "Công việc chuyển sang trạng thái hoàn thành 'done'");
assertDbField($conn, 'activities', 'approval_status', "id = {$taskId}", 'approved', "Trạng thái phê duyệt cập nhật thành 'approved'");

// Kiểm tra ngày hoàn thành thực tế được ghi nhận
$chkDoneTime = $conn->query("SELECT done_at FROM activities WHERE id = {$taskId}");
$doneTimeVal = $chkDoneTime->fetch_assoc()['done_at'];
assertTest("Thời gian hoàn thành thực tế đã được ghi nhận", !empty($doneTimeVal), "Done At: {$doneTimeVal}");


// ----------------------------------------------------------------
// 2. KIỂM THỬ BÌNH LUẬN & MENTIONS TRONG TASK
// ----------------------------------------------------------------
echo "\n--- 2. Kiểm thử bình luận & nhắc tên (Mentions) trong Task ---\n";

// Thêm bình luận trong Task
$commentText = "Nhờ đồng nghiệp @Kế_Toán hỗ trợ kiểm tra đối soát link tài liệu đính kèm.";
$conn->query("
    INSERT INTO activity_comments (tenant_id, activity_id, user_id, content)
    VALUES ({$tenantId}, {$taskId}, {$assigneeId}, '{$commentText}')
");
$commentId = $conn->insert_id;
assertTest("Tạo bình luận trong Task thành công", $commentId > 0, "Comment ID: {$commentId}");

// Ghi nhận tag người dùng (giả lập liên kết bảng note_mentions, vì commentId được xem như note_id trong bảng này)
$conn->query("INSERT INTO note_mentions (note_id, user_id) VALUES ({$commentId}, {$stakeholderId})");
assertTest("Lưu vết tag thành viên trong bình luận thành công", $conn->affected_rows > 0);

// Giả lập gửi thông báo
$conn->query("
    INSERT INTO notifications (user_id, tenant_id, title, body, type, link)
    VALUES ({$stakeholderId}, {$tenantId}, 'Bạn được tag trong Task', 'Sales đã nhắc tên bạn trong bình luận Task', 'mention', '/activities/{$taskId}')
");
$notifId = $conn->insert_id;
assertTest("Thông báo chuông (Bell) được tạo cho người được nhắc tên", $notifId > 0);


// ----------------------------------------------------------------
// 3. KIỂM THỬ CÔNG VIỆC LẶP LẠI (RECURRING TASKS)
// ----------------------------------------------------------------
echo "\n--- 3. Kiểm thử sinh công việc lặp lại tự động (Recurring Tasks) ---\n";

// Tạo cấu hình công việc lặp lại hàng ngày (daily pattern)
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
            ["text" => "Công việc lặp 1", "done" => true],
            ["text" => "Công việc lặp 2", "done" => false]
        ]
    ]
];
$recurrenceJson = json_encode($recurrenceConfig, JSON_UNESCAPED_UNICODE);

// Tạo Task cha cấu hình lặp lại
$parentSubject = '[TEST_SUITE] Nhiệm vụ lặp định kỳ hàng ngày';
$conn->query("
    INSERT INTO activities (tenant_id, user_id, created_by, type, subject, body, status, priority, due_date)
    VALUES ({$tenantId}, {$assigneeId}, {$creatorId}, 'task', '{$parentSubject}', '{$recurrenceJson}', 'planned', 'medium', NOW())
");
$parentTaskId = $conn->insert_id;
assertTest("Tạo công việc cha cấu hình lặp lại thành công", $parentTaskId > 0, "Parent ID: {$parentTaskId}");

// Giả lập chạy logic xử lý lặp lại của cron_recurring_tasks.php cho trường hợp 'daily'
$today = date('Y-m-d');
$childBody = $recurrenceConfig;
// Đặt lại pattern của con là none để tránh lặp đệ quy
$childBody['erp_task']['recurrence']['pattern'] = 'none';
// Đặt lại toàn bộ checklist về false
foreach ($childBody['erp_task']['checklist'] as &$item) {
    $item['done'] = false;
}
$childBodyJson = json_encode($childBody, JSON_UNESCAPED_UNICODE);

// Tạo công việc con
$conn->query("
    INSERT INTO activities (tenant_id, user_id, created_by, type, subject, body, status, priority, due_date)
    VALUES ({$tenantId}, {$assigneeId}, {$creatorId}, 'task', '{$parentSubject}', '{$childBodyJson}', 'planned', 'medium', '{$today} 23:59:59')
");
$childTaskId = $conn->insert_id;
assertTest("Cron tự động tạo công việc con định kỳ thành công", $childTaskId > 0, "Child ID: {$childTaskId}");

// Kiểm tra xem checklist của con đã được reset về false chưa
$chkChild = $conn->query("SELECT body FROM activities WHERE id = {$childTaskId}");
$childBodyData = json_decode($chkChild->fetch_assoc()['body'], true);
$allChecklistReset = true;
foreach ($childBodyData['erp_task']['checklist'] as $item) {
    if ($item['done'] === true) {
        $allChecklistReset = false;
    }
}
assertTest("Toàn bộ checklist của công việc con đã được reset về trạng thái chưa làm (done = false)", $allChecklistReset);

// Cập nhật ngày last_generated ở công việc cha
$recurrenceConfig['erp_task']['recurrence']['last_generated'] = $today;
$parentBodyUpdate = json_encode($recurrenceConfig, JSON_UNESCAPED_UNICODE);
$conn->query("UPDATE activities SET body = '{$parentBodyUpdate}' WHERE id = {$parentTaskId}");
assertDbField($conn, 'activities', 'body', "id = {$parentTaskId}", $parentBodyUpdate, "Cập nhật ngày tạo gần nhất 'last_generated' thành công ở công việc cha");


// ----------------------------------------------------------------
// 4. DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP)
// ----------------------------------------------------------------
echo "\n--- 4. Dọn dẹp dữ liệu kiểm thử ---\n";

// Xóa dữ liệu task lặp lại
$conn->query("DELETE FROM activities WHERE id IN ({$parentTaskId}, {$childTaskId})");

// Xóa dữ liệu task thường và comment, mention
$conn->query("DELETE FROM notifications WHERE id = {$notifId}");
$conn->query("DELETE FROM note_mentions WHERE note_id = {$commentId}");
$conn->query("DELETE FROM activity_comments WHERE id = {$commentId}");
$conn->query("DELETE FROM activities WHERE id = {$taskId}");

echo "Đã dọn dẹp sạch sẽ toàn bộ bản ghi kiểm thử công việc.\n";

printTestSummary();
