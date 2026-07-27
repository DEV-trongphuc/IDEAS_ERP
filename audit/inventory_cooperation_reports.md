# Phân hệ 8: Quản lý Kho sản phẩm, Hợp tác chia phí & Báo cáo (Inventory, Cooperation & Reports)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống bảng hàng dự án, giữ chỗ căn hộ trực tuyến, chia sẻ hoa hồng (Cooperation Slips) và hệ thống báo cáo phân tích ERP.

---

## 🏢 1. Quản lý Kho sản phẩm & Giữ chỗ (Inventory & Unit Lock)

### Kịch bản 1.1: Trạng thái giỏ hàng & Giữ chỗ trực tuyến (Locking Unit)
*   **Các bước thực hiện**:
    1. Sale mở bảng hàng dự án, chọn căn hộ A đang ở trạng thái `Trống` (Available).
    2. Nhấn **"Giữ chỗ"** (Lock unit) cho khách hàng của mình trong 15 phút.
*   **Kết quả mong đợi**:
    *   Trạng thái căn hộ A lập tức chuyển sang `Đang khóa` (Locked) trên hệ thống.
    *   Hệ thống khởi chạy bộ đếm ngược 15 phút.
    *   Các Sale khác không thể thực hiện thao tác giữ chỗ hoặc tạo cọc đè lên căn hộ A.
    *   **Hết hạn 15 phút**: Nếu không tạo cọc thành công, trạng thái căn hộ tự động hoàn trả về `Trống` (Available).

### Kịch bản 1.2: Cập nhật thông tin giỏ hàng hàng loạt (Bulk Import Giỏ hàng)
*   **Các bước thực hiện**:
    1. Admin tải lên file excel chứa 100 căn hộ mới của dự án.
*   **Kết quả mong đợi**:
    *   Hệ thống kiểm thực định dạng file, nhập thành công 100 căn hộ vào bảng `products`/`units`.
    *   Các căn trùng mã căn cũ tự động cập nhật thông tin thay vì báo lỗi trùng lặp.

---

## 🤝 2. Liên kết Hợp tác & Phân chia Hoa hồng (Cooperation Slips)

### Kịch bản 2.1: Tạo phiếu hợp tác phân chia tỷ lệ % hoa hồng
*   **Tiền điều kiện**: Tạo một đợt cọc mới.
*   **Các bước thực hiện**:
    1. Sale tạo **Phiếu hợp tác** (Cooperation Slip).
    2. Chỉ định tỷ lệ chia hoa hồng: Sale A nhận `60%`, Sale B nhận `40%`.
    3. Nhấn **Lưu**.
*   **Kết quả mong đợi**:
    *   Hệ thống lưu cấu trúc chia sẻ dưới dạng JSON trong bảng `cooperation_slips` (trường `shares_json`).
    *   Xác minh khi tính lương và hoa hồng KPI, doanh thu từ cọc này tự động phân chia đúng tỷ lệ: `60%` doanh thu tính cho Sale A và `40%` cho Sale B.

---

## 📊 3. Hệ thống Báo cáo & Phân tích (Analytics Dashboards)

### Kịch bản 3.1: Thống kê hiệu suất Sale (Sales Leaderboard)
*   **Các bước thực hiện**:
    1. Vào trang Dashboard báo cáo hiệu suất kinh doanh trong tháng.
*   **Kết quả mong đợi**:
    *   Hệ thống tính toán thời gian thực tổng doanh số thu được từ các đợt cọc đã duyệt của từng Sale.
    *   Hiển thị biểu đồ cột hoặc bảng xếp hạng chính xác thứ tự từ cao xuống thấp.

### Kịch bản 3.2: Báo cáo phễu chuyển đổi (Pipeline Conversion Funnel)
*   **Các bước thực hiện**:
    1. Xem biểu đồ phễu chuyển đổi từ `Tiếp cận` -> `Đã gặp` -> `Đặt cọc` -> `Đã thu tiền`.
*   **Kết quả mong đợi**:
    *   Biểu đồ hiển thị đúng tỷ lệ phần trăm hao hụt giữa các bước.
    *   Nhấp vào từng phần của phễu hiển thị đúng danh sách chi tiết khách hàng ở trạng thái tương ứng.

---

## 🛡️ 4. Nhật ký Thao tác & Kiểm toán (Audit Logs)
*   **Các bước thực hiện**:
    1. Một tài khoản sửa đổi số tiền đặt cọc hoặc xóa thông tin khách hàng.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động ghi lại một dòng log vào bảng `audit_logs` với đầy đủ thông tin: ID tài khoản thực hiện, thời gian, tên hành động, giá trị trước khi sửa và giá trị sau khi sửa.
