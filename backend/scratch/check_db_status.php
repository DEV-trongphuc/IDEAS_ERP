<?php
require_once __DIR__ . '/../test_bootstrap.php';

try {
    echo "=== DB VERSION FROM SYSTEM_SETTINGS ===\n";
    $stmt = $pdo->query("SELECT setting_value FROM system_settings WHERE setting_key = 'db_version'");
    echo "Version: " . ($stmt->fetchColumn() ?: "none") . "\n\n";

    echo "=== COLUMNS IN DEPOSITS ===\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM deposits");
    while ($row = $stmt->fetch()) {
        echo "  - {$row['Field']} ({$row['Type']})\n";
    }

    echo "\n=== COLUMNS IN DEPOSIT_MILESTONES ===\n";
    $stmt = $pdo->query("SHOW COLUMNS FROM deposit_milestones");
    while ($row = $stmt->fetch()) {
        echo "  - {$row['Field']} ({$row['Type']})\n";
    }
} catch (Throwable $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
