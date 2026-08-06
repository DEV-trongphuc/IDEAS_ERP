<?php
// backend/update_notes_school_intake.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== UPDATING STUDENT NOTES TO INCLUDE SCHOOL & INTAKE ===\n";

$jsonPath = __DIR__ . '/normalized_students.json';
if (!file_exists($jsonPath)) {
    echo "Error: normalized_students.json not found!\n";
    exit(1);
}

$students = json_decode(file_get_contents($jsonPath), true);
if (!is_array($students)) {
    echo "Error: Invalid JSON data!\n";
    exit(1);
}

$count = 0;
foreach ($students as $student) {
    $phone = $student['phone'];
    $email = $student['email'];
    $school = $student['school'];
    $intake = $student['intake'];
    $studentId = $student['student_id'];
    $degreeType = $student['degree_type'];
    $currentIntakeStatus = $student['current_intake_status'];
    $email2 = $student['email2'];
    $tvv = $student['tvv_original'];
    
    // Build new notes text
    $newNotesArr = [];
    if (!empty($school)) {
        $newNotesArr[] = "Trường: " . trim($school);
    }
    if (!empty($intake)) {
        $newNotesArr[] = "Intake: " . trim($intake);
    }
    if (!empty($studentId)) {
        $newNotesArr[] = "Mã học viên: " . trim($studentId);
    }
    if (!empty($degreeType)) {
        $newNotesArr[] = "Loại bằng: " . trim($degreeType);
    }
    if (!empty($currentIntakeStatus)) {
        $newNotesArr[] = "Đang học theo intake: " . trim($currentIntakeStatus);
    }
    if (!empty($email2)) {
        $newNotesArr[] = "Email phụ: " . trim($email2);
    }
    if (!empty($tvv)) {
        $newNotesArr[] = "TVV Excel gốc: " . trim($tvv);
    }
    $newNotesText = implode("\n", $newNotesArr);
    
    // Find contact by phone or email
    $existingId = null;
    if (!empty($phone)) {
        $stmt = $pdo->prepare("SELECT id FROM contacts WHERE phone = ? OR mobile = ? LIMIT 1");
        $stmt->execute([$phone, $phone]);
        $existingId = $stmt->fetchColumn();
    }
    if (!$existingId && !empty($email)) {
        $stmt = $pdo->prepare("SELECT id FROM contacts WHERE email = ? LIMIT 1");
        $stmt->execute([$email]);
        $existingId = $stmt->fetchColumn();
    }
    
    if ($existingId) {
        $stmtUpdate = $pdo->prepare("UPDATE contacts SET notes = ? WHERE id = ?");
        $stmtUpdate->execute([$newNotesText, $existingId]);
        $count++;
    }
}

echo "Successfully updated notes for {$count} contacts.\n";
