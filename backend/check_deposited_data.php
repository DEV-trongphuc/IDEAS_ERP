<?php
// backend/check_deposited_data.php
require_once __DIR__ . '/test_bootstrap.php';

$tid = 1;
$sql = "
    SELECT d.*, c.full_name, c.phone, c.avatar_url, c.email, p.name as project_name, u.full_name as creator_name, u.avatar_url as creator_avatar,
           c.owner_id as contact_owner_id, c.pipeline_status
    FROM deposits d
    JOIN contacts c ON d.contact_id = c.id
    JOIN projects p ON d.project_id = p.id
    JOIN users u ON d.created_by = u.id
    WHERE c.tenant_id = ?
";
$stmt = $pdo->prepare($sql);
$stmt->execute([$tid]);
$rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

echo "Total deposits fetched by raw query: " . count($rows) . "\n";
if (empty($rows)) {
    // Let's print details of deposits, contacts, projects to see why they didn't join
    $dep = $pdo->query("SELECT * FROM deposits")->fetchAll(PDO::FETCH_ASSOC);
    echo "\n=== DEPOSITS ===\n";
    print_r($dep);
    
    $proj = $pdo->query("SELECT * FROM projects")->fetchAll(PDO::FETCH_ASSOC);
    echo "\n=== PROJECTS ===\n";
    print_r($proj);
    
    $con = $pdo->query("SELECT id, tenant_id FROM contacts WHERE id IN (SELECT contact_id FROM deposits)")->fetchAll(PDO::FETCH_ASSOC);
    echo "\n=== CONTACTS ===\n";
    print_r($con);
}
