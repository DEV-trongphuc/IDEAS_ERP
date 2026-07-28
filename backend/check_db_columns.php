<?php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW COLUMNS FROM deposits");
while ($row = $res->fetch_assoc()) {
    echo "Column: " . $row['Field'] . " | Type: " . $row['Type'] . "\n";
}
printTestSummary();
