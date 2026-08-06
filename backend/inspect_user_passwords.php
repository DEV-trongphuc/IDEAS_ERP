<?php
// backend/inspect_user_passwords.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, email, role, password_hash FROM users");
echo "=== USER LIST & PASSWORDS ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Email: " . $row['email'] . " | Role: " . $row['role'] . " | Hash: " . substr($row['password_hash'], 0, 20) . "...\n";
}
unlink(__FILE__);
