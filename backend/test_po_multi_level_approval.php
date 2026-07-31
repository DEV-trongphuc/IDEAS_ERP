<?php
// backend/test_po_multi_level_approval.php
// IDEAS ERP - Script Kiểm thử luồng Duyệt PO nhiều cấp

class ResponseException extends Exception {
    public $code;
    public $data;
    public $msg;
    public $success;
    public function __construct(int $code, $data, string $message, bool $success) {
        $this->code = $code;
        $this->data = $data;
        $this->msg = $message;
        $this->success = $success;
        parent::__construct($message, $code);
    }
}

global $lastResponse;
$lastResponse = null;

if (!function_exists('respond')) {
    function respond(int $code, $data = null, string $message = '', bool $success = true): void {
        global $lastResponse;
        $lastResponse = [
            'code' => $code,
            'data' => $data,
            'message' => $message,
            'success' => $success
        ];
        throw new ResponseException($code, $data, $message, $success);
    }
}

if (!function_exists('getBody')) {
    function getBody(): array {
        global $mockBody;
        return $mockBody ?? [];
    }
}

if (!function_exists('logActivity')) {
    function logActivity($db, $tenantId, $userId, $action, $resourceType, $resourceId, $details = ''): void {
        // Mock logActivity
    }
}

require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/controllers/PurchaseOrderController.php';

echo "====================================================\n";
echo "🚀 BẮT ĐẦU KIỂM THỬ: DUYỆT PO NHIỀU CẤP (UP TO 3 LEVELS)\n";
echo "====================================================\n\n";

$tenantId = 1;
// Lấy danh sách users để test
$userRes = $conn->query("SELECT id FROM users WHERE is_active = 1 LIMIT 3");
$users = [];
while ($row = $userRes->fetch_assoc()) {
    $users[] = (int)$row['id'];
}

// Nếu không đủ 3 user, lấy mặc định
$user1 = $users[0] ?? 100009;
$user2 = $users[1] ?? 100010;
$user3 = $users[2] ?? 100011;

echo "Dùng các tài khoản duyệt: Cấp 1 = {$user1}, Cấp 2 = {$user2}, Cấp 3 = {$user3}\n\n";

// Lấy hoặc tạo Supplier hợp lệ
$supRes = $conn->query("SELECT id FROM suppliers LIMIT 1");
if ($supRes && $supRes->num_rows > 0) {
    $supplierId = (int)$supRes->fetch_assoc()['id'];
} else {
    $conn->query("INSERT INTO suppliers (tenant_id, name, created_by) VALUES ({$tenantId}, 'Supplier Test PO Multi', {$user1})");
    $supplierId = $conn->insert_id;
}

$authCreator = [
    'user_id' => $user1,
    'tenant_id' => $tenantId,
    'role' => 'staff'
];

$poController = new PurchaseOrderController($pdo);

// ---------------------------------------------------------------------
// TEST 1: Tạo PO có 3 cấp duyệt
// ---------------------------------------------------------------------
echo "📌 1. Tạo PO mới với 3 cấp phê duyệt...\n";
global $mockBody;
$mockBody = [
    'supplier_id' => $supplierId,
    'order_date' => date('Y-m-d'),
    'notes' => 'Test PO 3 levels approval',
    'subtotal' => 1500000.00,
    'tax_rate' => 10,
    'tax' => 150000.00,
    'total' => 1650000.00,
    'approver_id' => $user1,
    'approver_id_2' => $user2,
    'approver_id_3' => $user3,
    'items' => [
        [
            'product_id' => null,
            'name' => 'Sản phẩm Test Cấp Duyệt 1',
            'quantity' => 5,
            'unit_cost' => 300000.00,
            'subtotal' => 1500000.00
        ]
    ]
];

$poId = 0;
try {
    $poController->store($authCreator);
} catch (ResponseException $e) {
    if ($e->code === 500) {
        echo "LỖI KHI TẠO ĐƠN HÀNG: " . $e->msg . "\n";
    }
    $poData = $e->data;
    $poId = $poData['id'] ?? 0;
}

assertTest("Khởi tạo PO thành công", $poId > 0, "PO ID: " . $poId);
assertDbField($conn, 'purchase_orders', 'status', "id = {$poId}", 'pending_approval', 'Trạng thái PO ban đầu');
assertDbField($conn, 'purchase_orders', 'approval_status', "id = {$poId}", 'pending', 'Trạng thái duyệt PO ban đầu');
assertDbField($conn, 'purchase_orders', 'status_level_1', "id = {$poId}", 'pending', 'Trạng thái Cấp 1 ban đầu');
assertDbField($conn, 'purchase_orders', 'status_level_2', "id = {$poId}", 'pending', 'Trạng thái Cấp 2 ban đầu');
assertDbField($conn, 'purchase_orders', 'status_level_3', "id = {$poId}", 'pending', 'Trạng thái Cấp 3 ban đầu');

// ---------------------------------------------------------------------
// TEST 2: Thử nhập kho đơn hàng khi chưa được duyệt đầy đủ
// ---------------------------------------------------------------------
echo "\n📌 2. Kiểm tra chặn nhập kho khi đơn chưa duyệt...\n";
$authWarehouse = [
    'user_id' => $user1,
    'tenant_id' => $tenantId,
    'role' => 'admin'
];

$receivedCode = 0;
try {
    $poController->receive($authWarehouse, $poId);
} catch (ResponseException $e) {
    $receivedCode = $e->code;
}
assertTest("Chặn nhập kho thành công (Trạng thái lỗi 422)", $receivedCode === 422, "Code trả về: " . $receivedCode);

// ---------------------------------------------------------------------
// TEST 3: Thực hiện quy trình duyệt từng cấp
// ---------------------------------------------------------------------
echo "\n📌 3. Thực hiện quy trình phê duyệt từng cấp...\n";

// Cấp 1 duyệt
$mockBody = ['status' => 'approved'];
$authAppr1 = ['user_id' => $user1, 'tenant_id' => $tenantId, 'role' => 'manager'];
try {
    $poController->approve($authAppr1, $poId);
} catch (ResponseException $e) {}
assertDbField($conn, 'purchase_orders', 'status_level_1', "id = {$poId}", 'approved', 'Cấp 1 phê duyệt thành công');
assertDbField($conn, 'purchase_orders', 'approval_status', "id = {$poId}", 'pending', 'Tổng duyệt vẫn pending chờ Cấp 2');

// Cấp 2 duyệt
$authAppr2 = ['user_id' => $user2, 'tenant_id' => $tenantId, 'role' => 'manager'];
try {
    $poController->approve($authAppr2, $poId);
} catch (ResponseException $e) {}
assertDbField($conn, 'purchase_orders', 'status_level_2', "id = {$poId}", 'approved', 'Cấp 2 phê duyệt thành công');
assertDbField($conn, 'purchase_orders', 'approval_status', "id = {$poId}", 'pending', 'Tổng duyệt vẫn pending chờ Cấp 3');

// Cấp 3 duyệt
$authAppr3 = ['user_id' => $user3, 'tenant_id' => $tenantId, 'role' => 'director'];
try {
    $poController->approve($authAppr3, $poId);
} catch (ResponseException $e) {}
assertDbField($conn, 'purchase_orders', 'status_level_3', "id = {$poId}", 'approved', 'Cấp 3 phê duyệt thành công');
assertDbField($conn, 'purchase_orders', 'approval_status', "id = {$poId}", 'approved', 'Tổng duyệt đã approved thành công');
assertDbField($conn, 'purchase_orders', 'status', "id = {$poId}", 'ordered', 'Trạng thái PO đã cập nhật thành ordered');

// ---------------------------------------------------------------------
// TEST 4: Thực hiện nhập kho sau khi đã duyệt đầy đủ
// ---------------------------------------------------------------------
echo "\n📌 4. Thực hiện nhập kho đơn hàng sau khi duyệt thành công...\n";
$receiveSuccessCode = 0;
try {
    $poController->receive($authWarehouse, $poId);
} catch (ResponseException $e) {
    $receiveSuccessCode = $e->code;
}
assertTest("Nhập kho thành công (Trạng thái code 200)", $receiveSuccessCode === 200, "Code trả về: " . $receiveSuccessCode);
assertDbField($conn, 'purchase_orders', 'status', "id = {$poId}", 'received', 'Trạng thái PO sau nhập kho');

// ---------------------------------------------------------------------
// TEST 5: Kiểm tra hạn mức phê duyệt 3 cấp (Threshold Validation)
// ---------------------------------------------------------------------
echo "\n📌 5. Kiểm tra hạn mức phê duyệt 3 cấp...\n";

// A. Tạo PO lớn hơn hoặc bằng 5 triệu (ví dụ 6 triệu) nhưng thiếu người duyệt Cấp 2, 3
$mockBody = [
    'supplier_id' => $supplierId,
    'order_date' => date('Y-m-d'),
    'notes' => 'Test PO trên 5tr thiếu cấp duyệt',
    'subtotal' => 5500000.00,
    'tax_rate' => 10,
    'tax' => 550000.00,
    'total' => 6050000.00,
    'approver_id' => $user1,
    'approver_id_2' => null, // Thiếu cấp 2
    'approver_id_3' => null, // Thiếu cấp 3
    'items' => [
        [
            'product_id' => null,
            'name' => 'Sản phẩm Test Giá Cao',
            'quantity' => 1,
            'unit_cost' => 5500000.00,
            'subtotal' => 5500000.00
        ]
    ]
];

$storeErrorCode = 0;
try {
    $poController->store($authCreator);
} catch (ResponseException $e) {
    $storeErrorCode = $e->code;
}
assertTest("Chặn tạo PO >= 5tr khi thiếu cấp duyệt thành công (Trạng thái 422)", $storeErrorCode === 422, "Code trả về: " . $storeErrorCode);

echo "\n";
printTestSummary();
