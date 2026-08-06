<?php
// backend/update_avatar_mainu.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== UPDATING AVATAR FOR MAI THỊ NỮ ===\n";

$userId = 100062;
$avatarUrl = 'uploads/avatars/avatar_mainu.jpg';

// Verify user exists
$stmt = $pdo->prepare("SELECT id, username, full_name, avatar_url FROM users WHERE id = ?");
$stmt->execute([$userId]);
$user = $stmt->fetch();

if (!$user) {
    echo "Error: User with ID {$userId} not found!\n";
    exit(1);
}

echo "Found User: {$user['full_name']} (Username: {$user['username']})\n";
echo "Current Avatar: " . ($user['avatar_url'] ?? 'None') . "\n";

// Update avatar_url
$stmtUpdate = $pdo->prepare("UPDATE users SET avatar_url = ? WHERE id = ?");
$stmtUpdate->execute([$avatarUrl, $userId]);

echo "Successfully updated avatar_url to '{$avatarUrl}' for User ID {$userId}.\n";
