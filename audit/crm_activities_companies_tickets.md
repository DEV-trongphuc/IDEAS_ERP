# Phân hệ 9: Hoạt động CRM, Khách hàng Doanh nghiệp & Vé hỗ trợ (CRM Activities, Companies & Tickets)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống ghi nhận dòng sự kiện tương tác khách hàng, phân cấp Khách hàng Doanh nghiệp & Cá nhân, và hệ thống tiếp nhận hỗ trợ kỹ thuật/khiếu nại (Helpdesk Tickets).

---

## 📅 1. Hoạt động & Ghi chú khách hàng (CRM Activities & Notes)

### Kịch bản 1.1: Ghi nhận lịch sử tương tác (Timeline Activities)
*   **Các bước thực hiện**:
    1. Nhân viên Sale mở chi tiết khách hàng A.
    2. Thêm một hoạt động thuộc loại: `Cuộc gọi` (Call), `Email`, hoặc `Gặp trực tiếp` (Meeting).
    3. Điền mô tả chi tiết cuộc trao đổi và thiết lập trạng thái hoàn thành.
*   **Kết quả mong đợi**:
    *   Hệ thống ghi nhận hoạt động thành công trong bảng `activities`.
    *   Màn hình chi tiết khách hàng tự động hiển thị hoạt động này trên dòng thời gian (Timeline) theo thứ tự thời gian mới nhất lên đầu.

### Kịch bản 1.2: Lên lịch hẹn & Nhắc nhở (Follow-ups & Reminders)
*   **Các bước thực hiện**:
    1. Tạo một cuộc gọi nhắc nhở có ngày giờ thực hiện ở tương lai (ví dụ: ngày mai lúc `14:00`).
*   **Kết quả mong đợi**:
    *   Khi đến giờ hẹn, hệ thống tự động bắn thông báo đẩy hoặc hiển thị trong mục "Nhiệm vụ hôm nay" của Sale phụ trách để tránh bỏ quên khách hàng.

---

## 🏢 2. Khách hàng Doanh nghiệp vs Cá nhân (Companies & Contacts mapping)

### Kịch bản 2.1: Liên kết 1-nhiều giữa Công ty và Người đại diện liên hệ
*   **Các bước thực hiện**:
    1. Tạo mới một Công ty (Company) với mã số thuế và thông tin đại diện pháp lý.
    2. Mở một khách hàng cá nhân (Contact) có sẵn, thực hiện liên kết người này vào Công ty vừa tạo với chức danh tương ứng (ví dụ: *Giám đốc Mua hàng*).
*   **Kết quả mong đợi**:
    *   Khi xem thông tin Công ty, hiển thị đầy đủ danh sách các Người đại diện liên hệ (Contacts).
    *   Khi xóa một Contact đại diện, thông tin Công ty không bị ảnh hưởng (ràng buộc khóa ngoại mềm).

---

## 🎫 3. Vé hỗ trợ khách hàng & Chăm sóc dịch vụ (Helpdesk Tickets)

### Kịch bản 3.1: Tiếp nhận và phân bổ Vé hỗ trợ (Ticket Assignment)
*   **Các bước thực hiện**:
    1. Khách hàng hoặc Sale tạo một yêu cầu hỗ trợ mới (Ticket) liên quan đến bàn giao căn hộ hoặc lỗi kỹ thuật (Ví dụ: *"Nứt tường phòng khách"*).
    2. Chọn mức độ ưu tiên: `Khẩn cấp` (Critical), `Cao` (High), `Trung bình` (Medium).
*   **Kết quả mong đợi**:
    *   Hệ thống tạo Ticket thành công trong bảng `tickets` với mã số duy nhất (ví dụ: `TK-1002`).
    *   Dựa trên phân loại, Ticket tự động được gán (Assign) cho nhóm hỗ trợ tương ứng.

### Kịch bản 3.2: Kiểm tra cam kết SLA xử lý khiếu nại (SLA Verification)
*   **Các bước thực hiện**:
    1. Trạng thái Ticket được cấu hình SLA phản hồi trong vòng 30 phút.
    2. Đã quá 30 phút mà chưa có phản hồi hoặc cập nhật trạng thái từ kỹ thuật viên.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động đổi màu hiển thị Ticket sang cảnh báo Đỏ trên Dashboard của Manager.
    *   Gửi cảnh báo quá hạn xử lý về Telegram Bot phòng dịch vụ khách hàng.
