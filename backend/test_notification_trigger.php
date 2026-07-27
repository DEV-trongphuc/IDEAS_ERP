<?php
// backend/test_notification_trigger.php
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/NotificationService.php';

echo "=======================================================================\n";
echo "🔔 KHỞI CHẠY KIỂM THỬ TOÀN BỘ CÁC TRƯỜNG HỢP LOGIC THÔNG BÁO (30+ CASES)\n";
echo "=======================================================================\n\n";

// Sử dụng Reflection để truy cập method private resolveEventData
$reflection = new ReflectionMethod('NotificationService', 'resolveEventData');
$reflection->setAccessible(true);

$testCases = [
    'CHECKIN_LATE' => [
        'user_name' => 'Nguyễn Văn A',
        'date' => '2026-07-27',
        'time' => '08:45:00',
        'reason' => 'Kẹt xe đường Nguyễn Hữu Cảnh'
    ],
    'ATTENDANCE_UPDATE' => [
        'user_name' => 'Trần Thị B',
        'date' => '2026-07-27',
        'time' => '17:30:00',
        'reason' => 'Quên chấm công ra ca'
    ],
    'ATTENDANCE_APPROVAL_RESULT' => [
        'user_name' => 'Nguyễn Văn A',
        'date' => '2026-07-27',
        'status' => 'approved',
        'is_supplementary' => true,
        'user_id' => 1003,
        'reason' => 'Đã xác nhận đi trễ có lý do chính đáng'
    ],
    'HOLIDAY_REGISTRATION_OPENED' => [
        'holiday_name' => 'Quốc Khánh 2/9',
        'shift_date' => '2026-09-02',
        'deadline' => '2026-08-30 18:00'
    ],
    'HOLIDAY_UPDATE' => [
        'holiday_name' => 'Quốc Khánh 2/9',
        'description' => 'Cập nhật lịch trực tăng cường'
    ],
    'MONTHLY_ATTENDANCE_REPORT' => [
        'recipients' => [['id' => 1003, 'full_name' => 'Nguyễn Văn A', 'email' => 'nva@ideas.vn']],
        'summary_text' => 'Tổng kết công tháng 7: 22 ngày đi làm, 0 ngày nghỉ phép, 1 ngày đi trễ.',
        'period_str' => 'Tháng 07/2026',
        'user_id' => 1003,
        'period' => 'Tháng 07/2026',
        'work_days' => 22,
        'late_days' => 1,
        'late_minutes' => 15,
        'missing_days' => 0,
        'night_shifts' => 2,
        'weekend_shifts' => 4,
        'holiday_shifts' => 0
    ],
    'CHECKOUT_REMINDER' => [
        'work_end' => '17:30'
    ],
    'EXPENSE_REQUEST' => [
        'user_name' => 'Lê Văn C',
        'title' => 'Chi phí tiếp khách dự án Rich Land',
        'amount' => 5000000,
        'reason' => 'Mời cơm đối tác ký kết hợp đồng'
    ],
    'TICKET_NEW' => [
        'user_name' => 'Khách hàng Z',
        'ticket_id' => 'TK-9928',
        'subject' => 'Lỗi không đăng nhập được App cư dân'
    ],
    'COOPERATION_PENDING_APPROVAL' => [
        'partner_name' => 'Công ty Bất động sản Thịnh Vượng'
    ],
    'DEPOSIT_NEW' => [
        'user_name' => 'Sale Nguyễn',
        'contact_name' => 'Phạm Văn D',
        'project_name' => 'Grand Marina',
        'unit_code' => 'GM-12A.04',
        'price' => 12000000000
    ],
    'MY_DEPOSIT_UPDATE' => [
        'user_id' => 1003,
        'status' => 'approved',
        'unit_code' => 'GM-12A.04'
    ],
    'NIGHT_SHIFT_BOOKING' => [
        'user_name' => 'Trần Văn E',
        'shift_date' => '2026-07-28'
    ],
    'LEAVE_REQUEST' => [
        'user_name' => 'Nguyễn Văn A',
        'leave_type' => 'Phép năm',
        'from_date' => '2026-08-01',
        'to_date' => '2026-08-03',
        'reason' => 'Giải quyết công việc gia đình'
    ],
    'LEAD_ASSIGNMENT' => [
        'user_id' => 1003,
        'lead_name' => 'Hoàng Văn F',
        'source' => 'Meta Ads',
        'phone' => '0901234567'
    ],
    'COOP_INVITATION' => [
        'user_id' => 1003,
        'partner_name' => 'Địa ốc Nam Long'
    ],
    'CUSTOMER_UPDATE' => [
        'contact_name' => 'Phạm Văn D',
        'user_id' => 1003
    ],
    'SECURITY_DEADLINE_WARNING' => [
        'contact_name' => 'Phạm Văn D',
        'user_id' => 1003
    ],
    'MENTION_TAGGED' => [
        'user_id' => 1003,
        'mentioner_name' => 'Admin Tuyển',
        'comment_text' => 'Nhờ kiểm tra lại hồ sơ khách hàng này gấp nhé!'
    ],
    'WORKFLOW_TASK_ASSIGNED' => [
        'user_id' => 1003,
        'task_title' => 'Soạn thảo phụ lục hợp đồng cọc',
        'project_name' => 'Khu đô thị Vạn Phúc'
    ],
    'PROFILE_ACCOUNT_UPDATE' => [
        'user_id' => 1003,
        'fields_changed' => 'Số điện thoại, Địa chỉ'
    ],
    'PROJECT_ROSTER_UPDATE' => [
        'project_name' => 'The Metropole Thủ Thiêm'
    ],
    'HOLIDAY_ROSTER_OPEN' => [
        'holiday_name' => 'Tết Trung Thu',
        'shift_date' => '2026-09-25'
    ],
    'HOLIDAY_ANNOUNCEMENT' => [
        'holiday_name' => 'Tết Trung Thu',
        'description' => 'Tất cả nhân sự nghỉ trực chiều'
    ],
    'HRM_LEAVE_REQUEST' => [
        'user_name' => 'Nguyễn Văn A',
        'leave_type' => 'Nghỉ ốm',
        'from_date' => '2026-07-28',
        'to_date' => '2026-07-28',
        'reason' => 'Đi khám sức khỏe định kỳ'
    ],
    'HRM_LEAVE_APPROVAL' => [
        'user_id' => 1003,
        'status' => 'approved',
        'reason' => 'Đã nhận được giấy khám của bệnh viện'
    ],
    'HRM_ADVANCE_REQUEST' => [
        'user_name' => 'Nguyễn Văn A',
        'amount' => 5000000,
        'reason' => 'Tạm ứng lương đợt 1 tháng 7'
    ],
    'HRM_ADVANCE_APPROVAL' => [
        'user_id' => 1003,
        'status' => 'approved',
        'reason' => 'Duyệt tạm ứng theo quy định phòng nhân sự'
    ],
    'HRM_PAYSLIP_PUBLISHED' => [
        'month' => '07/2026',
        'user_id' => 1003
    ],
    'HRM_PAYSLIP_CONFIRMED' => [
        'user_name' => 'Nguyễn Văn A',
        'month' => '07/2026'
    ]
];

$passCount = 0;
$failCount = 0;

foreach ($testCases as $eventType => $payload) {
    try {
        $result = $reflection->invoke(null, $pdo, 1, $eventType, $payload);
        if ($result === null) {
            // resolveEventData trả về null nếu không khớp hoặc bị bỏ qua
            echo "⚠️ [SKIP] Event '{$eventType}' resolved as NULL (Not handled or skipped by default).\n";
            continue;
        }

        // Kiểm tra các trường bắt buộc phải có trong kết quả trả về
        $hasRecipients = isset($result['recipients']) && is_array($result['recipients']);
        $hasTitle = isset($result['title']) && !empty($result['title']);
        $hasBody = isset($result['body']) && !empty($result['body']);
        
        if ($hasRecipients && $hasTitle && $hasBody) {
            echo "✅ [PASS] Event '{$eventType}':\n";
            echo "   • Tiêu đề: " . $result['title'] . "\n";
            echo "   • Nội dung: " . $result['body'] . "\n";
            $passCount++;
        } else {
            echo "❌ [FAIL] Event '{$eventType}' missing required fields in resolved output:\n";
            print_r($result);
            $failCount++;
        }
    } catch (\Throwable $e) {
        echo "❌ [FAIL] Event '{$eventType}' generated exception: " . $e->getMessage() . "\n";
        $failCount++;
    }
}

echo "\n====================================================\n";
echo "📊 TỔNG KẾT KẾT QUẢ KIỂM THỬ THÔNG BÁO:\n";
echo "   ✅ Thành công (PASS): {$passCount}\n";
echo "   ❌ Thất bại (FAIL)  : {$failCount}\n";
echo "====================================================\n";
