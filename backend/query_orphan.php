<?php
// backend/query_orphan.php
require_once __DIR__ . '/test_bootstrap.php';

$res = $conn->query("SELECT l.id, l.user_id, l.leave_type, l.start_date, l.end_date FROM hrm_leave_requests l LEFT JOIN users u ON l.user_id = u.id WHERE u.id IS NULL");
if ($res) {
    print_r($res->fetch_all(MYSQLI_ASSOC));
}
?>
