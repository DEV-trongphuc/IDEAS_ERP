<?php
// backend/test_extended_rbac_suite.php
// Extended RBAC & Database verification suite for new roles (HR, Accountant, Marketing)
// Initiates the testing harness bootstrap

define('DIAG_TOKEN', true); // Allow bootstrap bypass
require_once __DIR__ . '/test_bootstrap.php';
require_once __DIR__ . '/permission_matrix_helper.php';

echo "====================================================\n";
echo "🔐 BAT DAU KIEM THU PHAN QUYEN MO RONG (EXTENDED RBAC SUITE)\n";
echo "====================================================\n\n";

// 1. Kiểm tra cấu trúc CSDL thực tế (Staging Database Column Enum)
$roleEnumResult = $conn->query("DESCRIBE users");
$roleEnumVal = '';
if ($roleEnumResult) {
    while ($row = $roleEnumResult->fetch_assoc()) {
        if ($row['Field'] === 'role') {
            $roleEnumVal = $row['Type'];
            break;
        }
    }
}

$hasHrRole = (strpos($roleEnumVal, "'hr'") !== false);
$hasAccountantRole = (strpos($roleEnumVal, "'accountant'") !== false);
$hasMarketingRole = (strpos($roleEnumVal, "'marketing'") !== false);

assertTest("CSDL: Cấu hình enum role chứa vai trò 'hr'", $hasHrRole, "Enum value: $roleEnumVal");
assertTest("CSDL: Cấu hình enum role chứa vai trò 'accountant'", $hasAccountantRole, "Enum value: $roleEnumVal");
assertTest("CSDL: Cấu hình enum role chứa vai trò 'marketing'", $hasMarketingRole, "Enum value: $roleEnumVal");

// 2. Kiểm tra sự tồn tại của 3 tài khoản thử nghiệm
assertDbField($conn, 'users', 'role', "email = 'hr@Ideas.test'", 'hr', "Tài khoản hr@Ideas.test có role 'hr'");
assertDbField($conn, 'users', 'role', "email = 'accountant@Ideas.test'", 'accountant', "Tài khoản accountant@Ideas.test có role 'accountant'");
assertDbField($conn, 'users', 'role', "email = 'marketing@Ideas.test'", 'marketing', "Tài khoản marketing@Ideas.test có role 'marketing'");

// 3. Kiểm tra logic phân quyền (Permission Matrix Helper Scopes)
$hrUser = ['user_id' => 100013, 'tenant_id' => 1, 'role' => 'hr'];
$acctUser = ['user_id' => 100014, 'tenant_id' => 1, 'role' => 'accountant'];
$mktUser = ['user_id' => 100015, 'tenant_id' => 1, 'role' => 'marketing'];

// Test HR Permission Scopes
assertTest("HR Scope: Quản lý nhân sự (hrm) -> 'all'", getModulePermissionScope($hrUser, 'hrm', 'read') === 'all');
assertTest("HR Scope: Quản lý chấm công (attendance) -> 'all'", getModulePermissionScope($hrUser, 'attendance', 'read') === 'all');
assertTest("HR Scope: Cài đặt hệ thống (settings) -> 'none'", getModulePermissionScope($hrUser, 'settings', 'write') === 'none');
assertTest("HR Scope: Lead/Kinh doanh mặc định -> 'own'", getModulePermissionScope($hrUser, 'deals', 'read') === 'own');

// Test Accountant Permission Scopes
assertTest("Accountant Scope: Đơn hàng & cọc (deposits) -> 'all'", getModulePermissionScope($acctUser, 'deposits', 'read') === 'all');
assertTest("Accountant Scope: Chi phí (expenses) -> 'all'", getModulePermissionScope($acctUser, 'expenses', 'read') === 'all');
assertTest("Accountant Scope: Hóa đơn (invoices) -> 'all'", getModulePermissionScope($acctUser, 'invoices', 'read') === 'all');
assertTest("Accountant Scope: Cài đặt hệ thống (settings) -> 'none'", getModulePermissionScope($acctUser, 'settings', 'write') === 'none');

// Test Marketing Permission Scopes
assertTest("Marketing Scope: Lead data (leads) -> 'all'", getModulePermissionScope($mktUser, 'leads', 'read') === 'all');
assertTest("Marketing Scope: Chiến dịch (campaigns) -> 'all'", getModulePermissionScope($mktUser, 'campaigns', 'read') === 'all');
assertTest("Marketing Scope: Dự án (projects) -> 'all'", getModulePermissionScope($mktUser, 'projects', 'read') === 'all');
assertTest("Marketing Scope: Cài đặt hệ thống (settings) -> 'none'", getModulePermissionScope($mktUser, 'settings', 'write') === 'none');

printTestSummary();
