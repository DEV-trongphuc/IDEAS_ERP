<?php
// backend/check_contacts_status.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("
    SELECT c.status, c.stage_id, ps.name as stage_name, ps.system_slug, COUNT(*) as cnt 
    FROM contacts c 
    LEFT JOIN pipeline_stages ps ON c.stage_id = ps.id 
    GROUP BY c.status, c.stage_id, ps.name, ps.system_slug
");
echo "=== CONTACTS STATUS AND STAGES ===\n";
while ($row = $res->fetch_assoc()) {
    echo "Status: " . $row['status'] . " | Stage: " . $row['stage_name'] . " (" . $row['system_slug'] . ") | Count: " . $row['cnt'] . "\n";
}
unlink(__FILE__);
