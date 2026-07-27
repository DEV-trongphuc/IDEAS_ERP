# Phân hệ 5: Luồng Dữ liệu Frontend & Trạng thái UI (Frontend Payloads)

Tệp tin này đặc tả kịch bản kiểm thử cho toàn bộ luồng tương tác phía Client (Vite/React) đối với các biểu mẫu nhập liệu và chốt chặn hiển thị UI của IDEAS ERP.

---

## 🎛️ 1. Kiểm thử Trạng thái & Biến số hiển thị trong Drawer

### Kịch bản 1.1: Trạng thái Read-only của tab Lương đối với nhân viên tự xem
*   **Các bước thực hiện**:
    1. Đăng nhập bằng tài khoản **Sale A** (`sale_a@ideas.test`).
    2. Click vào Avatar ở góc phải -> Mở Drawer thông tin cá nhân.
    3. Click vào tab **Lương & Bảo hiểm**.
*   **Kết quả mong đợi**:
    *   Tất cả các trường nhập liệu (Lương thỏa thuận, phụ cấp xăng xe, điện thoại) và danh sách phụ cấp động hiển thị ở dạng **Chỉ xem (disabled)**.
    *   Nút "Lưu" hoặc "Thêm khoản" phụ cấp không hiển thị.

### Kịch bản 1.2: Quyền cập nhật của HR / Admin đối với hồ sơ nhân viên khác
*   **Các bước thực hiện**:
    1. Đăng nhập bằng tài khoản **HR** (`hr@ideas.test`).
    2. Truy cập danh sách nhân sự, click mở Drawer của nhân viên **Sale A**.
    3. Click vào tab **Lương & Bảo hiểm**.
*   **Kết quả mong đợi**:
    *   Tất cả các trường nhập liệu hiển thị bình thường ở trạng thái cho phép chỉnh sửa.
    *   Nút **"Thêm khoản"** phụ cấp hoạt động, cho phép điền thông tin và bấm Lưu.

---

## 📝 2. Kiểm thực Dữ liệu Đầu vào (Frontend Validation)

### Kịch bản 2.1: Chuẩn hóa số điện thoại (Phone Normalization)
*   **Các bước thực hiện**:
    1. Mở biểu mẫu tạo mới Contact/Lead.
    2. Nhập số điện thoại có khoảng trắng và ký tự lạ (ví dụ: `+84 909-123 456`).
    3. Bấm **Lưu**.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động lọc bỏ các ký tự trống và dấu gạch ngang, chuẩn hóa số điện thoại về định dạng chuẩn quốc tế `0909123456` trước khi gửi payload lên API.

### Kịch bản 2.2: Ràng buộc kích thước và định dạng File tải lên (Attachments)
*   **Các bước thực hiện**:
    1. Truy cập phần đính kèm tài liệu thanh toán (UNC) hoặc hồ sơ nhân sự.
    2. Tải lên tệp tin định dạng không cho phép (ví dụ: `.exe`, `.bat`).
    3. Tải lên ảnh có dung lượng vượt mức tối đa (ví dụ: `15MB`).
*   **Kết quả mong đợi**:
    *   Ứng dụng hiển thị thông báo lỗi trực tiếp trên UI (ví dụ: *"File không đúng định dạng hỗ trợ"* hoặc *"Dung lượng file vượt quá giới hạn cho phép"*).
    *   Nút gửi đi bị khóa, ngăn chặn gửi payload rác lên server.
