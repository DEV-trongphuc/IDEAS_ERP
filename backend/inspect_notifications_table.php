<?php
require_once __DIR__ . '/db_connect.php';
header('Content-Type: text/plain; charset=utf-8');

echo "=== NOTIFICATIONS TABLE SCHEMA ===\n";
$res = $conn->query("DESCRIBE notifications");
if ($res) {
    while ($row = $res->fetch_assoc()) {
        print_r($row);
    }
} else {
    echo "Error querying notifications table schema.\n";
}
