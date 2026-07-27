<?php
// backend/seed_demo_data.php
// Seeder script to insert high-fidelity demo data into database for UI testing

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

$secretKey = $_REQUEST['key'] ?? '';
if ($secretKey !== 'Ideas2026') {
    http_response_code(403);
    echo json_encode(["error" => "Unauthorized. Invalid secret key."]);
    exit;
}

try {
    // Enable error reporting
    mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

    // Disable foreign key checks temporarily to clean up
    $conn->query("SET FOREIGN_KEY_CHECKS = 0");

    // Clean up existing data for Tenant 1 (demo tenant) or related to demo users
    $conn->query("DELETE FROM pipeline_stages WHERE tenant_id = 1");
    $conn->query("DELETE FROM deposit_milestones WHERE deposit_id IN (SELECT id FROM deposits WHERE created_by IN (100009, 100010, 100011, 100012, 100013, 100014, 100015))");
    $conn->query("DELETE FROM deposits WHERE created_by IN (100009, 100010, 100011, 100012, 100013, 100014, 100015)");
    $conn->query("DELETE FROM deals WHERE tenant_id = 1");
    $conn->query("DELETE FROM contacts WHERE tenant_id = 1");
    $conn->query("DELETE FROM projects WHERE tenant_id = 1");
    $conn->query("DELETE FROM expenses WHERE tenant_id = 1");
    $conn->query("DELETE FROM check_ins WHERE user_id IN (100009, 100010, 100011, 100012, 100013, 100014, 100015)");
    $conn->query("DELETE FROM hrm_leave_requests WHERE user_id IN (100009, 100010, 100011, 100012, 100013, 100014, 100015)");
    $conn->query("DELETE FROM activities WHERE tenant_id = 1");

    // Re-enable foreign key checks
    $conn->query("SET FOREIGN_KEY_CHECKS = 1");

    $today = date('Y-m-d');
    $yesterday = date('Y-m-d', strtotime('-1 day'));
    $prev2days = date('Y-m-d', strtotime('-2 days'));
    $prev3days = date('Y-m-d', strtotime('-3 days'));
    $prev4days = date('Y-m-d', strtotime('-4 days'));

    // 0. Pipeline Stages
    $conn->query("INSERT INTO pipeline_stages (id, tenant_id, name, system_slug, order_index, is_won, is_lost) VALUES 
        (1, 1, 'Chưa xác định', 'chua_xac_dinh', 10, 0, 0),
        (2, 1, 'Quan tâm', 'quan_tam', 20, 0, 0),
        (3, 1, 'Đồng ý gặp', 'dong_y_gap', 30, 0, 0),
        (4, 1, 'Đã gặp', 'da_gap', 40, 0, 0),
        (5, 1, 'Booking', 'booking', 50, 0, 0),
        (6, 1, 'Đặt cọc', 'dat_coc', 60, 0, 0),
        (7, 1, 'Đóng deal', 'dong_deal', 70, 1, 0)
    ON DUPLICATE KEY UPDATE name=VALUES(name)");

    // 1. Projects
    $conn->query("INSERT INTO projects (id, tenant_id, name, code, status, description) VALUES 
        (1, 1, 'Vinhomes Grand Park', 'VHGP', 'active', 'Khu đô thị thông minh đẳng cấp quốc tế'),
        (2, 1, 'Grand Marina Saigon', 'GMS', 'active', 'Dự án bất động sản hàng hiệu Marriott lớn nhất thế giới'),
        (3, 1, 'The Metropole Thu Thiem', 'TMTT', 'active', 'Khu phức hợp nhà ở - thương mại cao cấp tại Bán đảo Thủ Thiêm')
    ON DUPLICATE KEY UPDATE name=VALUES(name)");

    // 2. Contacts
    $conn->query("INSERT INTO contacts (id, tenant_id, first_name, last_name, email, phone, status, pipeline_status, owner_id, created_by, project_id) VALUES 
        (101, 1, 'Văn A', 'Nguyễn', 'client.a@gmail.test', '0912345678', 'customer', 'dat_coc', 100012, 100012, 1),
        (102, 1, 'Thị B', 'Trần', 'client.b@gmail.test', '0987654321', 'lead', 'booking', 100012, 100012, 2),
        (103, 1, 'Văn C', 'Phạm', 'client.c@gmail.test', '0905123456', 'lead', 'da_gap', 100012, 100012, 3),
        (104, 1, 'Văn D', 'Lê', 'client.d@gmail.test', '0934123456', 'lead', 'quan_tam', 100015, 100015, 1),
        (105, 1, 'Thị E', 'Hoàng', 'client.e@gmail.test', '0978123456', 'lead', 'booking', 100015, 100015, 2)
    ON DUPLICATE KEY UPDATE first_name=VALUES(first_name), last_name=VALUES(last_name)");

    // 3. Deals
    $conn->query("INSERT INTO deals (id, tenant_id, contact_id, title, value, stage_id, owner_id, created_by) VALUES 
        (201, 1, 101, 'VHGP - Căn hộ A101 (2PN)', 3500000000, 6, 100012, 100012),
        (202, 1, 102, 'GMS - Căn hộ B202 (3PN)', 12000000000, 5, 100012, 100012),
        (203, 1, 103, 'TMTT - Căn hộ C303 (Penthouse)', 18500000000, 4, 100012, 100012),
        (204, 1, 104, 'VHGP - Căn hộ Studio S505', 1800000000, 2, 100015, 100015),
        (205, 1, 105, 'GMS - Căn hộ Premium P102', 15000000000, 5, 100015, 100015)
    ON DUPLICATE KEY UPDATE title=VALUES(title), value=VALUES(value)");

    // 4. Deposits
    $conn->query("INSERT INTO deposits (id, contact_id, project_id, unit_code, price, expected_commission, status, created_by) VALUES 
        (301, 101, 1, 'A101', 3500000000, 100000000, 'approved', 100012),
        (302, 102, 2, 'B202', 12000000000, 200000000, 'pending_admin', 100012),
        (303, 105, 2, 'P102', 15000000000, 200000000, 'pending_admin', 100015)
    ON DUPLICATE KEY UPDATE price=VALUES(price), status=VALUES(status)");

    // 5. Deposit Milestones
    $conn->query("INSERT INTO deposit_milestones (id, deposit_id, milestone_name, expected_amount, status) VALUES 
        (401, 301, 'Đặt cọc đợt 1', 100000000, 'approved'),
        (402, 302, 'Đặt cọc đợt 1', 200000000, 'pending'),
        (403, 303, 'Đặt cọc đợt 1', 200000000, 'pending')
    ON DUPLICATE KEY UPDATE expected_amount=VALUES(expected_amount), status=VALUES(status)");

    // 6. Expenses
    $conn->query("INSERT INTO expenses (tenant_id, amount, status, title, date, category, created_by) VALUES 
        (1, 1500000, 'approved', 'Chi phí văn phòng phẩm tháng 7', '$today', 'office', 100013),
        (1, 2500000, 'pending', 'Tiếp khách hàng Grand Marina Saigon', '$today', 'entertainment', 100012),
        (1, 12000000, 'approved', 'Chi phí Ads Facebook chiến dịch VHGP', '$yesterday', 'marketing', 100015),
        (1, 4500000, 'pending', 'Thanh toán tiền điện văn phòng', '$today', 'utilities', 100014)
    ");

    // 7. Check-ins
    // We insert check-ins for the last 5 days for users. Let's create some late, present, and pending approvals.
    $conn->query("INSERT INTO check_ins (user_id, check_in_date, check_in_time, status, reason, location_address) VALUES 
        (100012, '$prev4days', '08:05:00', 'approved', 'Kẹt xe cầu Sài Gòn', 'Văn phòng'),
        (100012, '$prev3days', '07:55:00', 'approved', '', 'Văn phòng'),
        (100012, '$prev2days', '08:12:00', 'approved', 'Họp khách hàng đột xuất', 'Ngoài văn phòng'),
        (100012, '$yesterday', '07:48:00', 'approved', '', 'Văn phòng'),
        (100012, '$today', '08:25:00', 'pending_approval', 'Hỏng xe máy dọc đường', 'Văn phòng'),
        
        (100014, '$prev4days', '08:00:00', 'approved', '', 'Văn phòng'),
        (100014, '$prev3days', '07:58:00', 'approved', '', 'Văn phòng'),
        (100014, '$prev2days', '07:55:00', 'approved', '', 'Văn phòng'),
        (100014, '$yesterday', '08:15:00', 'pending_approval', 'Gặp đối tác thuế', 'Cục Thuế TP.HCM'),
        (100014, '$today', '07:52:00', 'approved', '', 'Văn phòng'),

        (100015, '$yesterday', '08:35:00', 'pending_approval', 'Bổ sung chấm công quên quét thẻ vân tay', 'Văn phòng')
    ");

    // 8. Leave Requests
    $conn->query("INSERT INTO hrm_leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status) VALUES 
        (100012, 'annual', '$today 08:00:00', '$today 17:30:00', 1.0, 'Có việc gia đình riêng', 'pending')
    ");

    // 9. Activities (Planned tasks)
    $conn->query("INSERT INTO activities (tenant_id, user_id, subject, type, priority, due_date, status, body) VALUES 
        (1, 100012, 'Gọi lại tư vấn cho khách Nguyễn Văn A', 'call', 'high', '$today 14:00:00', 'planned', 'Khách hàng muốn hỏi thêm về phương thức thanh toán nhanh'),
        (1, 100012, 'Ký hợp đồng cọc Grand Marina Saigon', 'meeting', 'high', '$today 16:30:00', 'planned', 'Gặp khách hàng tại nhà mẫu Quận 1'),
        (1, 100014, 'Đối soát UNC đơn cọc Vinhomes Grand Park', 'task', 'high', '$today 09:30:00', 'planned', 'Kiểm tra tiền nổi tài khoản Techcombank'),
        (1, 100013, 'Duyệt yêu cầu đi trễ & phép năm tháng 7', 'task', 'medium', '$today 10:00:00', 'planned', 'Kiểm tra các yêu cầu chấm công tồn đọng')
    ");

    echo json_encode([
        "success" => true,
        "message" => "Đã đổ dữ liệu thật thành công cho toàn bộ bảng table & column phục vụ UI testing."
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    // Return HTTP 200 with error details so read_url_content can capture it
    echo json_encode([
        "success" => false,
        "error" => $e->getMessage(),
        "trace" => $e->getTraceAsString()
    ]);
}
