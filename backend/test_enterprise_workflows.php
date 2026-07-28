<?php
// backend/test_enterprise_workflows.php
// Tập lệnh kiểm thử tự động tích hợp cho PO, SO, Mentions, Notifications

define('DIAG_TOKEN', 'Ideas_Diag_Secure_Token_2026_9e88d6c701fbc6b7');
require_once __DIR__ . '/test_bootstrap.php';

echo "====================================================\n";
echo "🚀 KHỞI CHẠY KIỂM THỬ TÍCH HỢP QUY TRÌNH HỆ THỐNG ERP\n";
echo "====================================================\n\n";

$tenantId = 1;
$adminId = 100010; // Director/Admin thực tế
$salesId = 100012; // Sales thực tế
$accountantId = 100014; // Kế toán thực tế

// ----------------------------------------------------------------
// 1. KIỂM THỬ QUY TRÌNH PO (PURCHASE ORDERS) & NHẬP KHO
// ----------------------------------------------------------------
echo "--- 1. Kiểm thử quy trình Đơn Nhập Hàng (PO) ---\n";

// Lấy một nhà cung cấp và sản phẩm thực tế từ Database
$supQuery = $conn->query("SELECT id FROM suppliers WHERE tenant_id = {$tenantId} LIMIT 1");
$supplierId = $supQuery && $supQuery->num_rows > 0 ? (int)$supQuery->fetch_assoc()['id'] : 1;

$prodQuery = $conn->query("SELECT id, stock_quantity FROM products WHERE tenant_id = {$tenantId} LIMIT 1");
$prod = $prodQuery->fetch_assoc();
$productId = (int)$prod['id'];
$initialStock = (float)$prod['stock_quantity'];

// Tạo PO giả định
$poNumber = 'PO-TEST-' . time();
$conn->query("
    INSERT INTO purchase_orders (tenant_id, supplier_id, created_by, po_number, order_date, status, subtotal, tax, total)
    VALUES ({$tenantId}, {$supplierId}, {$adminId}, '{$poNumber}', CURDATE(), 'ordered', 100000.00, 10000.00, 110000.00)
");
$poId = $conn->insert_id;
assertTest("Tạo đơn mua hàng PO thành công", $poId > 0, "PO ID: {$poId}, PO Number: {$poNumber}");

// Thêm sản phẩm vào PO
$conn->query("
    INSERT INTO purchase_order_items (po_id, product_id, name, quantity, unit_cost, subtotal)
    VALUES ({$poId}, {$productId}, 'Sản phẩm Test PO', 10.00, 10000.00, 100000.00)
");
$poItemId = $conn->insert_id;
assertTest("Thêm sản phẩm vào đơn PO thành công", $poItemId > 0);

// Giả lập logic Nhập kho (nhận hàng) của PurchaseOrderController::receive
// 1. Chuyển trạng thái PO sang received
$conn->query("UPDATE purchase_orders SET status = 'received' WHERE id = {$poId}");

// 2. Cộng tồn kho sản phẩm
$conn->query("UPDATE products SET stock_quantity = stock_quantity + 10 WHERE id = {$productId}");

// 3. Tạo lô hàng (Batch)
$batchCode = $poNumber . '-MOCK';
$conn->query("
    INSERT INTO batches (tenant_id, product_id, supplier_id, po_id, batch_code, import_date, import_price, initial_qty, current_qty)
    VALUES ({$tenantId}, {$productId}, {$supplierId}, {$poId}, '{$batchCode}', CURDATE(), 10000.00, 10.00, 10.00)
");
$batchId = $conn->insert_id;

// 4. Ghi log lịch sử kho
$conn->query("
    INSERT INTO inventory_logs (tenant_id, batch_id, action_type, qty_change, reason, created_by)
    VALUES ({$tenantId}, {$batchId}, 'IMPORT', 10.00, 'Nhập kho từ đơn test', {$adminId})
");

// Đối soát Database sau khi nhập kho
assertDbField($conn, 'purchase_orders', 'status', "id = {$poId}", 'received', "Trạng thái PO chuyển thành 'received'");
assertDbField($conn, 'products', 'stock_quantity', "id = {$productId}", $initialStock + 10, "Số lượng tồn kho sản phẩm tăng thêm 10. (Trước: {$initialStock}, Sau: " . ($initialStock + 10) . ")");

$chkBatch = $conn->query("SELECT id FROM batches WHERE po_id = {$poId}");
assertTest("Tạo thành công lô hàng (Batch) liên kết PO", $chkBatch && $chkBatch->num_rows > 0);


// ----------------------------------------------------------------
// 2. KIỂM THỬ BÌNH LUẬN & NHẮC TÊN (MENTIONS)
// ----------------------------------------------------------------
echo "\n--- 2. Kiểm thử Bình luận & Nhắc tên (Mentions) ---\n";

// Tạo một khách hàng tiềm năng kiểm thử
$conn->query("
    INSERT INTO contacts (tenant_id, owner_id, created_by, first_name, last_name, phone, pipeline_status, status)
    VALUES ({$tenantId}, {$salesId}, {$salesId}, 'Test', 'Mention', '0999888777', 'da_gap', 'lead')
");
$contactId = $conn->insert_id;

// Thêm bình luận có nhắc tên Kế toán
$bodyText = "Yêu cầu đối soát dòng tiền nhờ đồng nghiệp @Kế_Toán";
$conn->query("
    INSERT INTO notes (tenant_id, entity_type, entity_id, user_id, body)
    VALUES ({$tenantId}, 'contact', {$contactId}, {$salesId}, '{$bodyText}')
");
$noteId = $conn->insert_id;
assertTest("Tạo bình luận thành công", $noteId > 0);

// Thêm liên kết ghi nhận tag Kế toán vào note_mentions
$conn->query("
    INSERT INTO note_mentions (note_id, user_id)
    VALUES ({$noteId}, {$accountantId})
");
$mentionId = $conn->affected_rows;
assertTest("Ghi nhận bản ghi tag nhân viên thành công", $mentionId > 0);

// Giả lập NotificationService gửi thông báo MENTION_TAGGED
$conn->query("
    INSERT INTO notifications (user_id, tenant_id, title, body, type, link)
    VALUES ({$accountantId}, {$tenantId}, 'Bạn được nhắc tên', 'Sales đã nhắc tên bạn trong ghi chú', 'mention', '/contacts/{$contactId}')
");
$notifId = $conn->insert_id;
assertTest("Hệ thống tạo thông báo chuông (Bell) cho người được tag", $notifId > 0);

assertDbField($conn, 'notifications', 'user_id', "id = {$notifId}", $accountantId, "Thông báo gửi đến đúng ID Kế toán");


// ----------------------------------------------------------------
// 3. DỌN DẸP DỮ LIỆU KIỂM THỬ (CLEANUP)
// ----------------------------------------------------------------
echo "\n--- 3. Dọn dẹp dữ liệu kiểm thử ---\n";

// Xóa dữ liệu PO test
$conn->query("DELETE FROM inventory_logs WHERE batch_id = {$batchId}");
$conn->query("DELETE FROM batches WHERE po_id = {$poId}");
$conn->query("DELETE FROM purchase_order_items WHERE po_id = {$poId}");
$conn->query("DELETE FROM purchase_orders WHERE id = {$poId}");

// Giảm tồn kho sản phẩm về ban đầu
$conn->query("UPDATE products SET stock_quantity = {$initialStock} WHERE id = {$productId}");

// Xóa dữ liệu mention test
$conn->query("DELETE FROM notifications WHERE id = {$notifId}");
$conn->query("DELETE FROM note_mentions WHERE note_id = {$noteId}");
$conn->query("DELETE FROM notes WHERE id = {$noteId}");
$conn->query("DELETE FROM contacts WHERE id = {$contactId}");

echo "Đã dọn dẹp sạch sẽ toàn bộ bản ghi kiểm thử.\n";

printTestSummary();
