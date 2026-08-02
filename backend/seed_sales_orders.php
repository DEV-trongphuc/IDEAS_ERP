<?php
// backend/seed_sales_orders.php
require_once __DIR__ . '/test_bootstrap.php';

echo "=== SEEDING REAL DEMO DEPOSITS / SALES ORDERS ===\n\n";

try {
    $tenantId = 1; // Default tenant

    // 1. Fetch some contacts to link the Deposits to
    $contacts = $pdo->query("SELECT id FROM contacts WHERE tenant_id = {$tenantId} LIMIT 5")->fetchAll();
    if (empty($contacts)) {
        echo "Error: No contacts found to link. Please seed contacts first.\n";
        exit;
    }

    // 2. Fetch some projects
    $projects = $pdo->query("SELECT id FROM projects WHERE tenant_id = {$tenantId} LIMIT 3")->fetchAll();
    if (empty($projects)) {
        echo "Error: No projects found to link. Please seed projects first.\n";
        exit;
    }

    // 3. Fetch users for created_by
    $users = $pdo->query("SELECT id FROM users WHERE tenant_id = {$tenantId} LIMIT 3")->fetchAll();
    $userIds = !empty($users) ? array_column($users, 'id') : [1];

    // Clear existing test deposits
    $pdo->query("DELETE FROM deposit_milestones WHERE deposit_id IN (SELECT id FROM deposits WHERE notes LIKE 'DEMO-SO-%')");
    $pdo->query("DELETE FROM deposits WHERE notes LIKE 'DEMO-SO-%'");
    echo "Cleaned up old demo deposit records.\n";

    // Products / Courses names for items
    $products = [
        ['name' => 'MBA-01', 'price' => 120000000, 'note' => 'Khóa học Thạc sĩ Quản trị Kinh doanh (MBA High Quality)'],
        ['name' => 'MINI-MBA', 'price' => 25000000, 'note' => 'Khóa học Mini MBA - Tinh hoa quản trị'],
        ['name' => 'LEAD-02', 'price' => 45000000, 'note' => 'Khóa học Kỹ năng Lãnh đạo cấp cao (Executive Leadership)'],
        ['name' => 'INHOUSE', 'price' => 75000000, 'note' => 'Chương trình Đào tạo Doanh nghiệp (In-house Training)'],
        ['name' => 'DIGITAL', 'price' => 150000000, 'note' => 'Tư vấn Chuyển đổi số & Tự động hóa Quy trình']
    ];

    $statuses = ['pending_admin', 'approved', 'cancelled'];

    $count = 0;
    foreach ($contacts as $index => $c) {
        $contactId = $c['id'];
        $projectId = $projects[$index % count($projects)]['id'];
        $createdBy = $userIds[array_rand($userIds)];
        
        $prod = $products[$index % count($products)];
        $price = $prod['price'];
        $expectedCommission = $price * 0.1; // 10% commission
        $status = $statuses[$index % count($statuses)];
        $unitCode = $prod['name'];
        $notes = "DEMO-SO-" . ($index + 1) . ": " . $prod['note'];

        // Insert Deposit
        $stmt = $pdo->prepare("
            INSERT INTO deposits 
            (contact_id, project_id, unit_code, price, expected_commission, status, created_by, notes, auto_remind, remind_days_before, remind_at_hour, currency, exchange_rate)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, 3, 8, 'VND', 1.0000)
        ");
        $stmt->execute([
            $contactId, $projectId, $unitCode, $price, $expectedCommission, $status, $createdBy, $notes
        ]);
        $depositId = $pdo->lastInsertId();

        // Insert 2 Milestones for each deposit (e.g. 50% deposit, 50% remaining)
        $m1Name = "Đợt 1 - Tạm ứng cọc 50%";
        $m1Amount = $price * 0.5;
        $m1Date = date('Y-m-d', strtotime("-5 days"));
        $m1Status = ($status === 'approved') ? 'approved' : 'pending';

        $m2Name = "Đợt 2 - Thanh toán nốt 50%";
        $m2Amount = $price * 0.5;
        $m2Date = date('Y-m-d', strtotime("+15 days"));
        $m2Status = 'pending';

        $stmtMilestone = $pdo->prepare("
            INSERT INTO deposit_milestones 
            (deposit_id, milestone_name, expected_amount, original_amount, expected_pay_date, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmtMilestone->execute([
            $depositId, $m1Name, $m1Amount, $m1Amount, $m1Date, $m1Status
        ]);
        $stmtMilestone->execute([
            $depositId, $m2Name, $m2Amount, $m2Amount, $m2Date, $m2Status
        ]);

        echo "Created Deposit: {$unitCode} (Total: " . number_format($price, 0, ',', '.') . "đ) - Status: {$status}\n";
        $count++;
    }

    echo "\n=== SEEDING COMPLETED: {$count} Deposits created. ===\n";

} catch (Exception $e) {
    echo "Error seeding: " . $e->getMessage() . "\n";
}
