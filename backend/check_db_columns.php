<?php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== INDEXES OF activities ===\n";
$res1 = $conn->query("SHOW INDEX FROM activities");
while ($row = $res1->fetch_assoc()) {
    echo "Table: " . $row['Table'] . " | Key_name: " . $row['Key_name'] . " | Column_name: " . $row['Column_name'] . "\n";
}

echo "\n=== INDEXES OF purchase_orders ===\n";
$res1 = $conn->query("SHOW INDEX FROM purchase_orders");
while ($row = $res1->fetch_assoc()) {
    echo "Table: " . $row['Table'] . " | Key_name: " . $row['Key_name'] . " | Column_name: " . $row['Column_name'] . "\n";
}

echo "\n=== INDEXES OF sales_orders ===\n";
$res2 = $conn->query("SHOW INDEX FROM sales_orders");
while ($row = $res2->fetch_assoc()) {
    echo "Table: " . $row['Table'] . " | Key_name: " . $row['Key_name'] . " | Column_name: " . $row['Column_name'] . "\n";
}
