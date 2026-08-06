<?php
// backend/check_rows_count.php
require_once __DIR__ . '/test_bootstrap.php';

$tables = ['deposits', 'expenses', 'sales_orders', 'purchase_orders', 'contacts', 'companies'];
echo "=== ROW COUNTS ===\n";
foreach ($tables as $t) {
    $res = $conn->query("SELECT COUNT(*) FROM $t");
    $cnt = $res ? $res->fetch_row()[0] : 'N/A';
    echo "Table: $t | Count: $cnt\n";
}
unlink(__FILE__);
