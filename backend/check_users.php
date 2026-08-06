<?php
// backend/check_users.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, full_name, email, role FROM users WHERE tenant_id = 1");
echo "=== SYSTEM USERS ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['full_name'] . " | Email: " . $row['email'] . " | Role: " . $row['role'] . "\n";
}
unlink(__FILE__);
