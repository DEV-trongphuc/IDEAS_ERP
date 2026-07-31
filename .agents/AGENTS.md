# Workspace-Specific Business Rules

## 1. Quy trình Kiểm thử, Đối soát & Xác minh CSDL (Rigorous Testing, Database Verification & Harness Bootstrap)
* **Testing Harness Bootstrap**: Bất kỳ file script kiểm thử PHP nào được viết mới chỉ cần chèn dòng khởi tạo: `require_once __DIR__ . '/test_bootstrap.php';` (hoặc `require_once __DIR__ . '/../test_bootstrap.php';`). Môi trường sẽ tự động mở toàn bộ kết nối CSDL (`$conn` MySQLi & `$pdo`), nạp sẵn các thư viện nghiệp vụ (`webhook_logic.php`, `NotificationService`, `mailer.php`, `zalo_bot.php`, `telegram_bot.php`) và cung cấp sẵn bộ hàm kiểm thử tiêu chuẩn `assertTest()`, `assertDbField()`, `printTestSummary()`.
* **Đối soát CSDL từ xa**: Bất kỳ thay đổi, cập nhật hoặc phân tích nào liên quan đến CSDL Backend (truy vấn, cấu trúc bảng, thêm trường mới), Agent bắt buộc phải sử dụng cổng kết nối CSDL từ xa `exec_db_query.php` (hoặc các tập tin test_bootstrap) để chạy truy vấn đối soát cấu trúc thực tế trên Staging, đảm bảo các trường dữ liệu và kiểu dữ liệu hoàn toàn khớp nhau trước khi hoàn tất công việc.
* **Quy trình Kiểm thử Backend & Database**: Khi phát triển, sửa đổi hoặc thêm bất kỳ logic backend, API hoặc thay đổi cấu trúc Database (SQL column, table schema), Agent bắt buộc phải thiết lập một quy trình kiểm thử (test suite) cực kỳ kỹ lưỡng bao gồm:
  1. **Schema & SQL**: Kiểm tra cấu trúc các bảng SQL, kiểu dữ liệu, độ dài và các khóa ràng buộc (Foreign Keys) để đảm bảo không bị lỗi dữ liệu hay gãy mối quan hệ.
  2. **API Payload**: Kiểm thử tính toàn vẹn của dữ liệu gửi đi (payload) và dữ liệu phản hồi từ API.
  3. **UI & Rendering**: Đảm bảo giao diện người dùng hiển thị đúng các trường dữ liệu, xử lý chính xác cả hai trạng thái có/không có dữ liệu và sắp xếp thứ tự các cột của bảng hiển thị chuẩn chỉnh.
  4. **Tự động chạy test**: Tạo các file script PHP test harness (sử dụng `test_bootstrap.php`) để chạy kiểm thử khép kín (End-to-End backend logic) trực tiếp trên máy chủ Staging và ghi nhận kết quả.

## 2. Bảo mật Richland & Quy tắc Cấm Tự động Deploy (Richland Security & Deploy Control)
* **Cấm truy cập Richland**: Tác nhân AI (Agent) tuyệt đối không được phép thực hiện bất kỳ hành động đọc, viết, liệt kê tệp tin, chạy lệnh terminal, chỉnh sửa code hoặc can thiệp dưới bất kỳ hình thức nào đối với thư mục `D:\RICH_LAND_DATA_UI` hoặc bất kỳ tài nguyên nào liên quan đến Richland. Mọi hoạt động của Agent chỉ được giới hạn bên trong thư mục dự án chỉ định `IDEAS_ERP`.
* **Cấm Tự động Deploy**: Tác vụ Deploy (`npm run deploy`) chỉ được thực hiện khi có yêu cầu bằng chữ viết cụ thể của người dùng cho phép chạy deploy. Tuyệt đối không tự động chạy deploy dưới mọi hình thức khác.
* **Tuyệt đối cấm checkout git**: Tác nhân AI (Agent) tuyệt đối không bao giờ được phép chạy bất kỳ lệnh `git checkout` nào (bao gồm checkout file lẻ hoặc toàn bộ nhánh) để ghi đè, hoàn tác hoặc làm mất các chỉnh sửa của người dùng trên codebase. Khi gặp lỗi biên dịch, lỗi JSX mismatch hoặc bất kỳ lỗi logic nào, Agent bắt buộc phải tự tìm kiếm nguyên nhân và thực hiện sửa lỗi trực tiếp trên code (chỉ được fix lỗi), tuyệt đối không được phép sử dụng `git checkout` hoặc `git reset` để khôi phục tệp tin cũ.

