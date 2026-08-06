<?php
// backend/create_sale_admin_linh.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== CREATING SALE ADMIN USER DANG KHANH LINH ===\n";

$email = 'linhdk@ideas.edu.vn';
$fullName = 'Đặng Khánh Linh';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userRow) {
    $hash = password_hash('linh123', PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare("
        INSERT INTO users (tenant_id, username, email, password_hash, full_name, role, is_active, status) 
        VALUES (1, 'linhdk', ?, ?, ?, 'sale_admin', 1, 'active')
    ");
    $stmtInsert->execute([$email, $hash, $fullName]);
    $userId = (int)$pdo->lastInsertId();
    echo "Created sale_admin user '{$fullName}' successfully with ID: {$userId}!\n";
} else {
    $userId = (int)$userRow['id'];
    $hash = password_hash('linh123', PASSWORD_BCRYPT);
    $stmtUpdate = $pdo->prepare("UPDATE users SET password_hash = ?, full_name = ?, role = 'sale_admin' WHERE id = ?");
    $stmtUpdate->execute([$hash, $fullName, $userId]);
    echo "Updated sale_admin user '{$fullName}' password & role successfully (ID: {$userId})!\n";
}

echo "=== CREATION COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
