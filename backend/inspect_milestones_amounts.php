<?php
// backend/inspect_milestones_amounts.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, milestone_name, expected_amount, status FROM deposit_milestones WHERE deposit_id = 1");
echo "=== MILESTONES FOR DEPOSIT 1 ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['milestone_name'] . " | Amount: " . $row['expected_amount'] . " | Status: " . $row['status'] . "\n";
}
unlink(__FILE__);
