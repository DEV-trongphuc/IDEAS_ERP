<?php
// backend/count_po_so.php
require_once __DIR__ . '/test_bootstrap.php';

$c1 = $conn->query("SELECT COUNT(*) FROM sales_orders")->fetch_row()[0];
$c2 = $conn->query("SELECT COUNT(*) FROM expenses")->fetch_row()[0];
$c3 = $conn->query("SELECT COUNT(*) FROM contacts")->fetch_row()[0];
$c4 = $conn->query("SELECT COUNT(*) FROM companies")->fetch_row()[0];
$c5 = $conn->query("SELECT COUNT(*) FROM purchase_orders")->fetch_row()[0];

echo "Sales Orders: $c1\n";
echo "Expenses: $c2\n";
echo "Contacts: $c3\n";
echo "Companies: $c4\n";
echo "Purchase Orders: $c5\n";

unlink(__FILE__);
