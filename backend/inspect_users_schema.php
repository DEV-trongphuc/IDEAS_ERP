<?php
// backend/inspect_users_schema.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW CREATE TABLE users");
$row = $res->fetch_assoc();
echo "=== TABLE users ===\n" . $row['Create Table'] . "\n\n";
unlink(__FILE__);
