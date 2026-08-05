<?php
require_once __DIR__ . '/test_bootstrap.php';

if (($_REQUEST['key'] ?? '') !== 'Ideas2026') {
    http_response_code(403);
    echo "Unauthorized";
    exit;
}

echo "=== START MIGRATION ===\n";

$stmt = $conn->query("SELECT id, tags FROM contacts WHERE tags IS NOT NULL AND tags != '' AND tags != '[]'");
$totalUpdated = 0;
$regex = '/^\d+\.\s*(status\s*-\s*)?/i';

while ($row = $stmt->fetch_assoc()) {
    $id = $row['id'];
    $rawTags = $row['tags'];
    
    $tags = json_decode($rawTags, true);
    if (!is_array($tags)) {
        $tags = explode(',', $rawTags);
    }
    
    $cleaned = [];
    foreach ($tags as $tag) {
        $tag = trim((string)$tag);
        if ($tag === '') continue;
        
        $clean = preg_replace($regex, '', $tag);
        $clean = trim($clean);
        if ($clean === '') continue;
        
        $cleaned[] = $clean;
    }
    
    $unique = array_values(array_unique($cleaned));
    $newJson = json_encode($unique, JSON_UNESCAPED_UNICODE);
    
    if ($newJson !== $rawTags) {
        $up = $conn->prepare("UPDATE contacts SET tags = ? WHERE id = ?");
        $up->execute([$newJson, $id]);
        $totalUpdated++;
    }
}

echo "FINISHED! Cleaned tags for $totalUpdated contacts.\n";
