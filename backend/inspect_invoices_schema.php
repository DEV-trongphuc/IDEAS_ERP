<?php
// backend/inspect_invoices_schema.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SHOW CREATE TABLE invoices");
$row = $res->fetch_assoc();
echo "=== TABLE invoices ===\n" . $row['Create Table'] . "\n\n";
unlink(__FILE__);
