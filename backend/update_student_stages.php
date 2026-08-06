<?php
// backend/update_student_stages.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== UPDATING STUDENT STAGE & PIPELINE STATUS TO HỌC VIÊN ===\n";

// Update contacts with status = 'customer' to stage_id = 6 and pipeline_status = 'hoc_vien'
$stmt = $pdo->prepare("UPDATE contacts SET stage_id = 6, pipeline_status = 'hoc_vien' WHERE status = 'customer' AND (stage_id IS NULL OR stage_id IN (1, 2, 3, 4) OR pipeline_status IS NULL OR pipeline_status IN ('chua_xac_dinh', 'co_nhu_cau', 'dang_tu_van', 'nop_ho_so'))");
$stmt->execute();
$count = $stmt->rowCount();

echo "Successfully updated stage_id to 6 and pipeline_status to 'hoc_vien' for {$count} contacts.\n";
