<?php
// D:\GITHUB_SPACE\IDEAS_ERP\scratch\check_db_users.php

require_once __DIR__ . '/../backend/db_connect.php';

$sql = "SELECT id, email, role, status FROM users";
$result = $conn->query($sql);

if ($result) {
    echo "ID | Email | Role | Status\n";
    echo str_repeat("-", 60) . "\n";
    while ($row = $result->fetch_assoc()) {
        echo "{$row['id']} | {$row['email']} | {$row['role']} | {$row['status']}\n";
    }
} else {
    echo "Error: " . $conn->error . "\n";
}
