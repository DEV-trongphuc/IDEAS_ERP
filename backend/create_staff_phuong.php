<?php
// backend/create_staff_phuong.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== CREATING STAFF USER NGUYEN THI DUY PHUONG ===\n";

$email = 'phuongntd@ideas.edu.vn';
$fullName = 'Nguyễn Thị Duy Phương';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userRow) {
    $hash = password_hash('phuong123', PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare("
        INSERT INTO users (tenant_id, username, email, password_hash, full_name, role, is_active, status) 
        VALUES (1, 'phuongntd', ?, ?, ?, 'hr', 1, 'active')
    ");
    $stmtInsert->execute([$email, $hash, $fullName]);
    $userId = (int)$pdo->lastInsertId();
    echo "Created staff user '{$fullName}' successfully with ID: {$userId}!\n";
} else {
    $userId = (int)$userRow['id'];
    $hash = password_hash('phuong123', PASSWORD_BCRYPT);
    $stmtUpdate = $pdo->prepare("UPDATE users SET password_hash = ?, full_name = ?, role = 'hr' WHERE id = ?");
    $stmtUpdate->execute([$hash, $fullName, $userId]);
    echo "Updated staff user '{$fullName}' password & role successfully (ID: {$userId})!\n";
}

echo "=== CREATION COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
