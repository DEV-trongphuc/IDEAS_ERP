# Kế hoạch Kiểm thử Toàn diện (Comprehensive Test Plan) - IDEAS ERP

Tài liệu này vạch ra kế hoạch kiểm thử toàn diện từ cơ sở dữ liệu, backend, frontend payload, phân quyền hạn chức năng (RBAC) đến hệ thống thông báo, đảm bảo tất cả các logic nghiệp vụ lõi vận hành chính xác và không bị bỏ sót bất kỳ trường hợp nào.

---

## 1. Kiểm thử Cấu trúc & Toàn vẹn Cơ sở dữ liệu (Database Schema & Integrity)
Mục tiêu là đảm bảo cấu trúc bảng thực tế trên Staging/Production luôn khớp 100% với đặc tả thiết kế, đồng thời ngăn ngừa lỗi SQLSTATE.

*   **1.1. Đối soát cấu trúc cột (SHOW COLUMNS)**
    *   **Bảng `users`**: Đảm bảo cột `role` hỗ trợ đầy đủ 10 enums: `superadmin`, `super_admin`, `admin`, `manager`, `assistant`, `sales`, `sale`, `viewer`, `hr`, `accountant`, `marketing`.
    *   **Bảng `hrm_profiles`**: Kiểm tra sự tồn tại của cột `custom_fields_json` (TEXT NULL) phục vụ phụ cấp động và `kpi_multiplier_rules`.
    *   **Bảng `contacts` & `leads`**: Kiểm tra kiểu dữ liệu của số điện thoại (`phone`), email, và các khóa ngoại `person_id`, `project_id`.
*   **1.2. Stress Test chống lỗi SQLSTATE (22007, 22001,...)**
    *   Truyền dữ liệu rỗng (`''`) hoặc `NULL` vào các cột kiểu `DATE`/`DATETIME` (như ngày sinh `dob`, ngày vào làm `joined_date`). Hệ thống phải tự xử lý sang `NULL` thay vì báo lỗi cú pháp ngày tháng của MySQL.
    *   Truyền giá trị số lớn hoặc `NULL` vào các cột tiền tệ (`decimal`) của bảng `deposits`, `expenses` và `invoices` để kiểm tra độ tin cậy của kiểu dữ liệu.

---

## 2. Kiểm thử Phân quyền thực tế (RBAC Permission Matrix & API Gateways)
Mục tiêu là đảm bảo mỗi vai trò chỉ có thể thực hiện đúng phạm vi chức năng được giao, không thể leo thang đặc quyền hay đọc trộm dữ liệu.

*   **2.1. Kiểm thử ma trận phân quyền 10 Roles**
    *   **Superadmin / Admin / Director**: Có toàn quyền CRUD tài khoản, thiết lập hệ thống, xem mọi loại báo cáo và phê duyệt tất cả các đề xuất/cọc.
    *   **Nhân sự (HR)**: Có toàn quyền CRUD tài khoản nhân sự, chỉnh sửa cấu trúc lương & phụ cấp tùy chỉnh, phê duyệt nghỉ phép/tạm ứng. Không có quyền sửa cấu trúc chia lead hay cấu hình hệ thống chung.
    *   **Kế toán (Accountant)**: Có toàn quyền quản lý giao dịch, cọc (`deposits`), chi phí (`expenses`), hóa đơn (`invoices`), và báo cáo tài chính (`finance`). Không có quyền can thiệp vào cài đặt hệ thống.
    *   **Marketing**: Toàn quyền quản lý chiến dịch (`campaigns`), import/export lead và phân bổ data lead cho Sale.
    *   **Trưởng phòng (Manager)**: Quản lý nhóm kinh doanh của mình, xem báo cáo của đội nhóm, không được xem nhóm khác.
    *   **Kinh doanh (Sale)**: Chỉ được xem và tương tác với các lead/deal do mình sở hữu (`own`). Không được phép xóa lead/deal hay duyệt cọc.
    *   **Viewer**: Chỉ có quyền đọc (`read`), không có quyền ghi hay sửa đổi dữ liệu ở bất kỳ màn hình nào.
*   **2.2. Kiểm thử giả lập Payload truy cập trái phép (Bypass Protection)**
    *   Dùng payload của tài khoản Sale gửi yêu cầu nâng cấp quyền thành `admin` hoặc `superadmin` -> Backend phải chặn và báo lỗi 403.
    *   Dùng tài khoản Viewer gửi yêu cầu tạo mới hoặc chỉnh sửa Contact/Lead -> Backend phải chặn 403.

---

## 3. Kiểm thử Logic Nghiệp vụ Lõi (Core Business Logic)
Kiểm thử tính đúng đắn của các quy tắc nghiệp vụ đặc thù được cấu hình trong `AGENTS.md`.

*   **3.1. Quy tắc đặt cọc & Doanh thu (Deposit Rules)**
    *   **Kịch bản A (Bể cọc trước khi có doanh thu)**: Tạo một lead -> Đặt cọc -> Hủy cọc (status chuyển thành `cancelled`) khi chưa có đợt thu nào phát sinh. Xác nhận trạng thái của KHTN/Person bị tụt về mức trước đó (ví dụ: `Booking` hoặc `Đã Gặp`), đồng thời đồng hồ bảo mật của lead được kích hoạt chạy lại bình thường.
    *   **Kịch bản B (Bể cọc sau khi đã đóng tiền)**: Đặt cọc -> Đóng đợt 1 (phát sinh doanh thu thực tế ghi nhận vào hệ thống) -> Hủy cọc. Xác nhận trạng thái Person vẫn được giữ nguyên ở mức `Đặt Cọc`.
*   **3.2. Quy tắc đổi căn hộ/dự án (Unit Switching)**
    *   Thực hiện đổi căn cho khách hàng:
        1. Đóng deal cũ lại và đánh dấu thất bại/đổi căn.
        2. Tạo deal mới hoàn toàn.
        3. Gắn liên kết lịch sử ghi rõ *"Đổi từ căn A"* ở deal mới. Kiểm tra xem audit trail của deal mới có ghi nhận đầy đủ liên kết này không.
*   **3.3. Tín hiệu Conversion API (CAPI) một chiều (Forward-only)**
    *   Khi deal chuyển sang trạng thái thành công (Purchase), tín hiệu CAPI được gửi về Meta.
    *   Khi deal bị hủy cọc sau đó, xác nhận **tuyệt đối không gửi tín hiệu lùi/hạ cấp** về Meta. Tín hiệu chỉ đi một chiều đi lên.
*   **3.4. Logic Vòng chia & Phân bổ Lead**
    *   Kiểm tra số lần tự động recall lead khi hết hạn tương tác (`lead_max_recall_attempts`).
    *   Xác minh thuật toán phân bổ lead cho các tư vấn viên trực ca (`getNextConsultantInRound`), loại trừ các nhân viên đang bật chế độ nghỉ phép (`vacation_mode`).

---

## 4. Kiểm thử Tương tác Frontend & Payload Hợp lệ
Đảm bảo giao diện người dùng tương tác đúng đắn, không gửi thiếu trường hoặc gửi sai định dạng dữ liệu về Backend.

*   **4.1. Chế độ Read-only & Chỉnh sửa của Drawer**
    *   Khi mở drawer tài khoản cá nhân: tab Lương hiển thị ở dạng chỉ xem (read-only), không cho phép sửa đổi số tiền.
    *   Khi HR mở drawer nhân viên khác: tab Lương mở đầy đủ các ô nhập liệu cho phép thay đổi chỉ số lương, bảo hiểm, và thêm các phụ cấp động mới.
*   **4.2. Quản lý phụ cấp động tùy chỉnh**
    *   HR thêm mới 2 phụ cấp động: *"Phụ cấp đi lại"* (300k) và *"Thưởng hiệu quả"* (700k).
    *   Nhấn Lưu thay đổi -> Xác minh API gửi đúng chuỗi JSON của mảng phụ cấp động này về backend.
    *   Tắt drawer, mở lại -> Xác minh dữ liệu được tải lại và hiển thị chính xác.
*   **4.3. Ràng buộc File đính kèm (Attachments & Size Limits)**
    *   Tải lên tài liệu hợp lệ (.pdf, .doc, .png) -> Thành công.
    *   Tải lên file không được hỗ trợ hoặc file có kích thước vượt giới hạn -> Hệ thống hiển thị cảnh báo lỗi và chặn không cho gửi lên server.

---

## 5. Kiểm thử Hệ thống Thông báo (Notification & Integrations System)
Mục tiêu là đảm bảo thông tin liên lạc được gửi đi đúng địa chỉ, đúng thời điểm và không bị gián đoạn.

*   **5.1. Thông báo đẩy trong ứng dụng (In-app NotificationService)**
    *   Nhân viên gửi đơn xin nghỉ phép -> Người duyệt (approver) nhận được thông báo đẩy thời gian thực.
    *   Đề xuất cọc được duyệt -> Sale nhận được thông báo biến động trạng thái cọc.
*   **5.2. Tích hợp Zalo Bot & Telegram Bot**
    *   Xác minh tính năng gửi OTP kích hoạt qua Zalo Bot (`sendZaloMessage`).
    *   Xác minh các sự kiện quá hạn xử lý (SLA) hoặc cảnh báo khẩn cấp được bắn về nhóm Telegram nội bộ thông qua Telegram Bot.

---

## 6. Danh sách Kịch bản Kiểm thử Thực tế (Live Matrix Test Cases)

| Mã TC | Phân hệ | Mô tả kịch bản kiểm thử | Kết quả mong đợi |
| :--- | :--- | :--- | :--- |
| **TC-DB-01** | Database | Chạy migrations v194 trên Live DB Staging | Tạo thành công cột `custom_fields_json` trong bảng `hrm_profiles`. |
| **TC-RB-01** | RBAC | Đăng nhập tài khoản HR, truy cập và lưu thay đổi lương nhân viên | Lưu thành công dữ liệu hồ sơ xuống database. |
| **TC-RB-02** | RBAC | Đăng nhập tài khoản Accountant, phê duyệt đặt cọc của Sale | Trạng thái cọc chuyển thành `approved` và cập nhật dòng tiền. |
| **TC-RB-03** | RBAC | Đăng nhập tài khoản Sale, gửi API yêu cầu duyệt cọc của chính mình | Backend trả về lỗi 403 Forbidden. |
| **TC-PL-01** | Payroll | HR nhập phụ cấp động 500k và 300k cho Sale -> Tính lương | Tổng phụ cấp trên phiếu lương tự động cộng dồn thêm 800k. |
| **TC-BR-01** | Business | Hủy cọc khi chưa phát sinh doanh thu | Trạng thái Person tự động quay về trạng thái trước đó. |
| **TC-NO-01** | Notify | Tạo đơn xin nghỉ phép mới trên client | Người duyệt nhận được thông báo đẩy HRM_LEAVE_REQUEST. |
