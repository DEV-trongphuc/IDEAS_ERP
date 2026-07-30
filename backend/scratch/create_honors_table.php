<?php
// backend/scratch/create_honors_table.php
define('DIAG_TOKEN', 'Ideas_Diag_Secure_Token_2026_9e88d6c701fbc6b7');
require_once __DIR__ . '/../test_bootstrap.php';

try {
    // 1. Create table
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS enterprise_honors (
            id INT(11) AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT(11) NOT NULL,
            user_id INT(11) NOT NULL,
            title VARCHAR(255) NOT NULL,
            badge VARCHAR(255) NOT NULL,
            reason TEXT NOT NULL,
            hearts_count INT(11) DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    ");
    echo "✅ Table 'enterprise_honors' created or already exists.\n";

    // 2. Check if table is empty, seed initial data if so
    $count = $pdo->query("SELECT COUNT(*) FROM enterprise_honors")->fetchColumn();
    if ($count == 0) {
        // Find tenant_id from user table
        $tenantId = $pdo->query("SELECT tenant_id FROM users LIMIT 1")->fetchColumn() ?: 1;
        
        // Find Tran Thi Tuyet Mai or another active user
        $userId = $pdo->query("SELECT id FROM users WHERE full_name LIKE '%Mai%' LIMIT 1")->fetchColumn();
        if (!$userId) {
            $userId = $pdo->query("SELECT id FROM users LIMIT 1")->fetchColumn();
        }
        
        if ($userId) {
            $stmt = $pdo->prepare("
                INSERT INTO enterprise_honors (tenant_id, user_id, title, badge, reason, hearts_count)
                VALUES (?, ?, ?, ?, ?, 0)
            ");
            $stmt->execute([
                $tenantId,
                $userId,
                'Trưởng phòng Kinh doanh (Sale Manager)',
                'Nhân viên xuất sắc của tháng',
                'Đã xuất sắc hoàn thành vượt chỉ tiêu doanh số 145% trong tháng và dẫn dắt đội nhóm đạt thành tích kỷ lục!'
            ]);
            echo "✅ Seeded initial honored user ID: {$userId}.\n";
        }
    }
} catch (Exception $e) {
    echo "❌ Error: " . $e->getMessage() . "\n";
}
