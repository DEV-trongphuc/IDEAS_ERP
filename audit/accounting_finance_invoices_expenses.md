# Phân hệ 12: Kế toán, Tài chính, Hóa đơn & Chi phí (Accounting, Finance, Invoices & Expenses)

Tệp tin này đặc tả kịch bản kiểm thử chi tiết cho toàn bộ các quy trình kế toán, xuất bản hóa đơn, quản lý chi phí, phê duyệt đề xuất chi và tổng hợp báo cáo tài chính của IDEAS ERP.

---

## 🧾 1. Quản lý Hóa đơn & Ghi nhận Doanh thu (Invoices & Cash Inflow)

### Kịch bản 1.1: Tạo hóa đơn từ phiếu đặt cọc (Create Invoice)
*   **Các bước thực hiện**:
    1. Kế toán truy cập một Phiếu đặt cọc (Deposit) đã được phê duyệt.
    2. Bấm nút **"Xuất hóa đơn"** (Create Invoice).
    3. Hệ thống tự động điền các thông tin từ đợt thanh toán (Milestone) bao gồm: Tên khách hàng, Số tiền, Mô tả thanh toán.
    4. Nhấn **Lưu**.
*   **Kết quả mong đợi**:
    *   Hóa đơn được tạo thành công trong bảng `invoices` ở trạng thái `unpaid`.
    *   Mã số hóa đơn được sinh tự động theo định dạng chuẩn (ví dụ: `INV-2026-0001`).

### Kịch bản 1.2: Xác nhận thanh toán hóa đơn (Mark Paid & Cash Flow Trigger)
*   **Các bước thực hiện**:
    1. Khách hàng thực hiện thanh toán chuyển khoản, Kế toán nhận được UNC.
    2. Kế toán bấm nút **"Xác nhận đã thanh toán"** (Mark Paid) trên Hóa đơn.
    3. Nhập ngày thực thu và phương thức thanh toán (Tiền mặt/Chuyển khoản).
*   **Kết quả mong đợi**:
    *   Trạng thái hóa đơn chuyển sang `paid`.
    *   Hệ thống tự động cập nhật trạng thái của Đợt thanh toán (Deposit Milestone) tương ứng sang `approved`.
    *   Dòng tiền vào (Cash Inflow) được ghi nhận vào báo cáo tài chính tổng hợp.

---

## 💸 2. Quản lý Chi phí & Đề xuất Chi (Expenses & Cash Outflow)

### Kịch bản 2.1: Quy trình tạo đề xuất chi phí (Create Expense)
*   **Các bước thực hiện**:
    1. Nhân viên (ví dụ: Sale hoặc Hành chính) tạo một Đề xuất chi phí (ví dụ: *Chi phí gửi xe gặp khách hàng* hoặc *Mua văn phòng phẩm*).
    2. Đính kèm ảnh hóa đơn/biên lai bán lẻ.
    3. Nhấn **Gửi duyệt**.
*   **Kết quả mong đợi**:
    *   Đề xuất được tạo thành công ở trạng thái `pending_approval`.

### Kịch bản 2.2: Phê duyệt đề xuất & Giải ngân (Approve Expense)
*   **Các bước thực hiện**:
    1. Kế toán hoặc HR/Admin mở danh sách chi phí chờ duyệt.
    2. Xem chi tiết hóa đơn đính kèm và bấm **"Phê duyệt"** (Approve).
*   **Kết quả mong đợi**:
    *   Trạng thái đề xuất chi chuyển sang `approved`.
    *   Hệ thống tự động ghi nhận một khoản Dòng tiền ra (Cash Outflow) vào hệ thống.
    *   Assignee nhận được thông báo đề xuất đã được duyệt và có thể nhận tiền giải ngân.

---

## 📊 3. Báo cáo Tài chính Tổng hợp (Finance Summary)

### Kịch bản 3.1: Đối soát Dòng tiền Ròng (Net Cash Flow)
*   **Các bước thực hiện**:
    1. Kế toán mở trang **Báo cáo Tài chính** (`Finance Summary`).
*   **Kết quả mong đợi**:
    *   Hệ thống thực hiện tính toán tổng hợp:
        `Dòng tiền ròng (Net Flow) = Tổng thu (Invoices Paid + Deposit Approved) - Tổng chi (Expenses Approved)`
    *   Kiểm tra số liệu cộng dồn từng tháng hiển thị trên biểu đồ doanh thu - chi phí phải khớp 100% với dữ liệu thực tế trong CSDL.
    *   Hệ thống cho phép lọc dữ liệu theo khoảng thời gian (Từ ngày - Đến ngày) và cập nhật số liệu chính xác tức thì.
