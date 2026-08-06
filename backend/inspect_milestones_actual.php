<?php
// backend/inspect_milestones_actual.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, milestone_name, expected_amount, original_amount, actual_amount, status FROM deposit_milestones WHERE deposit_id = 1");
echo "=== MILESTONES ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['milestone_name'] . " | Expected: " . $row['expected_amount'] . " | Original: " . $row['original_amount'] . " | Actual: " . $row['actual_amount'] . " | Status: " . $row['status'] . "\n";
}
unlink(__FILE__);
