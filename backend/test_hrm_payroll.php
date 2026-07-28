<?php
// backend/test_hrm_payroll.php
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/controllers/HRMController.php';
require_once __DIR__ . '/controllers/CheckInController.php';

header('Content-Type: text/plain; charset=utf-8');

echo "=== STARTING HRM & PAYROLL SYSTEM INTEGRATION TEST ===\n\n";

// Global statistics variable
$testStats = ['pass' => 0, 'fail' => 0];

// Mock getBody and respond functions
$mockPayload = [];
if (!function_exists('getBody')) {
    function getBody() {
        global $mockPayload;
        return $mockPayload;
    }
}

class RespondException extends Exception {
    public int $statusCode;
    public $responseData;
    public string $responseMsg;
    public bool $isSuccess;
    public function __construct(int $code, $data, string $msg, bool $success) {
        parent::__construct($msg, $code);
        $this->statusCode = $code;
        $this->responseData = $data;
        $this->responseMsg = $msg;
        $this->isSuccess = $success;
    }
}

$lastResponse = null;
if (!function_exists('respond')) {
    function respond(int $code, $data = null, string $message = '', bool $success = true): void {
        global $lastResponse;
        $lastResponse = [
            'code' => $code,
            'data' => $data,
            'message' => $message,
            'success' => $success
        ];
        throw new RespondException($code, $data, $message, $success);
    }
}

if (!function_exists('logActivity')) {
    function logActivity($db, $tid, $uid, string $action, ?string $resource = null, $resourceId = null, ?string $data = null): void {
        // Mock log activity in test harness
    }
}

// Test 1: Verify Table Schemas
$requiredTables = [
    'hrm_profiles',
    'hrm_contracts',
    'hrm_salary_advances',
    'hrm_leave_requests',
    'hrm_assets',
    'monthly_payslips'
];

foreach ($requiredTables as $tbl) {
    $res = $conn->query("SHOW TABLES LIKE '$tbl'");
    assertTest("Bảng CSDL '$tbl' tồn tại", $res && $res->num_rows > 0);
}

// Test 2: Verify Columns of hrm_profiles & monthly_payslips
$profileCols = [];
$res = $conn->query("SHOW COLUMNS FROM hrm_profiles");
while ($row = $res->fetch_assoc()) {
    $profileCols[] = $row['Field'];
}
assertTest("Cột 'annual_leave_total' có trong hrm_profiles", in_array('annual_leave_total', $profileCols));
assertTest("Cột 'annual_leave_used' có trong hrm_profiles", in_array('annual_leave_used', $profileCols));
assertTest("Cột 'compensatory_leave_total' có trong hrm_profiles", in_array('compensatory_leave_total', $profileCols));
assertTest("Cột 'compensatory_leave_used' có trong hrm_profiles", in_array('compensatory_leave_used', $profileCols));

$payslipCols = [];
$res = $conn->query("SHOW COLUMNS FROM monthly_payslips");
while ($row = $res->fetch_assoc()) {
    $payslipCols[] = $row['Field'];
}
assertTest("Cột 'overtime_days' có trong monthly_payslips", in_array('overtime_days', $payslipCols));
assertTest("Cột 'overtime_salary' có trong monthly_payslips", in_array('overtime_salary', $payslipCols));
assertTest("Cột 'diligence_bonus' có trong monthly_payslips", in_array('diligence_bonus', $payslipCols));

// Test 3: Run comprehensive scenario on dummy user
$testUserId = 99999;
$monthYear = '2026-07';

try {
    $pdo->exec("SET FOREIGN_KEY_CHECKS=0;");
    
    // Clear old data
    $pdo->prepare("DELETE FROM check_ins WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_leave_requests WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_salary_advances WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM monthly_payslips WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_profiles WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$testUserId]);

    // Insert dummy user
    $insUser = $pdo->prepare("
        INSERT INTO users (id, tenant_id, email, password_hash, full_name, role, is_active, work_start_time, work_end_time)
        VALUES (?, 1, 'test_hrm_employee@ideas.vn', 'no_hash', 'Test HRM Employee', 'sales', 1, '08:00:00', '17:30:00')
    ");
    $insUser->execute([$testUserId]);

    // Insert dummy profile with leave balances (12.0 total annual, 0.0 used)
    $insProfile = $pdo->prepare("
        INSERT INTO hrm_profiles (user_id, joined_date, base_salary, deal_salary, has_insurance, allowance_meal, allowance_travel, allowance_phone, kpi_target, annual_leave_total, annual_leave_used, compensatory_leave_total, compensatory_leave_used)
        VALUES (?, '2026-01-15', 10000000.00, 20000000.00, 1, 800000.00, 500000.00, 300000.00, 50000000.00, 12.0, 0.0, 5.0, 0.0)
    ");
    $insProfile->execute([$testUserId]);

    // Setup controllers
    $hrmCtrl = new HRMController($pdo);
    $checkInCtrl = new CheckInController($pdo);
    $authPayload = ['user_id' => $testUserId, 'role' => 'sales', 'tenant_id' => 1];
    $adminAuth = ['user_id' => 1, 'role' => 'admin', 'tenant_id' => 1];

    // --- CASE A: LEAVE DEDUCTION TEST ---
    // Create leave request: 2.0 days of type 'annual'
    $insLeave = $pdo->prepare("
        INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, status, approver_id, status_level_1, status_level_2)
        VALUES (?, 'annual', '2026-07-21 08:00:00', '2026-07-22 17:30:00', 2.0, 'pending', 1, 'pending', 'pending')
    ");
    $insLeave->execute([$testUserId]);
    $leaveId = $pdo->lastInsertId();

    // Approve the leave request
    $mockPayload = [
        'id' => $leaveId,
        'status' => 'approved',
        'note' => 'Duyệt phép năm'
    ];
    try {
        $hrmCtrl->approveLeave($adminAuth);
    } catch (RespondException $e) {}
    
    // Check if leave deduction occurred
    $profileStmt = $pdo->prepare("SELECT annual_leave_used FROM hrm_profiles WHERE user_id = ?");
    $profileStmt->execute([$testUserId]);
    $profile = $profileStmt->fetch();
    assertTest("Đã tự động khấu trừ 2.0 ngày phép năm khi được duyệt", (float)$profile['annual_leave_used'] === 2.0);


    // --- CASE B: AFTERNOON SHIFT LATENESS EXEMPTION ---
    // 1. Insert approved morning leave today
    $insMorningLeave = $pdo->prepare("
        INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, status)
        VALUES (?, 'annual', '2026-07-21 08:00:00', '2026-07-21 12:00:00', 0.5, 'approved')
    ");
    $insMorningLeave->execute([$testUserId]);

    // 2. Perform check-in at 13:00 (afternoon shift start is 13:30)
    $mockPayload = [
        'action' => 'checkin',
        'check_in_date' => '2026-07-21',
        'check_in_time' => '13:00:00',
        'is_supplementary' => 0
    ];
    try {
        $checkInCtrl->store($authPayload);
    } catch (RespondException $e) {}

    // 3. Verify late_minutes is 0 (not late)
    $checkInStmt = $pdo->prepare("SELECT late_minutes FROM check_ins WHERE user_id = ? AND check_in_date = '2026-07-21'");
    $checkInStmt->execute([$testUserId]);
    $checkInRow = $checkInStmt->fetch();
    assertTest("Check-in ca chiều (13:00) trước 13:30 khi có phép sáng không bị tính trễ", (int)$checkInRow['late_minutes'] === 0, "Trễ thực tế: " . $checkInRow['late_minutes'] . " phút");


    // --- CASE C: AFTERNOON SHIFT EARLY CHECK-OUT EXEMPTION ---
    // 1. Insert approved afternoon leave today
    $insAfternoonLeave = $pdo->prepare("
        INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, status)
        VALUES (?, 'annual', '2026-07-21 13:30:00', '2026-07-21 17:30:00', 0.5, 'approved')
    ");
    $insAfternoonLeave->execute([$testUserId]);

    // 2. Perform check-out at 16:30 (work end time is 17:30)
    $mockPayload = [
        'action' => 'checkout',
        'check_in_date' => '2026-07-21',
        'check_in_time' => '16:30:00',
        'is_supplementary' => 0
    ];
    try {
        $checkInCtrl->store($authPayload);
    } catch (RespondException $e) {}

    // 3. Verify early_minutes is 0
    $checkOutStmt = $pdo->prepare("SELECT early_minutes FROM check_ins WHERE user_id = ? AND check_in_date = '2026-07-21'");
    $checkOutStmt->execute([$testUserId]);
    $checkOutRow = $checkOutStmt->fetch();
    assertTest("Check-out ca chiều sớm (16:30) khi có phép chiều không bị tính về sớm", (int)$checkOutRow['early_minutes'] === 0, "Về sớm thực tế: " . $checkOutRow['early_minutes'] . " phút");


    // --- CASE D: OVERTIME & DILIGENCE PAYROLL CALCULATION ---
    // 1. Clear check-ins and mock 26 days of on-time attendance
    $pdo->prepare("DELETE FROM check_ins WHERE user_id = ?")->execute([$testUserId]);
    for ($d = 1; $d <= 26; $d++) {
        $dayStr = sprintf('%02d', $d);
        $pdo->prepare("
            INSERT INTO check_ins (user_id, check_in_date, check_in_time, status, late_minutes, early_minutes)
            VALUES (?, '2026-07-{$dayStr}', '08:00:00', 'approved', 0, 0)
        ")->execute([$testUserId]);
    }

    // 2. Add approved overtime request: 3.0 days
    $pdo->prepare("
        INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, status)
        VALUES (?, 'overtime', '2026-07-27 08:00:00', '2026-07-29 17:30:00', 3.0, 'approved')
    ")->execute([$testUserId]);

    // 3. Run calculatePayroll
    $mockPayload = [
        'month_year' => $monthYear,
        'work_days_required' => 26
    ];
    try {
        $hrmCtrl->calculatePayroll($adminAuth);
    } catch (RespondException $e) {}

    // 4. Query generated payslip and assert results
    $payslipStmt = $pdo->prepare("SELECT * FROM monthly_payslips WHERE user_id = ? AND month_year = ?");
    $payslipStmt->execute([$testUserId, $monthYear]);
    $payslip = $payslipStmt->fetch();

    assertTest("Đã ghi nhận 3.0 ngày tăng ca vào bảng lương", (float)$payslip['overtime_days'] === 3.0);
    
    // Overtime Salary: (deal_salary / 26) * 3 * 1.5 -> (20,000,000 / 26) * 3 * 1.5 = 1,153,846.15
    $expectedOtSalary = (20000000.00 / 26) * 3.0 * 1.5;
    assertTest("Tính toán lương tăng ca chính xác (1.5x)", round((float)$payslip['overtime_salary'], 2) === round($expectedOtSalary, 2), "Lương tăng ca thực tế: " . $payslip['overtime_salary']);

    // Diligence Bonus: 500,000 VND since they worked 26 days and had 0 lateness minutes
    assertTest("Thưởng chuyên cần 500,000 VND được cộng tự động", (float)$payslip['diligence_bonus'] === 500000.00);

    // PIT Tax should account for overtime salary and diligence bonus!
    assertTest("Bảng lương được lưu thành công dạng bản nháp (draft)", $payslip['status'] === 'draft');


    // --- CLEAN UP ---
    $pdo->prepare("DELETE FROM check_ins WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_leave_requests WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_salary_advances WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM monthly_payslips WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM hrm_profiles WHERE user_id = ?")->execute([$testUserId]);
    $pdo->prepare("DELETE FROM users WHERE id = ?")->execute([$testUserId]);

    $pdo->exec("SET FOREIGN_KEY_CHECKS=1;");
    assertTest("Đã dọn dẹp dữ liệu kiểm thử an toàn", true);

} catch (Throwable $e) {
    try { $pdo->exec("SET FOREIGN_KEY_CHECKS=1;"); } catch(Throwable $ex) {}
    echo "❌ LỖI TRONG QUÁ TRÌNH KIỂM THỬ: " . $e->getMessage() . "\n";
    echo $e->getTraceAsString() . "\n";
    assertTest("Toàn bộ quy trình kiểm thử hoàn tất không có ngoại lệ", false);
}

printTestSummary();
