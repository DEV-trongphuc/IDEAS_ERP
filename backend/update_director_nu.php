<?php
// backend/update_director_nu.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== UPDATING DIRECTOR USER MAI THI NU ===\n";

$email = 'numt@ideas.edu.vn';
$fullName = 'Mai Thị Nữ';

$stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
$stmt->execute([$email]);
$userRow = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$userRow) {
    $hash = password_hash('director123', PASSWORD_BCRYPT);
    $stmtInsert = $pdo->prepare("
        INSERT INTO users (tenant_id, username, email, password_hash, full_name, role, is_active, status) 
        VALUES (1, 'numt', ?, ?, ?, 'director', 1, 'active')
    ");
    $stmtInsert->execute([$email, $hash, $fullName]);
    $userId = (int)$pdo->lastInsertId();
    echo "Created director user '{$fullName}' successfully with ID: {$userId}!\n";
} else {
    $userId = (int)$userRow['id'];
    $hash = password_hash('director123', PASSWORD_BCRYPT);
    $stmtUpdate = $pdo->prepare("UPDATE users SET password_hash = ?, full_name = ?, role = 'director' WHERE id = ?");
    $stmtUpdate->execute([$hash, $fullName, $userId]);
    echo "Updated director user '{$fullName}' details successfully (ID: {$userId})!\n";
}

echo "=== UPDATE COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
