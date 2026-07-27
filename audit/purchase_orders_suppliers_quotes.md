# Phân hệ 10: Mua hàng, Nhà cung cấp, Báo giá & Tệp tin đám mây (Purchase Orders, Quotes & Cloud Storage)

Tệp tin này đặc tả kịch bản kiểm thử cho hệ thống nhập mua vật tư, quản lý danh mục Nhà cung cấp, phát hành Báo giá (Quotes) cho khách hàng, và hệ thống lưu trữ quản lý tài liệu đám mây (Cloud Files).

---

## 🛒 1. Đơn mua hàng & Quản lý Nhà cung cấp (Purchase Orders & Suppliers)

### Kịch bản 1.1: Tạo và phê duyệt đơn mua hàng (PO Approval Flow)
*   **Các bước thực hiện**:
    1. Phòng ban (ví dụ: Hành chính nhân sự) tạo một **Đơn đặt mua thiết bị** (Purchase Order - PO) gồm danh sách: 10 máy in, 50 ram giấy.
    2. Chọn nhà cung cấp từ danh mục `suppliers`.
    3. Trình duyệt PO lên Giám đốc hoặc Trưởng phòng phê duyệt.
*   **Kết quả mong đợi**:
    *   PO được ghi nhận ở trạng thái chờ duyệt (`pending_approval`).
    *   Trưởng phòng phê duyệt thành công -> Trạng thái chuyển sang `approved`, hệ thống sinh phiếu đề xuất chi gửi cho Kế toán giải ngân.

### Kịch bản 1.2: Cập nhật công nợ nhà cung cấp
*   **Các bước thực hiện**:
    1. Sau khi nhận hàng, thực hiện thanh toán một phần tiền cho nhà cung cấp A.
*   **Kết quả mong đợi**:
    *   Hệ thống khấu trừ chính xác số tiền đã trả và cập nhật số dư công nợ còn lại phải thu/trả của nhà cung cấp A trong báo cáo tài chính.

---

## 📄 2. Quản lý Báo giá (Quote Editor & POS)

### Kịch bản 2.1: Phát hành báo giá chi tiết (Quotes Generator)
*   **Các bước thực hiện**:
    1. Sale tạo một Báo giá (Quote) gửi cho khách hàng.
    2. Thêm các dòng sản phẩm: Căn hộ A, Gói nội thất đi kèm, chính sách chiết khấu (`discount_percent = 5%`).
    3. Nhấn **Xuất PDF** hoặc phát hành link báo giá.
*   **Kết quả mong đợi**:
    *   Bảng Quote tính đúng công thức:
        `Tổng tiền thanh toán = (Tổng tiền sản phẩm - Chiết khấu) + Thuế VAT`
    *   Hệ thống sinh thành công file PDF báo giá chuyên nghiệp gửi cho khách hàng.

---

## 📂 3. Tài liệu Đám mây & Phân loại thư mục (Cloud Storage)

### Kịch bản 3.1: Quản lý thư mục & Phân quyền file (File Categories & Security)
*   **Các bước thực hiện**:
    1. Admin tạo các danh mục file: *Tài liệu Pháp lý*, *Hồ sơ Nhân sự Nhạy cảm*, *Ảnh Dự án công cộng*.
    2. Thiết lập quyền truy cập: Danh mục *Hồ sơ Nhân sự* chỉ có HR và Admin được truy cập.
    3. Sale thử dùng API để đọc file trong danh mục này.
*   **Kết quả mong đợi**:
    *   Hệ thống kiểm tra vai trò tại API Gateway (`CloudFileController` / `FileCategoryController`).
    *   Cho phép HR/Admin tải file.
    *   Từ chối Sale với lỗi **403 Forbidden**.
