<?php
// backend/migrate_actual_work_hours.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== STARTING DATABASE WORK HOURS MIGRATION ===\n";

$newSchedule = [
    "1" => ["active" => true, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "2" => ["active" => true, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "3" => ["active" => true, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "4" => ["active" => true, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "5" => ["active" => true, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "6" => ["active" => false, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"],
    "7" => ["active" => false, "start" => "08:00", "end" => "12:00", "start_afternoon" => "13:00", "end_afternoon" => "17:00"]
];

$newScheduleJson = json_encode($newSchedule);

// Update global_work_schedule
$stmt = $conn->prepare("UPDATE system_settings SET setting_value = ? WHERE setting_key = 'global_work_schedule'");
$stmt->bind_param("s", $newScheduleJson);
$stmt->execute();
$affected1 = $stmt->affected_rows;
$stmt->close();

// Update global_work_start_time
$stmt = $conn->prepare("UPDATE system_settings SET setting_value = '08:00' WHERE setting_key = 'global_work_start_time'");
$stmt->execute();
$affected2 = $stmt->affected_rows;
$stmt->close();

// Update global_work_end_time
$stmt = $conn->prepare("UPDATE system_settings SET setting_value = '12:00' WHERE setting_key = 'global_work_end_time'");
$stmt->execute();
$affected3 = $stmt->affected_rows;
$stmt->close();

echo "Migration finished.\n";
echo "global_work_schedule affected: " . $affected1 . "\n";
echo "global_work_start_time affected: " . $affected2 . "\n";
echo "global_work_end_time affected: " . $affected3 . "\n";
?>
