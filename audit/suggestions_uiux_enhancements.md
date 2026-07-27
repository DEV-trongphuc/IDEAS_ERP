# Phân hệ 13: Đề xuất cải tiến UI/UX & Tính năng bổ trợ Công việc (UI/UX & Workflow Suggestions)

Tài liệu này tổng hợp các đề xuất cải tiến trải nghiệm người dùng (UI/UX), tối ưu hóa hiệu suất làm việc và các tính năng bổ trợ thông minh cho ứng dụng IDEAS ERP.

---

## 🎨 1. Đề xuất Cải tiến Trải nghiệm UI/UX

### 1.1. Bảng Kanban kéo thả trực quan (Kanban Drag-and-Drop)
*   **Mô tả**: Thay thế hoặc bổ sung cho dạng xem danh sách (List view) của Lead, Deal và Task bằng bảng Kanban.
*   **UI/UX bổ trợ**:
    *   Cho phép kéo thả một thẻ Deal từ cột `Đang đàm phán` sang cột `Đặt cọc`.
    *   Khi kéo thả, hệ thống tự động gọi API cập nhật trạng thái ở backend và kích hoạt các quy trình nhiệm vụ tương ứng.
    *   Hiệu ứng chuyển động mượt mà (Smooth transition) và phản hồi xúc giác khi thả thẻ thành công.

### 1.2. Chế độ Giao diện Tối ưu (Dark Mode & Theme Customization)
*   **Mô tả**: Cho phép người dùng chuyển đổi giữa giao diện Sáng (Light) và Tối (Dark).
*   **UI/UX bổ trợ**:
    *   Sử dụng CSS Variables để đồng bộ hóa toàn bộ hệ thống màu sắc.
    *   Tự động phát hiện tùy chọn giao diện của hệ điều hành của người dùng.

### 1.3. Phím tắt nhanh (Keyboard Shortcuts Menu)
*   **Mô tả**: Cung cấp các tổ hợp phím nóng để thực hiện nhanh các tác vụ thường gặp mà không cần dùng chuột.
*   **Ví dụ**:
    *   `Alt + N`: Mở drawer tạo mới Lead nhanh.
    *   `Alt / Ctrl + F`: Đưa con trỏ trực tiếp vào ô tìm kiếm toàn cục.
    *   `Esc`: Đóng drawer hoặc modal đang mở.

---

## ⚡ 2. Đề xuất Tính năng Bổ trợ & Tăng năng suất công việc

### 2.1. Quét hóa đơn tự động bằng AI (OCR Invoice Auto-scan)
*   **Mô tả**: Tích hợp công nghệ nhận diện ký tự quang học (OCR) vào phân hệ Chi phí (Expenses) và Đơn mua (PO).
*   **Nghiệp vụ bổ trợ**:
    *   Khi nhân viên tải ảnh hóa đơn VAT lên, AI tự động quét và trích xuất các thông tin: *Tên nhà cung cấp, Mã số thuế, Số tiền trước thuế, Thuế suất, Tổng tiền thực thanh toán*.
    *   Tự động điền các thông tin này vào biểu mẫu đề xuất chi phí, người dùng chỉ cần kiểm tra lại và bấm gửi duyệt, tiết kiệm 80% thời gian nhập liệu thủ công.

### 2.2. Dạng xem Lịch biểu tích hợp (Calendar view)
*   **Mô tả**: Giao diện lịch biểu (Lịch ngày/tuần/tháng) hiển thị trực quan tất cả lịch hẹn gặp khách hàng của Sale, ca trực của nhân viên và thời hạn hoàn thành Task.
*   **Nghiệp vụ bổ trợ**:
    *   Hỗ trợ kéo giãn thời gian trên lịch để thay đổi thời hạn task hoặc lịch hẹn.
    *   Đồng bộ hóa 2 chiều với Google Calendar hoặc Apple Calendar.

### 2.3. Game hóa công việc & Thanh tiến độ (Gamification & Progress Tracking)
*   **Mô tả**: Tích hợp các chỉ số trực quan hóa chặng đường hoàn thành mục tiêu.
*   **UI/UX bổ trợ**:
    *   Hiển thị **Thanh tiến độ (Progress bar)** trong drawer khách hàng, thể hiện khách hàng đã hoàn thành bao nhiêu % quy trình chăm sóc.
    *   Hệ thống Vinh danh: Tự động bắn thông báo chúc mừng kèm pháo hoa hiệu ứng trên màn hình khi một Sale vượt KPI doanh số tháng sớm nhất.
