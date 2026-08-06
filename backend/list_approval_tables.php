<?php
// backend/list_approval_tables.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW TABLES");
echo "=== DATABASE TABLES ===\n";
while ($row = $res->fetch_row()) {
    $table = $row[0];
    if (strpos($table, 'approval') !== false || strpos($table, 'workflow') !== false || strpos($table, 'step') !== false || strpos($table, 'expense') !== false) {
        echo "Table: $table\n";
    }
}
unlink(__FILE__);
