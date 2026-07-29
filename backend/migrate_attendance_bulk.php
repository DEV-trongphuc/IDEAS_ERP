<?php
// backend/migrate_attendance_bulk.php
define('DIAG_TOKEN', 'Ideas_Diag_Secure_Token_2026_9e88d6c701fbc6b7');
require_once __DIR__ . '/test_bootstrap.php';

echo "🚀 BẮT ĐẦU MIGRATION CSDL CHO PHIẾU BỔ SUNG CÔNG TỔNG HỢP\n";
echo "====================================================\n";

try {
    // 1. Tạo bảng attendance_bulk_requests
    $q1 = "CREATE TABLE IF NOT EXISTS `attendance_bulk_requests` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `user_id` INT NOT NULL,
      `month_period` VARCHAR(7) NOT NULL, -- Ví dụ: '2026-07'
      `status` ENUM('pending_manager', 'pending_hr', 'approved', 'rejected') DEFAULT 'pending_manager',
      `manager_id` INT DEFAULT NULL,
      `hr_id` INT DEFAULT NULL,
      `admin_note` VARCHAR(255) DEFAULT NULL,
      `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      INDEX (`user_id`),
      INDEX (`status`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";
    
    $conn->query($q1);
    assertTest("Tạo bảng attendance_bulk_requests thành công", true);

    // 2. Tạo bảng attendance_bulk_request_details
    $q2 = "CREATE TABLE IF NOT EXISTS `attendance_bulk_request_details` (
      `id` INT AUTO_INCREMENT PRIMARY KEY,
      `request_id` INT NOT NULL,
      `check_in_date` DATE NOT NULL,
      `suggested_check_in` TIME DEFAULT NULL,
      `suggested_check_out` TIME DEFAULT NULL,
      `reason` VARCHAR(255) NOT NULL,
      `approved` TINYINT(1) DEFAULT 1,
      FOREIGN KEY (`request_id`) REFERENCES `attendance_bulk_requests`(`id`) ON DELETE CASCADE,
      INDEX (`check_in_date`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;";

    $conn->query($q2);
    assertTest("Tạo bảng attendance_bulk_request_details thành công", true);

} catch (\Throwable $e) {
    assertTest("Lỗi chạy migration", false, $e->getMessage());
}

printTestSummary();
