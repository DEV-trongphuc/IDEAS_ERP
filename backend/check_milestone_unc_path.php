<?php
// backend/check_milestone_unc_path.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, milestone_name, expected_amount, actual_amount, unc_file_path, status FROM deposit_milestones WHERE deposit_id = 1");
echo "=== MILESTONES ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['milestone_name'] . " | Expected: " . $row['expected_amount'] . " | Actual: " . $row['actual_amount'] . " | UNC: " . $row['unc_file_path'] . " | Status: " . $row['status'] . "\n";
}
unlink(__FILE__);
