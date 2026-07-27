# Phân hệ 2: Ma trận Phân quyền & Bảo mật (RBAC Matrix)

Tài liệu này đặc tả chi tiết kỹ thuật các API endpoint, cấu trúc payload và mã phản hồi HTTP dùng để kiểm thử ma trận phân quyền trên hệ thống IDEAS ERP.

---

## 🔐 1. Chi tiết API Endpoint & Bản đồ Phân quyền

### 1.1. Module HRM (`hrm`)
*   **API danh sách nhân sự**: `GET /backend/api.php?action=hrm/profiles`
    *   *superadmin / admin / director / hr*: Trả về `200 OK` kèm danh sách toàn bộ nhân sự và bảng lương cơ bản.
    *   *accountant*: Trả về `200 OK` nhưng lọc bỏ thông tin bảo mật lương của HR/Admin, chỉ hiển thị số liệu chấm công.
    *   *sale / sales / marketing / assistant / viewer*: Trả về `200 OK` nhưng chỉ chứa duy nhất thông tin của tài khoản cá nhân đang đăng nhập (hoặc trả về `403 Forbidden` đối với các thông tin chi tiết).
*   **API cập nhật hồ sơ lương nhân sự**: `POST /backend/api.php?action=hrm/profiles`
    *   *superadmin / admin / director / hr*: Trả về `200 OK` sau khi lưu.
    *   *Tất cả các vai trò khác*: Trả về `403 Forbidden`.

### 1.2. Module Đặt cọc (`deposits`)
*   **API duyệt đợt thanh toán (Milestones)**: `POST /backend/api.php?action=deposits/{id}/milestones/{milestone_id}/approve`
    *   *superadmin / admin / director / assistant / accountant*: Trả về `200 OK` và đổi trạng thái milestone sang `approved`.
    *   *sale / sales / marketing / hr / viewer*: Trả về `403 Forbidden`.

### 1.3. Module Chi phí & Đề xuất Chi (`expenses`)
*   **API phê duyệt đề xuất chi**: `POST /backend/api.php?action=expenses/{id}/approve`
    *   *superadmin / admin / director / manager / accountant / hr*: Trả về `200 OK`.
    *   *sale / sales / marketing / viewer*: Trả về `403 Forbidden`.

---

## 🛡️ 2. Kịch bản Kiểm thử Bảo mật & Payload Kiểm chứng

### Kịch bản 2.1: Chặn nâng cấp đặc quyền (Privilege Escalation)
*   **Mô tả**: Tài khoản Sale cố gắng gửi payload để tự đổi vai trò của mình thành `admin`.
*   **Chi tiết API**: `PUT /backend/api.php?action=users/update`
*   **Payload gửi lên từ tài khoản Sale**:
    ```json
    {
      "id": 100009,
      "username": "sale_demo",
      "email": "sale@ideas.test",
      "role": "admin"
    }
    ```
*   **Bộ lọc xử lý ở Backend (`UserController.php` hoặc API Gateway)**:
    ```php
    // Kiểm tra quyền hạn trước khi cập nhật trường role
    if (isset($b['role']) && $b['role'] !== $existingRole) {
        if (!in_array($auth['role'], ['superadmin', 'admin', 'director', 'hr'], true)) {
            respond(403, null, 'Bạn không có quyền thay đổi vai trò tài khoản', false);
        }
    }
    ```
*   **Kết quả mong đợi**: Mã phản hồi trả về là `403 Forbidden`. Vai trò của tài khoản `100009` vẫn được giữ nguyên là `sale`.

### Kịch bản 2.2: Chặn tài khoản Viewer thực hiện ghi dữ liệu (Write Guard)
*   **Mô tả**: Tài khoản Viewer cố gắng tạo một thông tin liên hệ mới.
*   **Chi tiết API**: `POST /backend/api.php?action=contacts`
*   **Payload gửi lên**:
    ```json
    {
      "full_name": "Khách hàng Mới",
      "phone": "0909999888"
    }
    ```
*   **Kết quả mong đợi**:
    *   Mã phản hồi trả về là `403 Forbidden`.
    *   Truy vấn CSDL: `SELECT id FROM contacts WHERE phone = '0909999888'` không trả về kết quả nào.

### Kịch bản 2.3: Chặn truy cập chéo dữ liệu nhóm (Sales Boundary)
*   **Mô tả**: Sale A thuộc nhóm 1 thử đọc chi tiết khách hàng của Sale B thuộc nhóm 2.
*   **Chi tiết API**: `GET /backend/api.php?action=contacts&id={sale_b_contact_id}`
*   **Kết quả mong đợi**:
    *   Mã phản hồi trả về là `403 Forbidden` hoặc `404 Not Found`.
    *   Backend tự động chèn mệnh đề WHERE `owner_id = {current_user_id}` vào câu truy vấn trước khi chạy.
