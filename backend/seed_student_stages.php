<?php
// backend/seed_student_stages.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== SEEDING CONTACTS INTO STUDENT STAGES ===\n";

// Get stage IDs
$stmt = $pdo->prepare("SELECT id, system_slug FROM pipeline_stages WHERE system_slug IN ('nop_ho_so', 'dong_le_phi_ho_so')");
$stmt->execute();
$stages = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);

$nopHoSoId = $stages['nop_ho_so'] ?? 4;
$dongLePhiId = $stages['dong_le_phi_ho_so'] ?? 5;

// Find contacts to update
$contacts = $pdo->query("SELECT id FROM contacts WHERE status = 'lead' LIMIT 6")->fetchAll(PDO::FETCH_COLUMN);

if (count($contacts) >= 6) {
    // Update first 3 to 'nop_ho_so'
    $stmt1 = $pdo->prepare("UPDATE contacts SET stage_id = ?, status = 'lead' WHERE id IN (?, ?, ?)");
    $stmt1->execute([$nopHoSoId, $contacts[0], $contacts[1], $contacts[2]]);
    echo "Moved 3 contacts to stage 'nop_ho_so' (ID: {$contacts[0]}, {$contacts[1]}, {$contacts[2]})\n";

    // Update next 3 to 'dong_le_phi_ho_so'
    $stmt2 = $pdo->prepare("UPDATE contacts SET stage_id = ?, status = 'lead' WHERE id IN (?, ?, ?)");
    $stmt2->execute([$dongLePhiId, $contacts[3], $contacts[4], $contacts[5]]);
    echo "Moved 3 contacts to stage 'dong_le_phi_ho_so' (ID: {$contacts[3]}, {$contacts[4]}, {$contacts[5]})\n";
} else {
    echo "Not enough lead contacts found to seed stages!\n";
}

echo "=== SEEDING COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
