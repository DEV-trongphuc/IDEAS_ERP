<?php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW COLUMNS FROM hrm_profiles");
while ($row = $res->fetch_assoc()) {
    echo "Column: " . $row['Field'] . " | Type: " . $row['Type'] . "\n";
}
printTestSummary();
