<?php
require_once __DIR__ . '/../test_bootstrap.php';

try {
    // Check if column already exists
    $stmt = $pdo->query("SHOW COLUMNS FROM deposits LIKE 'participant_ids'");
    $column = $stmt->fetch();
    
    if (!$column) {
        $pdo->exec("ALTER TABLE deposits ADD COLUMN participant_ids VARCHAR(255) DEFAULT NULL");
        echo "Column 'participant_ids' added to 'deposits' table successfully.\n";
    } else {
        echo "Column 'participant_ids' already exists in 'deposits' table.\n";
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
