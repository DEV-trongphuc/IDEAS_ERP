# Phân hệ 11: Trợ lý AI, Dữ liệu Huấn luyện & Cơ cấu Tổ chức (AI Chatbot, Training & Organization)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống Trợ lý AI tương tác thời gian thực, quản lý Dữ liệu huấn luyện tri thức dự án (AI Knowledge Base), và thiết lập Cơ cấu Đội nhóm/Phòng ban trong doanh nghiệp.

---

## 🤖 1. Trợ lý AI & Chatbot tư vấn (AI Chat Assistant)

### Kịch bản 1.1: Truy vấn hỏi đáp dự án (AI Project QA)
*   **Các bước thực hiện**:
    1. Người dùng mở khung chat AI Assistant.
    2. Nhập câu hỏi: *"Dự án A còn những căn hộ 2 phòng ngủ hướng Đông Nam nào không và chính sách chiết khấu hiện tại là gì?"*.
    3. Gửi yêu cầu.
*   **Kết quả mong đợi**:
    *   Hệ thống gọi API của `ai_chat_handler.php`.
    *   Trình xử lý AI tự động truy vấn dữ liệu bảng hàng thực tế của dự án A từ CSDL để tổng hợp câu trả lời chính xác, thay vì trả lời mơ hồ hoặc sai lệch.

---

## 📚 2. Quản lý Dữ liệu Huấn luyện AI (AI Training Base)

### Kịch bản 2.1: Nạp tài liệu tri thức (Knowledge Base Injection)
*   **Các bước thực hiện**:
    1. Admin truy cập trang Quản trị AI, đăng tải một file tài liệu chính sách bán hàng mới nhất của dự án B (định dạng PDF hoặc văn bản thô).
    2. Bấm nút **"Huấn luyện"** (Train / Embed).
*   **Kết quả mong đợi**:
    *   Hệ thống gọi `ai_training_handler.php` để xử lý trích xuất văn bản (Text Extraction) và tạo vector embeddings.
    *   Lưu thông tin thành công vào CSDL tri thức dự án.
    *   Xác minh: Thử đặt câu hỏi liên quan đến tài liệu mới nạp -> AI trả lời chính xác thông tin vừa được cập nhật.

---

## 👥 3. Cơ cấu Đội nhóm & Thành viên (Teams & Org Structure)

### Kịch bản 3.1: Tạo nhóm & Chỉ định Trưởng nhóm (Team Managers)
*   **Các bước thực hiện**:
    1. Admin tạo một Nhóm kinh doanh mới (ví dụ: *Team Sales 3*).
    2. Chỉ định Người dùng A làm Trưởng nhóm (Manager) của Team Sales 3.
    3. Thêm 5 nhân viên kinh doanh làm thành viên trực thuộc nhóm này.
*   **Kết quả mong đợi**:
    *   Nhóm được tạo thành công trong bảng `teams` với `manager_id` trỏ về Người dùng A.
    *   Xác minh: Khi Người dùng A xem báo cáo doanh số nhóm, hệ thống tự động lọc và tổng hợp số liệu của đúng 5 thành viên trong nhóm, bảo mật hoàn toàn dữ liệu với các trưởng nhóm khác.
