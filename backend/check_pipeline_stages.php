<?php
// backend/check_pipeline_stages.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, name, system_slug, order_index FROM pipeline_stages");
echo "=== PIPELINE STAGES ===\n";
while ($row = $res->fetch_assoc()) {
    echo "ID: " . $row['id'] . " | Name: " . $row['name'] . " | Slug: " . $row['system_slug'] . " | Order: " . $row['order_index'] . "\n";
}
unlink(__FILE__);
