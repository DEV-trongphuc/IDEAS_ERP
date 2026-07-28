# Workspace-Specific Business Rules

## 1. Khung Kiểm thử Toàn diện (Testing Harness Bootstrap)
* **Rule**: Bất kỳ file script kiểm thử PHP nào được viết sau này chỉ cần chèn dòng khởi tạo:
  `require_once __DIR__ . '/test_bootstrap.php';` (hoặc `require_once __DIR__ . '/../test_bootstrap.php';`)
* **Feature**: Tự động mở toàn bộ kết nối CSDL (`$conn` MySQLi & `$pdo`), nạp sẵn toàn bộ thư viện nghiệp vụ (`webhook_logic.php`, `NotificationService`, `mailer.php`, `zalo_bot.php`, `telegram_bot.php`) và cung cấp sẵn bộ hàm kiểm thử tiêu chuẩn `assertTest()`, `assertDbField()`, `printTestSummary()`.

## 2. Quy tắc Cấm Tự Động Deploy
* **Rule**: Tác vụ Deploy (`npm run deploy`) chỉ được thực hiện khi có yêu cầu bằng chữ viết cụ thể của người dùng cho phép chạy deploy. Tuyệt đối không tự động chạy deploy dưới mọi hình thức khác.

## 3. Quy tắc Bắt buộc Đối soát CSDL từ xa (Remote Database Structure Verification)
* **Rule**: Bất kỳ thay đổi, cập nhật hoặc phân tích nào liên quan đến Cơ sở dữ liệu Backend (truy vấn, cấu trúc bảng, thêm trường mới), Agent bắt buộc phải sử dụng cổng kết nối CSDL từ xa `exec_db_query.php` (hoặc các tập tin test_bootstrap) để chạy truy vấn đối soát cấu trúc thực tế trên Staging, đảm bảo các trường dữ liệu và kiểu dữ liệu hoàn toàn khớp nhau trước khi hoàn tất công việc.

## 4. Quy tắc Tuyệt đối Cấm truy cập RICHLAND (RICHLAND Access Prohibition)
* **Rule**: Tác nhân AI (Agent) tuyệt đối không được phép thực hiện bất kỳ hành động đọc, viết, liệt kê tệp tin, chạy lệnh terminal, chỉnh sửa code hoặc can thiệp dưới bất kỳ hình thức nào đối với thư mục `D:\RICH_LAND_DATA_UI` hoặc bất kỳ tài nguyên nào liên quan đến Richland. Mọi hoạt động của Agent chỉ được giới hạn bên trong thư mục dự án chỉ định `IDEAS_ERP`.

## 5. Quy trình Kiểm thử Nghiêm ngặt cho Các Tính năng Backend & Database (Rigorous Testing for Backend & Database Changes)
* **Rule**: Khi phát triển, sửa đổi hoặc thêm bất kỳ logic backend, API hoặc thay đổi cấu trúc Database (SQL column, table schema), Agent bắt buộc phải thiết lập một quy trình kiểm thử (test suite) cực kỳ kỹ lưỡng bao gồm:
  1. **Schema & SQL**: Kiểm tra cấu trúc các bảng SQL, kiểu dữ liệu, độ dài và các khóa ràng buộc (Foreign Keys) để đảm bảo không bị lỗi dữ liệu hay gãy mối quan hệ.
  2. **API Payload**: Kiểm thử tính toàn vẹn của dữ liệu gửi đi (payload) và dữ liệu phản hồi từ API.
  3. **UI & Rendering**: Đảm bảo giao diện người dùng hiển thị đúng các trường dữ liệu, xử lý chính xác cả hai trạng thái có/không có dữ liệu và sắp xếp thứ tự các cột của bảng hiển thị chuẩn chỉnh.
  4. **Tự động chạy test**: Tạo các file script PHP test harness (sử dụng `test_bootstrap.php`) để chạy kiểm thử khép kín (End-to-End backend logic) trực tiếp trên máy chủ Staging và ghi nhận kết quả.


