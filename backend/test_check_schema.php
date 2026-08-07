<?php
// backend/test_check_schema.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== CHECKING SCHEMAS ===\n\n";

// Check marketing_campaigns
echo "--- TABLE: marketing_campaigns ---\n";
$resMC = $conn->query("SHOW COLUMNS FROM marketing_campaigns");
while ($row = $resMC->fetch_assoc()) {
    echo "Field: {$row['Field']} | Type: {$row['Type']}\n";
}

// In ra dữ liệu thực tế trong marketing_campaigns
$mcData = $conn->query("SELECT id, name, status, subjects_json FROM marketing_campaigns");
while ($row = $mcData->fetch_assoc()) {
    echo "\nCampaign ID: {$row['id']} | Name: {$row['name']} | Status: {$row['status']}\n";
    echo "Subjects JSON: " . substr($row['subjects_json'], 0, 500) . "...\n";
}

echo "\n--- TABLE: projects ---\n";
$resP = $conn->query("SHOW COLUMNS FROM projects");
while ($row = $resP->fetch_assoc()) {
    echo "Field: {$row['Field']} | Type: {$row['Type']}\n";
}

// In ra dữ liệu thực tế trong projects
$pData = $conn->query("SELECT id, name FROM projects");
if ($pData) {
    while ($row = $pData->fetch_assoc()) {
        echo "\nProject ID: {$row['id']} | Name: {$row['name']}\n";
    }
} else {
    echo "Error querying projects table: " . $conn->error . "\n";
}
