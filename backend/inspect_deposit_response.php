<?php
// backend/inspect_deposit_response.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT d.*, c.full_name, c.phone, c.avatar_url, c.email, p.name as project_name, u.full_name as creator_name, u.avatar_url as creator_avatar,
           c.owner_id as contact_owner_id, c.pipeline_status
    FROM deposits d
    JOIN contacts c ON d.contact_id = c.id
    JOIN projects p ON d.project_id = p.id
    JOIN users u ON d.created_by = u.id
    WHERE d.id = 1");
$row = $res->fetch_assoc();

$stmtM = $pdo->prepare("SELECT * FROM deposit_milestones WHERE deposit_id = 1 ORDER BY id ASC");
$stmtM->execute();
$milestones = $stmtM->fetchAll(PDO::FETCH_ASSOC);

echo "=== DEPOSIT 1 ===\n";
echo "Price: " . $row['price'] . " | Currency: " . $row['currency'] . " | Exchange Rate: " . $row['exchange_rate'] . "\n";
echo "\n=== MILESTONES ===\n";
foreach ($milestones as $m) {
    echo "ID: " . $m['id'] . " | Name: " . $m['milestone_name'] . " | Expected Amount: " . $m['expected_amount'] . " | Original Amount: " . $m['original_amount'] . " | Status: " . $m['status'] . "\n";
}
unlink(__FILE__);
