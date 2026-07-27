# Phân hệ 2: Ma trận Phân quyền & Bảo mật (RBAC Matrix)

Tệp tin này đặc tả kịch bản kiểm thử chi tiết cho hệ thống phân quyền dựa trên vai trò (Role-Based Access Control) và các chốt chặn bảo mật tại API Gateway của IDEAS ERP.

---

## 🔐 1. Danh sách quyền hạn chuẩn của 10 Roles

| Vai trò | Phân hệ HRM (`hrm`, `attendance`) | Phân hệ Tài chính (`deposits`, `expenses`, `invoices`) | Phân hệ Kinh doanh (`leads`, `deals`, `contacts`) | Cài đặt hệ thống (`settings`) |
| :--- | :--- | :--- | :--- | :--- |
| **superadmin** / **admin** | Toàn quyền (All) | Toàn quyền (All) | Toàn quyền (All) | Toàn quyền (All) |
| **director** | Toàn quyền (All) | Toàn quyền (All) | Toàn quyền (All) | Không có quyền (None) |
| **manager** | Xem ca trực / Duyệt phép nhóm (Team) | Gửi đề xuất chi phí / Không duyệt cọc | Quản lý leads/deals thuộc nhóm (Team) | Không có quyền (None) |
| **assistant** | Chỉ xem (Read) | Duyệt đặt cọc (All) | Quản lý leads toàn công ty (All) | Không có quyền (None) |
| **sales** / **sale** | Chỉ xem cá nhân (Own) | Đăng ký tạm ứng / Chi phí (Own) | Chỉ CRUD Leads/Deals tự sở hữu (Own) | Không có quyền (None) |
| **viewer** | Chỉ xem (Read) | Chỉ xem (Read) | Chỉ xem (Read) | Không có quyền (None) |
| **hr** | Quản lý hồ sơ, bảng lương, trực ca (All) | Phê duyệt đề xuất văn phòng phẩm, tuyển dụng (All) | Xem thông tin liên hệ phục vụ tuyển dụng | Không có quyền (None) |
| **accountant** | Xem bảng chấm công tính lương (Read) | Kiểm tra cọc, chi phí, hóa đơn, báo cáo (All) | Chỉ xem giao dịch (Read) | Không có quyền (None) |
| **marketing** | Không có quyền (None) | Gửi đề xuất chi tiêu chiến dịch (Own) | Quản lý leads, chiến dịch, nguồn chia (All) | Không có quyền (None) |

---

## 🛡️ 2. Kịch bản Kiểm thử Bảo mật API (Bypass/Escalation Prevention)

### Kịch bản 2.1: Chặn leo thang quyền hạn (Privilege Escalation Block)
*   **Các bước thực hiện**:
    1. Đăng nhập bằng tài khoản **Sale** (`sale@ideas.test`).
    2. Gửi API `POST` đến `/add_account` hoặc `/edit_account` với payload chỉ định `role = 'admin'` hoặc `role = 'superadmin'`.
    3. Gửi yêu cầu đổi mật khẩu cho tài khoản Admin khác qua API.
*   **Kết quả mong đợi**:
    *   Hệ thống phải lập tức trả về mã lỗi **403 Forbidden**.
    *   Mật khẩu của tài khoản Admin không bị thay đổi.
    *   Hệ thống ghi lại nhật ký hoạt động (Audit Logs) về hành vi vi phạm phân quyền.

### Kịch bản 2.2: Chặn Viewer sửa đổi dữ liệu (Read-only Guard)
*   **Các bước thực hiện**:
    1. Đăng nhập bằng tài khoản **Viewer** (`viewer@ideas.test`).
    2. Gửi API `POST` hoặc `PUT` đến `/contacts`, `/leads`, `/expenses`.
*   **Kết quả mong đợi**:
    *   Hệ thống từ chối thực thi và trả về lỗi **403 Forbidden**.
    *   Không có bản ghi nào được thêm mới hoặc cập nhật trong CSDL.

### Kịch bản 2.3: Sandboxing dữ liệu nhóm của Sale & Manager
*   **Các bước thực hiện**:
    1. Đăng nhập bằng tài khoản **Sale A**.
    2. Thử gọi API `GET` để xem chi tiết một Lead sở hữu bởi **Sale B** thông qua ID trực tiếp.
*   **Kết quả mong đợi**:
    *   Hệ thống trả về **403 Forbidden** hoặc **404 Not Found** (do Sandboxing lọc phạm vi truy vấn theo ID người sở hữu).
