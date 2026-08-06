<?php
// backend/check_workflows.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT * FROM workflows");
echo "=== WORKFLOWS ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . " | Steps: " . $row['steps'] . "\n";
}
unlink(__FILE__);
