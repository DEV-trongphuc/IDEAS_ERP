<?php
// backend/inspect_stages.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT id, name, system_slug, order_index FROM pipeline_stages ORDER BY order_index ASC");
while ($row = $res->fetch_assoc()) {
    echo "ID: " . str_pad($row['id'], 6) . " | Name: " . str_pad($row['name'], 25) . " | Slug: " . str_pad($row['system_slug'], 25) . " | Order Index: " . $row['order_index'] . "\n";
}
