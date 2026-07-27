# Phân hệ 4: Nhân sự & Lương bổng (HRM & Payroll)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống quản lý hồ sơ nhân viên, ngày vào làm, bảo hiểm bắt buộc, KPI doanh số và tính toán phụ cấp động tùy chỉnh.

---

## 💵 1. Kiểm thử Phụ cấp Tùy chỉnh Động (Dynamic Allowances)

### Kịch bản 1.1: Tạo phụ cấp động cho nhân viên
*   **Các bước thực hiện**:
    1. Đăng nhập tài khoản HR. Mở drawer hồ sơ nhân viên A.
    2. Vào tab *Lương & Bảo hiểm*, nhấn **"Thêm khoản"**.
    3. Nhập khoản 1: *"Hỗ trợ gửi xe"* - `200000` VNĐ.
    4. Nhập khoản 2: *"Phụ cấp độc hại"* - `500000` VNĐ.
    5. Nhấn **Lưu**.
*   **Kết quả mong đợi**:
    *   Hệ thống lưu thành công mảng JSON `[{"name":"Hỗ trợ gửi xe","value":200000},{"name":"Phụ cấp độc hại","value":500000}]` vào cột `custom_fields_json` trong bảng `hrm_profiles`.
    *   Trình duyệt hiển thị thông báo thành công.

### Kịch bản 1.2: Cập nhật và Xóa phụ cấp động
*   **Các bước thực hiện**:
    1. Nhấn nút xóa (thùng rác) đối với khoản *"Hỗ trợ gửi xe"*.
    2. Sửa khoản *"Phụ cấp độc hại"* từ `500000` thành `600000` VNĐ.
    3. Nhấn **Lưu**.
*   **Kết quả mong đợi**:
    *   Cột `custom_fields_json` trong CSDL được cập nhật thành: `[{"name":"Phụ cấp độc hại","value":600000}]`.

---

## 🧮 2. Kiểm thử Công thức Tính Lương tháng (Payroll Calculations)

### Kịch bản 2.1: Tính lương cơ bản theo tỷ lệ ngày công thực tế (Prorated Salary)
*   **Công thức**: `Lương thực tế = (Lương thỏa thuận / Ngày công yêu cầu) * Ngày công làm việc thực tế`
*   **Tiền điều kiện**: Lương thỏa thuận = `26,000,000` VNĐ. Ngày công yêu cầu trong tháng = `26` ngày.
*   **Thử nghiệm**:
    *   Trường hợp nhân viên đi làm đầy đủ 26 ngày -> Lương nhận được = `26,000,000` VNĐ.
    *   Trường hợp nhân viên đi làm 20 ngày và nghỉ 2 ngày phép năm được hưởng lương -> Tổng ngày công tính lương = `22` ngày. Lương nhận được = `22,000,000` VNĐ.
*   **Kết quả mong đợi**:
    *   Hệ thống tính đúng số tiền cơ bản dựa trên số liệu chấm công được phê duyệt.

### Kịch bản 2.2: Khấu trừ Lượt đi muộn / Về sớm (Lateness Penalty with Waive)
*   **Ngưỡng miễn trừ (Grace Threshold)**: Nam đi muộn dưới 30 phút/tháng được miễn trừ. Nữ đi muộn dưới 60 phút/tháng được miễn trừ.
*   **Mức phạt**: 5,000 VNĐ cho mỗi phút đi muộn vượt ngưỡng.
*   **Thử nghiệm**:
    *   Nhân viên Nam đi muộn tổng cộng 45 phút trong tháng -> Số phút bị phạt = `45 - 30 = 15` phút. Tiền phạt khấu trừ = `15 * 5000 = 75,000` VNĐ.
    *   Nhân viên Nữ đi muộn 45 phút -> Số phút bị phạt = `0`. Tiền phạt khấu trừ = `0` VNĐ.
*   **Kết quả mong đợi**:
    *   Khấu trừ tính chính xác theo đúng giới tính và cài đặt grace threshold trong CSDL.

### Kịch bản 2.3: Cộng dồn phụ cấp động vào phiếu lương
*   **Tiền điều kiện**: Hồ sơ nhân sự có các phụ cấp cứng: Xăng xe = `500,000` VNĐ. Điện thoại = `300,000` VNĐ. Phụ cấp động tùy chỉnh: Phụ cấp độc hại = `600,000` VNĐ.
*   **Thực hiện**: Bấm nút **Tính lương tháng** cho nhân viên.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động phân tích `custom_fields_json`, cộng dồn cả 3 khoản: `500,000 + 300,000 + 600,000`.
    *   Tổng cột phụ cấp hiển thị trên phiếu lương (`allowance_total`) đạt chính xác `1,400,000` VNĐ.
