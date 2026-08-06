<?php
// backend/list_tables.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW TABLES");
echo "=== TABLES IN DATABASE ===\n";
while ($row = $res->fetch_array()) {
    echo $row[0] . "\n";
}
unlink(__FILE__);
