<?php
// backend/seed_expenses.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== SEEDING REALISTIC OPERATING EXPENSES (PO) ===\n";

$users = $pdo->query("SELECT id FROM users WHERE role IN ('admin', 'superadmin', 'accountant') LIMIT 1")->fetchAll();
$creatorId = !empty($users) ? $users[0]['id'] : 100009;

// Clear existing expenses table
$pdo->exec("SET FOREIGN_KEY_CHECKS = 0");
$pdo->exec("TRUNCATE TABLE expenses");
$pdo->exec("SET FOREIGN_KEY_CHECKS = 1");

$expenses = [
    [
        'title' => 'Thuê máy chủ Cloud VPS quý 3/2026',
        'category' => 'IT & Hạ tầng',
        'vendor_name' => 'BizFly Cloud',
        'amount' => 6400000.00,
        'vat_amount' => 640000.00,
        'date' => '2026-08-01',
        'status' => 'approved',
        'notes' => 'Thanh toán phí duy trì hệ thống máy chủ'
    ],
    [
        'title' => 'Chi phí quảng cáo tuyển sinh Google Ads tháng 8/2026',
        'category' => 'Marketing',
        'vendor_name' => 'Google Asia Pacific',
        'amount' => 25000000.00,
        'vat_amount' => 0.00,
        'date' => '2026-08-05',
        'status' => 'approved',
        'notes' => 'Chi phí chạy ads Facebook & Google'
    ],
    [
        'title' => 'Mua văn phòng phẩm và giấy in đợt 2',
        'category' => 'Văn phòng phẩm',
        'vendor_name' => 'Nhà sách Fahasa',
        'amount' => 1850000.00,
        'vat_amount' => 185000.00,
        'date' => '2026-08-06',
        'status' => 'pending',
        'notes' => 'Giấy A4 Double A và bút mực các loại'
    ]
];

foreach ($expenses as $exp) {
    $stmt = $pdo->prepare("
        INSERT INTO expenses 
        (tenant_id, created_by, title, category, vendor_name, amount, vat_amount, date, status, notes, has_vat_invoice, is_vat_inclusive) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0)
    ");
    $stmt->execute([
        $creatorId,
        $exp['title'],
        $exp['category'],
        $exp['vendor_name'],
        $exp['amount'],
        $exp['vat_amount'],
        $exp['date'],
        $exp['status'],
        $exp['notes']
    ]);
    echo "Inserted Expense: " . $exp['title'] . "\n";
}

echo "=== SEEDING EXPENSES COMPLETED SUCCESSFULLY ===\n";
unlink(__FILE__);
