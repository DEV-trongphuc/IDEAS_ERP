<?php
// backend/update_student_stages.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== UPDATING STUDENT STAGE IDs TO 6 (HỌC VIÊN) ===\n";

// Update contacts with status = 'customer' and stage_id not in (5, 6, 7) or null/1
$stmt = $pdo->prepare("UPDATE contacts SET stage_id = 6 WHERE status = 'customer' AND (stage_id IS NULL OR stage_id IN (1, 2, 3, 4))");
$stmt->execute();
$count = $stmt->rowCount();

echo "Successfully updated stage_id to 6 (Học viên) for {$count} contacts.\n";
