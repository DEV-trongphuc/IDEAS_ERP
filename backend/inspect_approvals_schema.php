<?php
// backend/inspect_approvals_schema.php
require_once __DIR__ . '/test_bootstrap.php';

try {
    $res = $conn->query("SHOW CREATE TABLE approvals");
    $row = $res->fetch_assoc();
    echo "=== TABLE approvals ===\n" . $row['Create Table'] . "\n\n";
} catch (Throwable $e) {
    echo "No approvals table: " . $e->getMessage() . "\n";
}

try {
    $res2 = $conn->query("SHOW CREATE TABLE approval_steps");
    $row2 = $res2->fetch_assoc();
    echo "=== TABLE approval_steps ===\n" . $row2['Create Table'] . "\n\n";
} catch (Throwable $e) {
    echo "No approval_steps table: " . $e->getMessage() . "\n";
}
