<?php
// backend/check_expenses_cols.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW COLUMNS FROM expenses");
echo "=== EXPENSES COLUMNS ===\n";
while ($row = $res->fetch_assoc()) {
    echo $row['Field'] . " (" . $row['Type'] . ")\n";
}

$res2 = $conn->query("SELECT * FROM expenses LIMIT 1");
$row2 = $res2->fetch_assoc();
if ($row2) {
    echo "=== SAMPLE RECORD ===\n";
    foreach ($row2 as $k => $v) {
        echo "$k: " . (is_null($v) ? 'NULL' : $v) . "\n";
    }
}
unlink(__FILE__);
