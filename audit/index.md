# Bản đồ Kiểm thử Toàn diện (Master Test Map) - IDEAS ERP

Tài liệu này chứa bản đồ danh mục các cấu phần cần kiểm thử của ứng dụng IDEAS ERP. Để đảm bảo không bỏ sót bất kỳ chi tiết nào, kế hoạch kiểm thử được phân rã thành các tệp tin chuyên đề riêng biệt dưới đây:

---

## 🗺️ Các Phân hệ Kiểm thử Chuyên biệt

### 📂 1. Cơ sở dữ liệu & Toàn vẹn Dữ liệu
*   **Tệp tin**: [database_schema_integrity.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/database_schema_integrity.md)
*   **Nội dung**: Đối soát cấu trúc enums, khóa ngoại, kiểu dữ liệu, stress-test SQLSTATE (22007, 22001), kiểm tra các cột mới (`custom_fields_json`) và xử lý dữ liệu ngày tháng bị hỏng.

### 📂 2. Ma trận Phân quyền & Bảo mật (RBAC Matrix)
*   **Tệp tin**: [rbac_matrix_roles.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/rbac_matrix_roles.md)
*   **Nội dung**: Chi tiết ma trận quyền hạn cho 10 vai trò (`superadmin`, `admin`, `director`, `manager`, `assistant`, `sales`, `viewer`, `hr`, `accountant`, `marketing`), logic API gateways và các kịch bản chặn leo thang quyền hạn.

### 📂 3. Quy tắc Nghiệp vụ Đặc thù (Core Business Rules)
*   **Tệp tin**: [core_business_logic.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/core_business_logic.md)
*   **Nội dung**: Kiểm thử 4 quy tắc nghiệp vụ cốt lõi (Bể cọc trước/sau doanh thu, đổi căn hộ giữ audit trail, Conversion API Meta forward-only, thuật toán vòng chia & recall lead).

### 📂 4. Phân hệ Nhân sự & Lương bổng (HRM & Payroll)
*   **Tệp tin**: [hrm_payroll_allowances.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/hrm_payroll_allowances.md)
*   **Nội dung**: Phụ cấp tùy chỉnh động, công thức tính lương tháng, tính bảo hiểm (BHXH, BHYT, BHTN), khấu trừ tạm ứng và tính hoa hồng doanh số (KPI).

### 📂 5. Luồng Dữ liệu Frontend & Trạng thái UI (Frontend Payloads)
*   **Tệp tin**: [frontend_payloads_drawers.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/frontend_payloads_drawers.md)
*   **Nội dung**: Kiểm tra các biểu mẫu nhập liệu (forms), Drawer tài khoản, chế độ Read-only bảo mật, định dạng số điện thoại, và giới hạn file đính kèm.

### 📂 6. Hệ thống Thông báo & Tích hợp (Notifications & Bots)
*   **Tệp tin**: [notifications_zalo_telegram.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/notifications_zalo_telegram.md)
*   **Nội dung**: Kiểm thử NotificationService gửi thời gian thực, Zalo Bot OTP/tin nhắn, Telegram Bot SLA thông báo quá hạn và hàng đợi gửi email tự động.

### 📂 7. Quản lý Công việc & Quy trình tự động (Workflows & Tasks)
*   **Tệp tin**: [tasks_workflows_processes.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/tasks_workflows_processes.md)
*   **Nội dung**: Kiểm thử giao việc cá nhân (task lẻ), giao việc phòng ban/nhóm, task chăm sóc khách hàng (task sale), tag tên thành viên `@mention`, luồng phê duyệt trạng thái hoàn thành và quy trình mẫu tự động khi chuyển đổi Deal/Lead.

---

## 📋 Hướng dẫn thực thi & Tự động hóa
1. **Chạy bộ kiểm thử tự động (Automation Runner)**: Thực thi tệp `master_all_backend_test_runner.php` trên máy chủ Staging để tự động chạy các test suite RBAC, Business Rules và CSDL.
2. **Kiểm thử thủ công (Manual Verification)**: Sử dụng các tài khoản demo tương ứng với từng vai trò trên môi trường Web Staging để xác minh giao diện và trải nghiệm thực tế.
