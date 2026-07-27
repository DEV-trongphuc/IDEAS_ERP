# Phân hệ 1: Kiểm thử Cấu trúc & Toàn vẹn Cơ sở dữ liệu (Database Schema & Integrity)

Tài liệu này đặc tả chi tiết kỹ thuật các kịch bản kiểm thử cấu trúc CSDL, các ràng buộc dữ liệu, và các câu lệnh SQL kiểm tra nhằm loại bỏ hoàn toàn các lỗi SQLSTATE trên hệ thống IDEAS ERP.

---

## 🗂️ 1. Bản đồ Kiểm thực Cấu trúc Bảng (Table & Column Mapping)

### 1.1. Bảng `users` (Tài khoản người dùng)
*   **Kiểm tra Enums cho vai trò (`role`)**:
    *   *Lệnh SQL kiểm tra*: `SHOW COLUMNS FROM users LIKE 'role';`
    *   *Kết quả mong đợi*: Cột `Type` phải hiển thị chính xác là `enum('super_admin','admin','manager','assistant','sales','viewer','superadmin','director','hr','accountant','marketing')`.
    *   *Ràng buộc mặc định*: `Default` là `sales`.
*   **Trường `team_id` (Phòng ban/Nhóm)**:
    *   *Lệnh SQL kiểm tra*: `SHOW COLUMNS FROM users LIKE 'team_id';`
    *   *Kết quả mong đợi*: Kiểu dữ liệu `int(11) NULL`. Phải có chỉ mục (INDEX) để tối ưu hóa truy vấn kết nối phòng ban.

### 1.2. Bảng `hrm_profiles` (Hồ sơ nhân sự)
*   **Trường `custom_fields_json` (Phụ cấp động)**:
    *   *Lệnh SQL kiểm tra*: `SHOW COLUMNS FROM hrm_profiles LIKE 'custom_fields_json';`
    *   *Kết quả mong đợi*: Kiểu dữ liệu `TEXT` hoặc `JSON` cho phép lưu trữ dữ liệu phi cấu trúc dưới dạng mảng JSON của các đối tượng `{ name: string, value: number }`.
*   **Trường `kpi_multiplier_rules` (Quy tắc KPI)**:
    *   *Kết quả mong đợi*: Kiểu dữ liệu `TEXT NULL` để chứa quy tắc tính hệ số nhân dựa trên doanh số thu thực tế.

### 1.3. Bảng `monthly_payslips` (Bảng lương tháng)
*   **Khóa duy nhất liên hợp (`uk_user_month`)**:
    *   *Lệnh SQL kiểm tra*: `SHOW INDEX FROM monthly_payslips WHERE Key_name = 'uk_user_month';`
    *   *Kết quả mong đợi*: Trả về index duy nhất (Non_unique = 0) kết hợp giữa hai trường `user_id` và `month_year`.
    *   *Kịch bản lỗi mong đợi*:
        ```sql
        -- Câu lệnh chạy thử:
        INSERT INTO monthly_payslips (user_id, month_year, basic_salary) VALUES (1, '2026-07', 10000000);
        -- Chèn dòng thứ 2 với cùng user_id và month_year:
        INSERT INTO monthly_payslips (user_id, month_year, basic_salary) VALUES (1, '2026-07', 12000000);
        -- Lỗi trả về: SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry '1-2026-07' for key 'uk_user_month'
        ```

---

## 🛡️ 2. Kịch bản Stress-Test Chống lỗi SQLSTATE đặc thù

### 2.1. Lỗi định dạng ngày tháng không hợp lệ (SQLSTATE 22007 - Incorrect date value)
Khi người dùng xóa sạch ngày sinh hoặc ngày vào làm trên giao diện React, trình duyệt sẽ gửi chuỗi rỗng `""` về backend.
*   **Kịch bản kiểm thử**:
    *   *Câu lệnh SQL mô phỏng lỗi*:
        ```sql
        UPDATE users SET dob = '' WHERE id = 1;
        ```
        *(MySQL ở chế độ STRICT_TRANS_TABLES sẽ ném lỗi SQLSTATE 22007)*
    *   **Bộ lọc xử lý ở Backend (Controller / Model)**:
        Trước khi thực hiện `execute()` câu lệnh chuẩn bị (Prepared Statement), backend phải chạy hàm chuẩn hóa dữ liệu:
        ```php
        $dob = (!empty($b['dob']) && trim($b['dob']) !== '') ? trim($b['dob']) : null;
        ```
    *   *Xác minh kết quả*:
        ```sql
        SELECT dob FROM users WHERE id = 1;
        -- Kết quả trả về phải là NULL thay vì báo lỗi 500 Internal Server Error.
        ```

### 2.2. Lỗi tràn độ dài dữ liệu (SQLSTATE 22001 - Data too long)
*   **Kịch bản kiểm thử**:
    *   Nhập số điện thoại dài 50 ký tự (`09090909090909090909090909090909090909090909090909`).
    *   Gửi payload lưu lên API `/contacts`.
    *   *Xử lý mong đợi*: Backend phải validate độ dài chuỗi đầu vào (`strlen($phone) <= 20`) và trả về lỗi `422 Unprocessable Entity` kèm mô tả chi tiết, chặn không cho câu lệnh SQL lỗi chạy xuống database.

---

## 🧹 3. Quy trình Kiểm tra & Sửa đổi Dữ liệu ngày tháng bị hỏng (Data Integrity Script)
*   **Vấn đề**: Trong quá trình vận hành cũ, MySQL có thể chứa các giá trị ngày tháng không hợp lệ như `0000-00-00` hoặc `1970-01-01`.
*   **Kịch bản tự động quét và sửa lỗi**:
    ```php
    // Chạy script check_and_fix_corrupted_dates.php
    $tables = [
        'users' => ['dob'],
        'hrm_profiles' => ['joined_date'],
        'check_ins' => ['check_in_date'],
        'hrm_leave_requests' => ['start_date', 'end_date']
    ];

    foreach ($tables as $table => $cols) {
        foreach ($cols as $col) {
            // Quét tìm dòng lỗi
            $stmt = $conn->query("SELECT id FROM `$table` WHERE `$col` = '0000-00-00' OR `$col` = '1970-01-01'");
            if ($stmt->num_rows > 0) {
                // Sửa về NULL
                $conn->query("UPDATE `$table` SET `$col` = NULL WHERE `$col` = '0000-00-00' OR `$col` = '1970-01-01'");
                echo "Đã dọn dẹp dữ liệu ngày tháng lỗi tại {$table}.{$col}\n";
            }
        }
    }
    ```
