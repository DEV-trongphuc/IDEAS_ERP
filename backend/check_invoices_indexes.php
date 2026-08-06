<?php
// backend/check_invoices_indexes.php
require_once __DIR__ . '/test_bootstrap.php';

$res1 = $conn->query("SHOW INDEX FROM invoices");
echo "=== INVOICES INDEXES ===\n";
while ($row = $res1->fetch_assoc()) {
    echo "Table: " . $row['Table'] . " | Key_name: " . $row['Key_name'] . " | Seq_in_index: " . $row['Seq_in_index'] . " | Column_name: " . $row['Column_name'] . "\n";
}

$res2 = $conn->query("SHOW INDEX FROM expenses");
echo "=== EXPENSES INDEXES ===\n";
while ($row = $res2->fetch_assoc()) {
    echo "Table: " . $row['Table'] . " | Key_name: " . $row['Key_name'] . " | Seq_in_index: " . $row['Seq_in_index'] . " | Column_name: " . $row['Column_name'] . "\n";
}
unlink(__FILE__);
