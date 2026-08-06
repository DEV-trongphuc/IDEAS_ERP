<?php
// backend/check_exp2.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT * FROM expenses WHERE id = 2");
$row = $res->fetch_assoc();
echo "=== EXPENSE 2 DETAILS ===\n";
foreach ($row as $k => $v) {
    echo "$k: " . (is_null($v) ? 'NULL' : $v) . "\n";
}
unlink(__FILE__);
