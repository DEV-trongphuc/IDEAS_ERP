<?php
// backend/inspect_expenses_schema.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW CREATE TABLE expenses");
$row = $res->fetch_assoc();
echo "=== TABLE expenses ===\n" . $row['Create Table'] . "\n\n";
