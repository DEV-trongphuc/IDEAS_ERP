<?php
// backend/scratch/test_lead_distribution_tweak.php
// Script kiểm thử khép kín logic phân phối lead mới sau khi điều chỉnh:
// 1. Tự động nhận thẳng cho Sale (require_lead_claim = 0)
// 2. Không cần chấm công vẫn nhận được (require_checkin_lead = 0)
// 3. Thông báo Zalo & Email có đầy đủ thông tin chi tiết và định dạng chuẩn

header('Content-Type: text/plain; charset=utf-8');
require_once __DIR__ . '/../test_bootstrap.php';

echo "=== BẮT ĐẦU CHẠY THỬ NGHIỆM ĐỐI SOÁT PHÂN PHỐI LEAD ===\n\n";

// 1. Cập nhật thiết lập CSDL Staging thực tế theo yêu cầu người dùng
$conn->query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('require_lead_claim', '0') 
              ON DUPLICATE KEY UPDATE setting_value = '0'");
$conn->query("INSERT INTO system_settings (setting_key, setting_value) VALUES ('require_checkin_lead', '0') 
              ON DUPLICATE KEY UPDATE setting_value = '0'");

assertDbField($conn, 'system_settings', 'setting_value', "setting_key = 'require_lead_claim'", '0', "Thiết lập require_lead_claim = 0 (Tự động nhận thẳng)");
assertDbField($conn, 'system_settings', 'setting_value', "setting_key = 'require_checkin_lead'", '0', "Thiết lập require_checkin_lead = 0 (Bỏ qua chấm công)");

// 2. Khởi tạo dữ liệu giả lập cho TVV test
$testEmail = 'test_tweak_' . time() . '@ideas-erp.vn';
$testName = 'TVV Test Tweak ' . time();
$testUsername = 'test_tweak_' . time();

$workScheduleJson = json_encode([
    "1" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "2" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "3" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "4" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "5" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "6" => ["active" => true, "start" => "00:00", "end" => "23:59"],
    "7" => ["active" => true, "start" => "00:00", "end" => "23:59"]
]);

// Tạo user tài khoản (chính là consultant thông qua VIEW)
$stmtUser = $conn->prepare("INSERT INTO users (email, username, full_name, role, status, vacation_mode, work_start_time, work_end_time, work_schedule, tenant_id, zalo_chat_id) VALUES (?, ?, ?, 'sales', 'active', 0, '00:00', '23:59', ?, 1, 'test_chat_id_123')");
$stmtUser->bind_param("ssss", $testEmail, $testUsername, $testName, $workScheduleJson);
$stmtUser->execute();
$userId = $conn->insert_id;
$stmtUser->close();

$consultantId = $userId;

echo "-> Đã giả lập TVV thử nghiệm: ID {$consultantId} - {$testName} (Trạng thái Active, 00:00-23:59, chưa chấm công hôm nay)\n";

// 3. Thực thi kiểm định Cổng kiểm duyệt Gate 2
$gateResult = checkConsultantGates($conn, $consultantId);
$passed = ($gateResult === true);

assertTest("TVV chưa chấm công phải VƯỢT QUA Gate 2 khi require_checkin_lead = 0", $passed, "Kết quả thực tế: " . var_export($gateResult, true));

// 4. Kiểm tra giả lập bắn Lead mới và xem có tự động nhận ngay không
$leadPhone = '0988' . rand(100000, 999999);
$leadData = [
    'name' => 'Khách Hàng Test Tweak',
    'phone' => $leadPhone,
    'email' => 'test_tweak_' . time() . '@test.com',
    'source' => 'Google Form',
    'type' => 'hot',
    'note' => 'Cần hỗ trợ ngay',
    'campaign_id' => '1',
    'campaign_name' => 'Chiến dịch test'
];

// Tạo lead qua hàm insertLead
$leadId = insertLead($conn, $leadData, $consultantId, $leadData['phone'], $leadData['email'], $leadData['name'], $leadData['source'], $leadData['type'], $leadData['note']);

if ($leadId > 0) {
    // Kiểm tra trạng thái is_accepted
    assertDbField($conn, 'leads', 'is_accepted', "id = {$leadId}", 1, "Lead mới phân phối phải có is_accepted = 1 ngay lập tức (Không bắt bấm nhận)");
    assertDbField($conn, 'leads', 'assigned_to', "id = {$leadId}", $consultantId, "Lead mới phân phối được gán chính xác về Sale thử nghiệm");

    // 5. Kiểm thử việc sinh nội dung thông báo không phát sinh lỗi
    $zaloOk = false;
    try {
        require_once __DIR__ . '/../zalo_bot.php';
        sendLeadAssignedZaloMessageToSale($consultantId, $testName, $leadData['name'], $leadData['phone'], $leadData['note'], $leadData['source'], 'Vòng Test', $leadId, 1, $leadData['email'], $leadData['type']);
        $zaloOk = true;
    } catch (Throwable $t) {
        error_log("Error in sendLeadAssignedZaloMessageToSale: " . $t->getMessage());
    }
    assertTest("Hàm sendLeadAssignedZaloMessageToSale chạy thành công không phát sinh lỗi", $zaloOk);

    $emailOk = false;
    try {
        require_once __DIR__ . '/../mailer.php';
        sendLeadAssignedEmailToSale($testEmail, $testName, $leadData['name'], $leadData['phone'], $leadData['note'], $leadData['source'], '', 'Vòng Test', $leadId, $consultantId, 1);
        $emailOk = true;
    } catch (Throwable $t) {
        error_log("Error in sendLeadAssignedEmailToSale: " . $t->getMessage());
    }
    assertTest("Hàm sendLeadAssignedEmailToSale chạy thành công không phát sinh lỗi", $emailOk);

} else {
    assertTest("Tạo lead mới thành công", false, "Hàm insertLead trả về lỗi");
}

// 6. Dọn dẹp dữ liệu giả lập
$conn->query("DELETE FROM leads WHERE id = {$leadId}");
$conn->query("DELETE FROM users WHERE id = {$userId}");
echo "-> Đã dọn dẹp dữ liệu giả lập.\n";

printTestSummary();
