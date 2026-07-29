<?php
// backend/migrate_demo_invoices.php
// Script di trú các Sales Order Demo từ bảng invoices sang bảng deposits để mở được Drawer SO

header('Content-Type: application/json; charset=utf-8');
require_once __DIR__ . '/db_connect.php';

$secretKey = $_REQUEST['key'] ?? '';
if ($secretKey !== 'Ideas2026') {
    http_response_code(403);
    echo json_encode(["success" => false, "message" => "Unauthorized"]);
    exit;
}

try {
    // 1. Lấy Project ID đầu tiên làm mặc định
    $resP = $conn->query("SELECT id FROM projects LIMIT 1");
    $projectRow = $resP->fetch_assoc();
    $projectId = $projectRow ? (int)$projectRow['id'] : 0;
    if (!$projectId) {
        echo json_encode(["success" => false, "message" => "Không tìm thấy dự án nào trong bảng projects."]);
        exit;
    }

    // 2. Tìm các invoice có deal_id nhưng chưa có bản ghi trong deposits
    $resInv = $conn->query("
        SELECT i.*, ct.first_name, ct.last_name
        FROM invoices i
        LEFT JOIN contacts ct ON i.contact_id = ct.id
        WHERE i.deal_id IS NOT NULL 
          AND i.deal_id NOT IN (SELECT id FROM deposits)
          AND i.deleted_at IS NULL
    ");
    
    $migrated = [];
    while ($inv = $resInv->fetch_assoc()) {
        $dealId = (int)$inv['deal_id'];
        $contactId = (int)$inv['contact_id'];
        $price = (float)$inv['total'];
        $expectedCommission = $price * 0.03; // Mặc định hoa hồng 3%
        $createdBy = (int)$inv['created_by'];
        $createdAt = $inv['created_at'];
        $status = $inv['status'] === 'paid' ? 'approved' : 'pending_admin';
        $notes = 'Di trú tự động từ hóa đơn demo ' . $inv['invoice_number'];
        $unitCode = 'Căn hộ Demo';

        // Insert vào bảng deposits (iiisddsisss)
        $stmtInsertDep = $conn->prepare("
            INSERT INTO deposits (id, contact_id, project_id, unit_code, price, expected_commission, status, created_by, auto_remind, remind_days_before, remind_at_hour, notes, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 3, 8, ?, ?, ?)
        ");
        $stmtInsertDep->bind_param("iiisddsisss", $dealId, $contactId, $projectId, $unitCode, $price, $expectedCommission, $status, $createdBy, $notes, $createdAt, $createdAt);
        $stmtInsertDep->execute();
        $stmtInsertDep->close();

        // Insert đợt thanh toán vào deposit_milestones (isdssss) - Sử dụng cột approval_date thay cho paid_at
        $milestoneName = 'Đợt 1 - Thanh toán cọc';
        $milestoneStatus = $inv['status'] === 'paid' ? 'approved' : 'pending';
        $paidAt = $inv['paid_at'];
        $uncPath = $inv['status'] === 'paid' ? 'https://ideas-erp.s3.ap-southeast-1.amazonaws.com/unc_sample.png' : null;

        $stmtInsertMile = $conn->prepare("
            INSERT INTO deposit_milestones (deposit_id, milestone_name, expected_amount, status, created_at, approval_date, unc_file_path)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ");
        $stmtInsertMile->bind_param("isdssss", $dealId, $milestoneName, $price, $milestoneStatus, $createdAt, $paidAt, $uncPath);
        $stmtInsertMile->execute();
        $stmtInsertMile->close();

        $migrated[] = [
            "invoice_number" => $inv['invoice_number'],
            "deal_id" => $dealId,
            "price" => $price,
            "status" => $status
        ];
    }

    echo json_encode([
        "success" => true,
        "count" => count($migrated),
        "data" => $migrated
    ], JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);

} catch (Throwable $e) {
    http_response_code(500);
    echo json_encode(["success" => false, "message" => $e->getMessage()]);
}
