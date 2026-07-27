<?php
require_once __DIR__ . '/../backend/test_bootstrap.php';

echo "=== DATABASE TABLES ===\n";
$res = $conn->query("SHOW TABLES");
while ($row = $res->fetch_row()) {
    $table = $row[0];
    if (strpos($table, 'attend') !== false || strpos($table, 'hrm') !== false || strpos($table, 'leave') !== false || strpos($table, 'salary') !== false || strpos($table, 'payslip') !== false) {
        echo "Found table: $table\n";
        $columnsRes = $conn->query("SHOW COLUMNS FROM `$table`");
        while ($col = $columnsRes->fetch_assoc()) {
            echo "  - {$col['Field']} ({$col['Type']})\n";
        }
    }
}
echo "=== DONE ===\n";
