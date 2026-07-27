<?php
// backend/seed_demo_approvals.php
// Script to seed persistent real workflow/approval demo database records
define('DIAG_TOKEN', true);
require_once __DIR__ . '/test_bootstrap.php';

echo "=== SEEDING REAL DEMO APPROVALS DATABASE RECORDS ===\n\n";

try {
    // Clean up any existing demo records for Dev Admin (100009) to avoid duplicates or mess
    $pdo->exec("DELETE FROM hrm_leave_requests WHERE user_id = 100009");
    $pdo->exec("DELETE FROM hrm_salary_advances WHERE user_id = 100009");
    $pdo->exec("DELETE FROM expenses WHERE created_by = 100009");
    $pdo->exec("DELETE FROM check_ins WHERE user_id = 100009 AND check_in_date = '2026-07-27'");

    // 1. Seed Leave Request
    $stmt1 = $pdo->prepare("
        INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status, approver_id, status_level_1, status_level_2, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt1->execute([
        100009, // Dev Admin
        'annual',
        '2026-08-01 00:00:00',
        '2026-08-02 23:59:59',
        2.0,
        'Nghỉ phép năm đi du lịch cùng gia đình',
        'pending',
        100010, // Dev Director
        'pending',
        'pending'
    ]);
    echo "✓ Seeded hrm_leave_requests record successfully.\n";

    // 2. Seed Salary Advance
    $stmt2 = $pdo->prepare("
        INSERT INTO hrm_salary_advances (user_id, amount, request_date, reason, status, approver_id, status_level_1, status_level_2, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt2->execute([
        100009, // Dev Admin
        10000000.00,
        '2026-07-27',
        'Tạm ứng mua sắm vật tư văn phòng chi nhánh',
        'pending',
        100010, // Dev Director
        'pending',
        'pending'
    ]);
    echo "✓ Seeded hrm_salary_advances record successfully.\n";

    // 3. Seed Expense Proposal - "Chi phí tiếp khách đối tác"
    $stmt3 = $pdo->prepare("
        INSERT INTO expenses (tenant_id, created_by, approver_id, title, category, amount, date, status, notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    ");
    $stmt3->execute([
        1,
        100009, // Dev Admin
        100010, // Dev Director
        'Chi phí tiếp khách đối tác',
        'Vận hành',
        2500000.00,
        '2026-07-27',
        'pending',
        'Mời cơm trưa đối tác quan trọng tại nhà hàng Grand Marina'
    ]);
    echo "✓ Seeded expenses (Chi phí tiếp khách đối tác) record successfully.\n";

    // 4. Seed Expense Proposal - "Mua sắm trang thiết bị"
    $stmt3->execute([
        1,
        100009, // Dev Admin
        100010, // Dev Director
        'Mua sắm trang thiết bị',
        'Vận hành',
        1500000.00,
        '2026-07-27',
        'pending',
        'Mua chuột và bàn phím cơ văn phòng làm việc'
    ]);
    echo "✓ Seeded expenses (Mua sắm trang thiết bị) record successfully.\n";

    // 5. Seed Check-in Explanation
    $stmt4 = $pdo->prepare("
        INSERT INTO check_ins (user_id, check_in_date, check_in_time, late_minutes, reason, status)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
            check_in_time = VALUES(check_in_time),
            late_minutes = VALUES(late_minutes),
            reason = VALUES(reason),
            status = VALUES(status)
    ");
    $stmt4->execute([
        100009, // Dev Admin
        '2026-07-27',
        '09:00:00',
        60,
        'Đi trễ 60 phút do kẹt xe nghiêm trọng tại cầu Kênh Tẻ',
        'pending_approval'
    ]);
    echo "✓ Seeded check_ins record successfully.\n";

    echo "\n🎉 ALL DEMO RECORDS SEEDED SUCCESSFULLY INTO DATABASE FOR DEV ADMIN!\n";

} catch (Throwable $e) {
    echo "❌ ERROR: " . $e->getMessage() . "\n";
}
