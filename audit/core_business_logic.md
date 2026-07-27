# Phân hệ 3: Quy tắc Nghiệp vụ Đặc thù (Core Business Rules)

Tệp tin này đặc tả kịch bản kiểm thử cho 4 quy tắc nghiệp vụ cốt lõi và các thuật toán vận hành tự động của IDEAS ERP.

---

## 🏗️ 1. Quy tắc hủy cọc (Deposit Cancellation Logic)

### Kịch bản 1.1: Hủy cọc khi CHƯA có doanh thu thực tế (Rule 1)
*   **Tiền điều kiện**: Tạo một khách hàng mới (Person A) ở trạng thái `Booking`. Tạo phiếu đặt cọc `deposits` ở trạng thái chờ duyệt (`pending_admin`).
*   **Các bước thực hiện**:
    1. Trợ lý/Admin thực hiện phê duyệt cọc, trạng thái Person chuyển sang `Đặt Cọc`.
    2. Đảm bảo chưa ghi nhận bất kỳ đợt đóng tiền thực tế nào cho công ty (CSDL chưa có hóa đơn thu tiền).
    3. Thực hiện Hủy cọc (gọi API hủy đặt cọc).
*   **Kết quả mong đợi**:
    *   Trạng thái của Person A tự động tụt về mức trước đó (`Booking` hoặc `Đã Gặp`).
    *   Đồng hồ bảo mật (security timer) của Person A được kích hoạt chạy lại. Nếu hết hạn tương tác, khách hàng này sẽ được giải phóng ra Kho chung (Databank) để chia lại.

### Kịch bản 1.2: Hủy cọc khi ĐÃ CÓ doanh thu thực tế (Rule 2)
*   **Tiền điều kiện**: Tạo Person B. Tạo phiếu cọc và ghi nhận đã đóng đợt 1 (đã thu một phần phí môi giới/doanh thu thực tế).
*   **Các bước thực hiện**:
    1. Thực hiện Hủy cọc đối với giao dịch này.
*   **Kết quả mong đợi**:
    *   Trạng thái của Person B **phải giữ nguyên** mức `Đặt Cọc` (không được tụt trạng thái) vì đã phát sinh dòng tiền thực tế chạy về công ty, xác nhận đây là khách hàng thật sự.

---

## 🔄 2. Quy tắc đổi căn giao dịch (Unit Switching - Rule 3)
*   **Kịch bản kiểm thử**:
    1. Khách hàng đổi từ căn hộ A sang căn hộ B.
    2. Người dùng nhấn nút đổi căn trên Deal căn hộ A.
*   **Kết quả mong đợi**:
    *   Hệ thống tự động đóng Deal cũ của căn hộ A lại (đóng thất bại hoặc đánh dấu đã đổi).
    *   Hệ thống tự tạo một Deal mới hoàn toàn cho căn hộ B.
    *   Tại Deal mới, hệ thống tự động gắn một liên kết ghi rõ: *"Đổi từ căn A"* để giữ trọn vẹn vết lịch sử dòng tiền và phí môi giới phục vụ đối soát kiểm toán (audit trail).

---

## 📡 3. Tín hiệu Conversion API Meta (CAPI - Rule 4)
*   **Kịch bản kiểm thử**:
    1. Deal của khách hàng chuyển sang thành công -> Hệ thống gửi tín hiệu `Purchase` (Mua hàng) về Meta qua webhook CAPI.
    2. Sau đó, khách hàng này hủy đặt cọc (Deal bị hủy).
*   **Kết quả mong đợi**:
    *   Hệ thống **không được bắn lùi tín hiệu** (không gửi sự kiện hoàn trả hay hạ cấp) về Meta. Tín hiệu CAPI chỉ đi một chiều đi lên (Forward-only) để đảm bảo chất lượng máy học (machine learning) của Meta không bị nhiễu.

---

## 🎲 4. Logic Vòng chia Lead & Recall tự động
*   **Kịch bản kiểm thử**:
    1. Cấu hình ca trực ban đêm cho tư vấn viên A. Tư vấn viên B không đăng ký trực.
    2. Cài đặt tư vấn viên A đang bật chế độ nghỉ phép (`vacation_mode = 1`).
    3. Đẩy một Lead mới từ Website vào hệ thống.
*   **Kết quả mong đợi**:
    *   Lead không được phân cho tư vấn viên B (vì không trực).
    *   Lead không được phân cho tư vấn viên A (vì đang nghỉ phép).
    *   Hệ thống tự động chuyển lead sang tài khoản Admin nhận lỗi hoặc xếp vào hàng đợi chờ phân bổ khi có người trực hoạt động.
    *   Nếu một tư vấn viên nhận lead nhưng không tương tác quá thời gian cấu hình, lead tự động bị thu hồi (recall) và chia lại cho người tiếp theo trong vòng chia (`redistributePendingLeads`).
