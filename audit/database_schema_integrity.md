# Phân hệ 1: Kiểm thử Cấu trúc & Toàn vẹn Cơ sở dữ liệu (Database Schema & Integrity)

Tệp tin này đặc tả các kịch bản kiểm thử chi tiết về mặt cấu trúc dữ liệu, các ràng buộc và xử lý lỗi SQL trên cơ sở dữ liệu IDEAS ERP.

---

## 🗂️ 1. Đối soát cấu trúc bảng & kiểu dữ liệu (Schema Verification)

### Bảng `users` (Danh sách tài khoản)
*   **Trường cần kiểm tra**: `role`
*   **Kịch bản kiểm thử**:
    *   Truy vấn danh sách các giá trị hợp lệ của cột `role` trong CSDL.
    *   Đảm bảo hỗ trợ enums: `superadmin`, `super_admin`, `admin`, `manager`, `assistant`, `sales`, `sale`, `viewer`, `hr`, `accountant`, `marketing`.
    *   Thử chèn một bản ghi với `role = 'unknown'` và đảm bảo DB báo lỗi ràng buộc dữ liệu hoặc tự chuyển về giá trị mặc định (`sales`).

### Bảng `hrm_profiles` (Hồ sơ nhân sự)
*   **Trường cần kiểm tra**: `custom_fields_json`, `kpi_multiplier_rules`
*   **Kịch bản kiểm thử**:
    *   Đảm bảo `custom_fields_json` tồn tại và có kiểu dữ liệu là `TEXT` hoặc `JSON` (để lưu trữ mảng phụ cấp động không giới hạn).
    *   Thử lưu dữ liệu thô dạng JSON và kiểm tra tính hợp lệ sau khi truy vấn.

### Bảng `monthly_payslips` (Bảng lương tháng)
*   **Trường cần kiểm tra**: Khóa trùng lặp `uk_user_month` (`user_id`, `month_year`).
*   **Kịch bản kiểm thử**:
    *   Thử chèn 2 bản ghi lương cho cùng một `user_id` trong cùng một tháng `month_year`. DB phải chặn và ném ra lỗi `Duplicate entry`.

---

## 🛡️ 2. Stress-Test phòng chống lỗi SQLSTATE 22007 & 22001

### Cột ngày tháng (Date/Datetime)
*   **Các trường kiểm tra**: `dob` (ngày sinh), `joined_date` (ngày vào làm), `approval_date`.
*   **Kịch bản kiểm thử**:
    *   Khi người dùng để trống các ô ngày tháng trên Frontend, payload truyền về backend thường là chuỗi rỗng `""`.
    *   **Thử nghiệm**: Chạy câu lệnh UPDATE/INSERT trực tiếp với giá trị ngày tháng là `""`.
    *   **Kết quả mong đợi**: Hệ thống không được ném ra lỗi SQLSTATE 22007 (Incorrect date value). Bộ lọc dữ liệu ở backend hoặc trigger DB phải tự động quy đổi chuỗi rỗng `""` thành `NULL` trước khi thực thi SQL.

### Cột số học & Tiền tệ (Integer/Decimal)
*   **Các trường kiểm tra**: `amount` (bảng expenses), `price` (bảng deposits), `expected_commission`.
*   **Kịch bản kiểm thử**:
    *   **Thử nghiệm 1**: Truyền giá trị `NULL` hoặc `""` vào trường số học yêu cầu bắt buộc.
    *   **Kết quả mong đợi**: Backend tự động chuyển đổi thành `0` hoặc báo lỗi kiểm thực dữ liệu (validation error) thân thiện thay vì để lỗi DB ném ra ngoài (HTTP 500).
    *   **Thử nghiệm 2**: Truyền số âm hoặc số quá lớn (vượt quá giới hạn DECIMAL 15,2).
    *   **Kết quả mong đợi**: Hệ thống chặn ngay ở lớp controller đầu vào.

---

## 🧹 3. Kiểm tra & xử lý dữ liệu bị hỏng (Data Corruption & Cleanup)
*   **Kịch bản kiểm thử**:
    *   Quét toàn bộ bảng `users` để tìm các dòng có ngày tháng bị lỗi định dạng (ví dụ: `0000-00-00`).
    *   Tự động cập nhật các dòng lỗi này về `NULL` bằng script `check_and_fix_corrupted_dates.php`.
    *   Đảm bảo không còn bản ghi nào chứa giá trị ngày tháng không hợp lệ trước khi đưa lên môi trường sản xuất.
