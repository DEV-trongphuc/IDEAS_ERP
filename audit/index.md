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

### 📂 8. Kho sản phẩm, Hợp tác chia phí & Báo cáo (Inventory, Splits & Analytics)
*   **Tệp tin**: [inventory_cooperation_reports.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/inventory_cooperation_reports.md)
*   **Nội dung**: Kiểm thử giỏ hàng dự án, cơ chế giữ chỗ căn hộ trực tuyến (khóa giỏ hàng 15 phút), chia sẻ hoa hồng dự án (Cooperation slips), các biểu đồ thống kê hiệu suất Sale / phễu chuyển đổi và lưu vết kiểm toán (Audit logs).

### 📂 9. Hoạt động CRM, Khách hàng Doanh nghiệp & Vé hỗ trợ (CRM Activities & Tickets)
*   **Tệp tin**: [crm_activities_companies_tickets.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/crm_activities_companies_tickets.md)
*   **Nội dung**: Kiểm thử ghi nhận lịch sử tương tác khách hàng (cuộc gọi, email, gặp mặt), lên lịch hẹn bám sát lead, liên kết Công ty - Người liên hệ, và tiếp nhận phân bổ Vé hỗ trợ kỹ thuật/khiếu nại (Helpdesk Tickets) kèm cam kết SLA.

### 📂 10. Mua hàng, Nhà cung cấp, Báo giá & Tệp tin đám mây (Purchase Orders, Quotes & Cloud Storage)
*   **Tệp tin**: [purchase_orders_suppliers_quotes.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/purchase_orders_suppliers_quotes.md)
*   **Nội dung**: Kiểm thử quy trình tạo và duyệt đơn đặt mua thiết bị/vật tư (Purchase Orders), cập nhật công nợ nhà cung cấp, xuất bản file PDF báo giá chi tiết (Quotes), và phân quyền lưu trữ thư mục tài liệu nhạy cảm trên Cloud.

### 📂 11. Trợ lý AI, Dữ liệu Huấn luyện & Cơ cấu Tổ chức (AI Chatbot, Training & Organization)
*   **Tệp tin**: [ai_chat_training_organization.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/ai_chat_training_organization.md)
*   **Nội dung**: Kiểm thử trợ lý AI tư vấn dự án theo thời gian thực, nạp dữ liệu tri thức huấn luyện AI (Knowledge Base Vector Embeddings) và thiết lập cơ cấu phòng ban đội nhóm phân cấp báo cáo.

### 📂 12. Kế toán, Tài chính, Hóa đơn & Chi phí (Accounting & Finance)
*   **Tệp tin**: [accounting_finance_invoices_expenses.md](file:///d:/GITHUB_SPACE/IDEAS_ERP/audit/accounting_finance_invoices_expenses.md)
*   **Nội dung**: Kiểm thử xuất bản hóa đơn thu tiền từ phiếu đặt cọc, xác nhận thanh toán hóa đơn (Mark Paid), quy trình nhân viên gửi đề xuất chi phí, Kế toán và Admin phê duyệt đề xuất chi giải ngân và báo cáo đối soát dòng tiền ròng (Net cash flow).

---

## 📋 Hướng dẫn thực thi & Tự động hóa
1. **Chạy bộ kiểm thử tự động (Automation Runner)**: Thực thi tệp `master_all_backend_test_runner.php` trên máy chủ Staging để tự động chạy các test suite RBAC, Business Rules và CSDL.
2. **Kiểm thử thủ công (Manual Verification)**: Sử dụng các tài khoản demo tương ứng với từng vai trò trên môi trường Web Staging để xác minh giao diện và trải nghiệm thực tế.
