<?php
// backend/check_workflow_templates.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT * FROM workflow_task_templates");
echo "=== WORKFLOW TASK TEMPLATES ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Title: " . $row['title'] . " | Assigned Role/User: " . $row['assigned_to_role'] . " / " . $row['assigned_to_user_id'] . "\n";
}

$res2 = $conn->query("SELECT id, name, requester_id, approver_id, accountant_id, accountant_head_id, payment_approver_id FROM expenses LIMIT 5");
echo "=== EXPENSES ===\n";
while ($row = $res2->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . " | Requester: " . $row['requester_id'] . " | Approver: " . $row['approver_id'] . " | Accountant: " . $row['accountant_id'] . " | Head: " . $row['accountant_head_id'] . " | Payment: " . $row['payment_approver_id'] . "\n";
}
unlink(__FILE__);
