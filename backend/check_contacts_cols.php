<?php
// backend/check_contacts_cols.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT * FROM contacts LIMIT 1");
$row = $res->fetch_assoc();
echo "=== CONTACT COLUMNS ===\n";
foreach ($row as $k => $v) {
    echo "$k: " . (is_null($v) ? 'NULL' : $v) . "\n";
}
unlink(__FILE__);
