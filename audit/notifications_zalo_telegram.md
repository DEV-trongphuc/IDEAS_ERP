# Phân hệ 6: Hệ thống Thông báo & Tích hợp (Notifications & Bots)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống thông báo đẩy thời gian thực, tin nhắn SMS/Zalo Bot và các cảnh báo tự động về nhóm Telegram của IDEAS ERP.

---

## 🔔 1. Thông báo đẩy thời gian thực (Real-time In-app Notifications)

### Kịch bản 1.1: Gửi yêu cầu duyệt cọc
*   **Các bước thực hiện**:
    1. Tài khoản Sale gửi yêu cầu phê duyệt đợt đặt cọc mới cho khách hàng.
*   **Kết quả mong đợi**:
    *   Hệ thống gọi `NotificationService::send` tạo bản ghi thông báo loại `DEPOSIT_APPROVAL_REQUEST` cho tài khoản Kế toán và Admin.
    *   Kế toán nhận được thông báo đẩy (toast hoặc chuông đỏ thông báo) ngay lập tức trên UI mà không cần tải lại trang.

---

## 🤖 2. Kiểm thử Tích hợp Zalo Bot (OTP & SMS Gateway)

### Kịch bản 2.1: Gửi mã OTP xác thực đăng nhập 2FA
*   **Các bước thực hiện**:
    1. Người dùng bật xác thực 2 lớp (2FA) và thực hiện đăng nhập.
    2. Nhấn nút **"Gửi OTP qua Zalo"**.
*   **Kết quả mong đợi**:
    *   Hệ thống gọi hàm `sendZaloMessage` trong file `zalo_bot.php` gửi thông tin OTP đến số điện thoại đăng ký.
    *   Zalo Client của số điện thoại đó nhận được tin nhắn OTP.
    *   Kiểm tra trong CSDL: Bản ghi log OTP được ghi nhận thành công với hạn dùng 5 phút.

---

## 💬 3. Kiểm thử Tích hợp Telegram Bot (SLA Alerts & Escalations)

### Kịch bản 3.1: Báo động quá hạn xử lý cọc (SLA Missed)
*   **Tiền điều kiện**: Đợt cọc được tạo lúc `08:00`. SLA xử lý cọc quy định là 2 tiếng (`120 phút`).
*   **Các bước thực hiện**:
    1. Để đợt cọc ở trạng thái `pending` vượt quá `10:00` cùng ngày.
    2. Chạy cronjob quét kiểm tra hạn xử lý.
*   **Kết quả mong đợi**:
    *   Telegram Bot tự động gửi tin nhắn cảnh báo vào nhóm điều hành công ty:
        `⚠️ CẢNH BÁO: Đợt cọc ID [100234] của khách hàng [Nguyễn Văn A] đã quá hạn phê duyệt (2 tiếng). Vui lòng kiểm tra!`

---

## 📧 4. Hàng đợi gửi Email tự động (Email Mailer Queue)
*   **Kịch bản kiểm thử**:
    1. Khi phát sinh giao dịch mới, hệ thống chèn một dòng gửi email xác nhận vào bảng `email_queue`.
    2. Chạy cronjob `cron_sync.php` để xử lý hàng đợi.
*   **Kết quả mong đợi**:
    *   Email được gửi đi thành công sử dụng thư viện `mailer.php`.
    *   Trạng thái hàng đợi chuyển sang `sent = 1`, ghi nhận thời gian gửi thực tế.
