import React, { createContext, useContext, useCallback, useMemo } from 'react';

type Language = 'vi' | 'en' | 'ja' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  isTranslationLoading: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const viOverrides: Record<string, string> = {
  "Hoạt động (Nhật ký)": "Hoạt động",
  
  // Navigation / Sidebar / Page titles
  "Dự án": "Danh mục sản phẩm",
  "Căn hộ": "Mã sản phẩm / SKU",
  "Giỏ hàng": "Danh sách sản phẩm",
  "Giỏ hàng dự án": "Danh sách sản phẩm",
  "Chi tiết căn hộ": "Chi tiết sản phẩm",
  "Mã căn": "Mã sản phẩm",
  "Tên dự án": "Nhóm sản phẩm",
  "Tiến độ thanh toán": "Đợt thanh toán",
  "Bảng hàng": "Bảng sản phẩm",
  "Bảng hàng dự án": "Bảng sản phẩm",
  "Đổi căn": "Đổi sản phẩm",
  "Bể cọc": "Hủy giao dịch",
  "Phiếu đặt cọc": "Tạm ứng / Đặt cọc",
  "Phiếu hợp tác": "Hợp đồng CTV / Đối tác",
  "Phí môi giới": "Chiết khấu hoa hồng",
  "Hoa hồng": "Trích thưởng/Chiết khấu",
  "Ráp căn": "Chọn sản phẩm",
  "Giữ chỗ": "Đặt giữ chỗ",
  "Kho hàng": "Kho hàng",
  "Danh sách dự án": "Danh mục sản phẩm",
  "Chủ đầu tư": "Nhà cung cấp",
  
  // Statuses / Pipeline stages
  "Đặt Cọc": "Đặt Cọc / Tạm Ứng",
  "Booking": "Giữ chỗ / Đăng ký trước",
  "Đã Gặp": "Đã Gặp / Tư Vấn",
  "Đã Nhận Cọc": "Đã Nhận Tạm Ứng",
  "Bể cọc sau khi đã có doanh thu": "Hủy giao dịch đã phát sinh dòng tiền",
  "Bể cọc trước khi phát sinh doanh thu": "Hủy giao dịch chưa có dòng tiền",
  
  // Documents / Details / Modals
  "Phiếu giữ chỗ": "Đơn đặt trước",
  "Báo cáo BĐS": "Báo cáo Kinh doanh",
  "Doanh số BĐS": "Doanh số Bán hàng",
  "Khách hàng tiềm năng": "Khách hàng",
  "Cơ hội giao dịch": "Giao dịch / Đơn hàng",
  "Thêm data nhanh": "Thêm khách hàng",
  "Thêm data cá nhân": "Tự thêm khách hàng",
  "Lưu & Giao Data": "Lưu & Phân bổ Khách hàng",
  
  // Rule settings / Business rules / Administration
  "Bể cọc (Deposit Cancellation trước doanh thu)": "Hủy cọc trước khi phát sinh doanh thu",
  "Bể cọc sau khi có doanh thu (Deposit Cancellation sau doanh thu)": "Hủy cọc sau khi phát sinh doanh thu",
  "Đổi căn (Unit Switching)": "Đổi sản phẩm giao dịch",
  "Đồng hồ bảo mật": "Thời hạn chăm sóc Khách hàng",
  "giải phóng ra Kho data chung": "thu hồi về Kho khách hàng dùng chung",
  "Kho Databank": "Kho khách hàng chung",
  "Vòng phân bổ": "Vòng chia Lead",
  "Quy tắc định tuyến": "Quy tắc chia số",
  "Tích hợp Data": "Tích hợp Lead/Data",
  "Vòng xoay chia số (Rounds)": "Vòng xoay chia số",
  "Quy tắc chia số (Rules)": "Quy tắc chia số",
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const t = useCallback((key: string): string => {
    return viOverrides[key] || key;
  }, []);

  const contextValue = useMemo(() => ({
    language: 'vi' as Language,
    setLanguage: () => {},
    t,
    isTranslationLoading: false
  }), [t]);

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
