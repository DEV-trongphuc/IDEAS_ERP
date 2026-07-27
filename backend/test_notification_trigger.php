<?php
// backend/test_notification_trigger.php
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/NotificationService.php';

echo "====================================================\n";
echo "🔔 BẮT ĐẦU KIỂM THỬ THÔNG BÁO HỆ THỐNG (NOTIFICATIONS)\n";
echo "====================================================\n\n";

$payload = [
    'user_name' => 'Nhân viên Demo',
    'title' => 'Mua thiết bị văn phòng',
    'amount' => 15000000,
    'reason' => 'Mua thêm 2 màn hình phục vụ lập trình AI',
    'date' => date('Y-m-d'),
    'time' => date('H:i')
];

try {
    // Gửi thông báo
    NotificationService::send($pdo, 1, 'EXPENSE_REQUEST', $payload);
    
    // Đợi 100ms để đảm bảo các thread ghi hoàn tất
    usleep(100000);

    // Truy vấn thông báo mới nhất từ database
    $stmt = $pdo->prepare("SELECT * FROM notifications ORDER BY id DESC LIMIT 1");
    $stmt->execute();
    $notif = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($notif) {
        echo "✅ [PASS] Thông báo đã lưu vào CSDL thành công!\n";
        echo "   • Tiêu đề: " . $notif['title'] . "\n";
        echo "   • Nội dung: " . $notif['body'] . "\n";
        echo "   • Đường dẫn liên kết: " . $notif['link'] . "\n";
        echo "   • Thời gian tạo: " . $notif['created_at'] . "\n";
    } else {
        echo "❌ [FAIL] Không tìm thấy thông báo trong database.\n";
    }
} catch (\Throwable $e) {
    echo "❌ [ERROR] Lỗi hệ thống: " . $e->getMessage() . "\n";
}
