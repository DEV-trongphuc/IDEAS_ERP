<?php
// backend/test_notification_trigger.php
require_once __DIR__ . '/test_bootstrap.php';

echo "--- USERS LIST ---\n";
$q = $pdo->query("SELECT id, username, email, role, full_name FROM users LIMIT 10");
while ($r = $q->fetch(PDO::FETCH_ASSOC)) {
    echo "  • ID: {$r['id']} | User: '{$r['username']}' | Email: '{$r['email']}' | Role: '{$r['role']}' | Name: '{$r['full_name']}'\n";
}
