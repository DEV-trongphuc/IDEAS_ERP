# Phân hệ 7: Quản lý Công việc, Quy trình & Phê duyệt (Tasks, Workflows & Approvals)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống giao việc cá nhân (task lẻ), giao việc phòng ban, giao việc theo lead (task sale), tương tác tag tên (`@mention`), luồng phê duyệt và quy trình mẫu tự động.

---

## 📋 1. Kiểm thử các loại Nhiệm vụ (Task Types)

### Kịch bản 1.1: Task lẻ / Giao việc cá nhân (Ad-hoc Tasks)
*   **Các bước thực hiện**:
    1. Người dùng A tạo một task độc lập (không liên kết với lead/deal).
    2. Chỉ định Người chịu trách nhiệm (Assignee) là Người dùng B.
    3. Đặt hạn hoàn thành (Due date) và mức độ ưu tiên (High/Medium/Low).
*   **Kết quả mong đợi**:
    *   Hệ thống ghi nhận task thành công trong CSDL.
    *   Người dùng B nhận được thông báo in-app và email về nhiệm vụ mới được giao.
    *   Task hiển thị đúng trong danh sách việc cần làm (To-Do List) của Người dùng B.

### Kịch bản 1.2: Task phòng ban (Departmental Tasks)
*   **Các bước thực hiện**:
    1. HR hoặc Admin tạo một task chung cho phòng ban (ví dụ: phòng Kế toán hoặc phòng Marketing).
    2. Chọn phân loại phòng ban nhận việc thay vì chỉ định 1 cá nhân.
*   **Kết quả mong đợi**:
    *   Nhiệm vụ tự động hiển thị trong bảng điều khiển công việc của tất cả thành viên thuộc phòng ban đó.
    *   Hệ thống cho phép một thành viên bấm **"Nhận việc"** (Claim task) -> Trạng thái chuyển sang chỉ định riêng cho thành viên đó và ẩn/đóng nhận đối với các thành viên khác.

### Kịch bản 1.3: Task kinh doanh / bám sát lead (Sales/Lead Tasks)
*   **Các bước thực hiện**:
    1. Sale mở chi tiết của một Lead/Contact.
    2. Tạo một lịch hẹn hoặc task chăm sóc khách hàng (ví dụ: *"Gọi điện tư vấn căn hộ B"*).
*   **Kết quả mong đợi**:
    *   Task được liên kết chính xác với `contact_id` trong CSDL.
    *   Lịch sử tương tác của khách hàng (Timeline) ghi nhận sự kiện tạo task này.
    *   Hệ thống tự động nhắc nhở khi đến hạn (SLA reminders).

---

## 🏷️ 2. Tương tác Thảo luận & Tagging (@mention)

### Kịch bản 2.1: Nhắc tên thành viên trong bình luận (@mention Tagging)
*   **Các bước thực hiện**:
    1. Người dùng mở phần thảo luận trong một task đang xử lý.
    2. Nhập bình luận có gắn thẻ: *"Nhờ @NguyenVanA kiểm tra lại UNC thanh toán này nhé"*.
    3. Nhấn gửi bình luận.
*   **Kết quả mong đợi**:
    *   Bình luận được lưu trữ thành công với định dạng thẻ HTML hoặc JSON đặc thù.
    *   Hệ thống quét nội dung bình luận, nhận diện ID của `@NguyenVanA`.
    *   Bắn thông báo đẩy tức thì cho `NguyenVanA` với nội dung: *"Bạn đã được nhắc tên trong nhiệm vụ [Tên Task]"*.

---

## ⚡ 3. Phân phối & Quy trình tự động (Workflow Triggers)

### Kịch bản 3.1: Áp dụng Quy trình mẫu (Workflow Task Templates)
*   **Các bước thực hiện**:
    1. Định nghĩa một quy trình mẫu *"Quy trình ký hợp đồng đặt cọc"* gồm 3 bước:
        *   Bước 1: Soạn hợp đồng (Giao cho Sale - Hạn: 1 ngày).
        *   Bước 2: Đối soát thanh toán (Giao cho Kế toán - Hạn: 4 tiếng).
        *   Bước 3: Bàn giao hồ sơ lưu trữ (Giao cho HR - Hạn: 1 ngày).
    2. Kích hoạt áp dụng quy trình mẫu này cho một Deal cụ thể.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động sinh ra đúng 3 task con với người nhận việc và thời hạn hoàn thành tương ứng.
    *   Các task được thiết lập quan hệ phụ thuộc tuần tự (Bước 2 chỉ được mở khi Bước 1 hoàn thành).

### Kịch bản 3.2: Tự động kích hoạt quy trình khi chuyển trạng thái (Stage Change Triggers)
*   **Các bước thực hiện**:
    1. Chuyển trạng thái Deal từ `Đang đàm phán` sang `Đặt cọc thành công`.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động kích hoạt trigger tạo chuỗi nhiệm vụ bàn giao và chuẩn bị hồ sơ pháp lý mà không cần người dùng tạo thủ công.

---

## 🛡️ 4. Quy trình Phê duyệt Nhiệm vụ (Approval Workflow)
*   **Các bước thực hiện**:
    1. Assignee hoàn thành công việc và bấm **"Yêu cầu phê duyệt kết quả"**.
    2. Đính kèm báo cáo hoàn thành hoặc ảnh nghiệm thu.
*   **Kết quả mong đợi**:
    *   Trạng thái task chuyển thành `pending_approval`.
    *   Người giao việc (Manager/Admin) nhận được thông báo yêu cầu phê duyệt.
    *   Người phê duyệt có quyền **"Duyệt"** (Task chuyển sang `completed`) hoặc **"Từ chối"** (Task trả về `in_progress` kèm lý do sửa đổi).
