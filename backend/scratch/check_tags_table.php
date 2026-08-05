<?php
require_once __DIR__ . '/../test_bootstrap.php';

echo "=== COLUMNS OF tags ===\n";
$res = $conn->query("SHOW COLUMNS FROM tags");
while ($row = $res->fetch_assoc()) {
    print_r($row);
}

echo "\n=== SAMPLE RECORDS OF tags ===\n";
$res2 = $conn->query("SELECT * FROM tags LIMIT 20");
while ($row2 = $res2->fetch_assoc()) {
    print_r($row2);
}
