import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import api from '../api/axios';
import { 
  FileText, Calendar, CheckCircle, ShieldCheck, PenTool,
  Clock, DollarSign, Award, Percent, HelpCircle, Plus, Send,
  ChevronLeft, ChevronRight, XCircle, CheckCircle2, Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';
import { ApprovalDetailDrawer } from './Approvals';
import { CustomModal } from '../components/ui/CustomModal';

export default function MyPayslips() {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'payslip' | 'leaves' | 'advances'>('payslip');

  const getPeriodLabel = (periodStr: string) => {
    const parts = periodStr.split('-');
    if (parts.length < 2) return periodStr;
    const year = parts[0];
    const period = parts[1];
    if (period === '13') return `${t('Lương tháng 13')} - ${t('Năm')} ${year}`;
    if (period === 'MID') return `${t('Thưởng giữa năm')} - ${t('Năm')} ${year}`;
    if (period === 'YEND') return `${t('Thưởng cuối năm')} - ${t('Năm')} ${year}`;
    return `${t('Tháng')} ${period}/${year}`;
  };

  const getTitleLabel = (periodStr: string) => {
    const parts = periodStr.split('-');
    if (parts.length < 2) return t('BẢNG THANH TOÁN TIỀN LƯƠNG');
    const period = parts[1];
    if (period === '13') return t('PHIẾU THANH TOÁN LƯƠNG THÁNG 13');
    if (period === 'MID') return t('PHIẾU THANH TOÁN TIỀN THƯỞNG GIỮA NĂM');
    if (period === 'YEND') return t('PHIẾU THANH TOÁN TIỀN THƯỞNG CUỐI NĂM');
    return t('BẢNG THANH TOÁN TIỀN LƯƠNG & PHỤ CẤP');
  };

  const periodOptions = React.useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [currentYear, currentYear - 1];
    const options: { value: string; label: string }[] = [];
    
    years.forEach(yr => {
      // Special periods
      options.push({ value: `${yr}-YEND`, label: `${t('Thưởng cuối năm')} - ${yr}` });
      options.push({ value: `${yr}-13`, label: `${t('Lương tháng 13')} - ${yr}` });
      options.push({ value: `${yr}-MID`, label: `${t('Thưởng giữa năm')} - ${yr}` });
      
      // 12 standard months
      for (let m = 12; m >= 1; m--) {
        const val = `${yr}-${String(m).padStart(2, '0')}`;
        options.push({
          value: val,
          label: `${t('Tháng')} ${String(m).padStart(2, '0')}/${yr}`
        });
      }
    });
    
    return options;
  }, [t]);
  
  // Custom states for multi-level approval & CCs
  const [users, setUsers] = useState<any[]>([]);
  const [leaveApproverId, setLeaveApproverId] = useState<string | number>('');
  const [leaveApproverId2, setLeaveApproverId2] = useState<string | number>('');
  const [leaveRelatedUserIds, setLeaveRelatedUserIds] = useState<any[]>([]);

  const [advanceApproverId, setAdvanceApproverId] = useState<string | number>('');
  const [advanceApproverId2, setAdvanceApproverId2] = useState<string | number>('');
  const [advanceRelatedUserIds, setAdvanceRelatedUserIds] = useState<any[]>([]);

  // Tab 1: Payslip states
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().substring(0, 7));
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [allPayslips, setAllPayslips] = useState<any[]>([]);
  const [payslip, setPayslip] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  // Company configuration states
  const [companyName, setCompanyName] = useState('CÔNG TY CỔ PHẦN CÔNG NGHỆ IDEAS');
  const [companyAddress, setCompanyAddress] = useState('Tòa nhà IDEAS, 123 Đường Láng, Đống Đa, Hà Nội');
  const [companyPhone, setCompanyPhone] = useState('024 1234 5678');
  const [companyTaxId, setCompanyTaxId] = useState('0101234567');
  const [companyLogoUrl, setCompanyLogoUrl] = useState('');

  useEffect(() => {
    fetchAPI('get_settings').then(res => {
      if (res && res.success && res.data) {
        if (res.data.company_name) setCompanyName(res.data.company_name);
        if (res.data.company_address) setCompanyAddress(res.data.company_address);
        if (res.data.company_phone) setCompanyPhone(res.data.company_phone);
        if (res.data.company_tax_id) setCompanyTaxId(res.data.company_tax_id);
        if (res.data.company_logo_url) setCompanyLogoUrl(res.data.company_logo_url);
      }
    }).catch(() => {});
  }, []);

  // Tab 2: Leaves states
  const [leavesList, setLeavesList] = useState<any[]>([]);
  const [leaveType, setLeaveType] = useState('annual');
  const [leaveStart, setLeaveStart] = useState('');
  const [leaveEnd, setLeaveEnd] = useState('');
  const [leaveTotalDays, setLeaveTotalDays] = useState(1.0);
  const [leaveReason, setLeaveReason] = useState('');
  const [submittingLeave, setSubmittingLeave] = useState(false);

  // Tab 3: Advances states
  const [advancesList, setAdvancesList] = useState<any[]>([]);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [advanceReason, setAdvanceReason] = useState('');
  const [submittingAdvance, setSubmittingAdvance] = useState(false);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<any | null>(null);

  // Fetch users list
  useEffect(() => {
    fetchAPI('users?all=1').then(res => {
      setUsers(res?.data || []);
    }).catch(() => {});
  }, []);

  const userOptions = React.useMemo(() => {
    return users.map((u: any) => ({
      value: u.id,
      label: u.full_name || u.username,
      avatar: u.avatar_url || u.avatar,
      sublabel: u.role ? String(u.role).toUpperCase() : ''
    }));
  }, [users]);

  const approver2Options = React.useMemo(() => {
    return [
      { value: '', label: t('Không có (Chỉ duyệt 1 cấp)') },
      ...userOptions
    ];
  }, [userOptions, t]);

  const loadAllPayslips = async () => {
    try {
      const res = await fetchAPI('hrm/payroll?month_year=all');
      setAllPayslips(res?.data || []);
    } catch (err) {
      setAllPayslips([]);
    }
  };

  useEffect(() => {
    loadAllPayslips();
  }, []);

  useEffect(() => {
    if (activeSubTab === 'payslip') {
      loadPayslip();
    } else if (activeSubTab === 'leaves') {
      loadLeaves();
    } else if (activeSubTab === 'advances') {
      loadAdvances();
    }
  }, [activeSubTab, selectedMonth]);

  useEffect(() => {
    if (allPayslips.length > 0) {
      const yearPrefix = `${selectedYear}-`;
      const available = allPayslips.filter(p => p.month_year.startsWith(yearPrefix));
      if (available.length > 0) {
        const sorted = [...available].sort((a, b) => b.month_year.localeCompare(a.month_year));
        if (!available.some(p => p.month_year === selectedMonth)) {
          setSelectedMonth(sorted[0].month_year);
        }
      } else {
        if (!selectedMonth.startsWith(yearPrefix)) {
          setSelectedMonth(`${selectedYear}-12`);
        }
      }
    }
  }, [allPayslips, selectedYear]);

  const loadPayslip = async () => {
    try {
      const res = await fetchAPI(`hrm/payroll?month_year=${selectedMonth}`);
      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        setPayslip(res.data[0]);
      } else {
        setPayslip(null);
      }
    } catch (err: any) {
      setPayslip(null);
    }
  };

  const loadLeaves = async () => {
    try {
      const res = await fetchAPI('hrm/leaves');
      setLeavesList(res?.data || []);
    } catch (err: any) {
      setLeavesList([]);
    }
  };

  const loadAdvances = async () => {
    try {
      const res = await fetchAPI('hrm/advances');
      setAdvancesList(res?.data || []);
    } catch (err: any) {
      setAdvancesList([]);
    }
  };

  // --- LEAVE SUBMISSION ---
  const handleRequestLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveStart || !leaveEnd || !leaveReason.trim()) {
      toast.error(t('Vui lòng điền đầy đủ thông tin đăng ký phép!'));
      return;
    }
    if (!leaveApproverId) {
      toast.error(t('Vui lòng chọn Người duyệt cấp 1!'));
      return;
    }
    setSubmittingLeave(true);
    try {
      await fetchAPI('hrm/leaves', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leave_type: leaveType,
          start_date: leaveStart,
          end_date: leaveEnd,
          total_days: leaveTotalDays,
          reason: leaveReason,
          approver_id: leaveApproverId,
          approver_id_2: leaveApproverId2 || null,
          related_user_ids: leaveRelatedUserIds
        })
      });
      toast.success(t('Gửi đơn xin nghỉ phép thành công!'));
      setLeaveReason('');
      setLeaveTotalDays(1.0);
      setLeaveApproverId('');
      setLeaveApproverId2('');
      setLeaveRelatedUserIds([]);
      loadLeaves();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi gửi đơn nghỉ phép'));
    } finally {
      setSubmittingLeave(false);
    }
  };

  // --- ADVANCE SUBMISSION ---
  const handleRequestAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (advanceAmount <= 0 || !advanceReason.trim()) {
      toast.error(t('Vui lòng điền số tiền và lý do tạm ứng hợp lệ!'));
      return;
    }
    if (!advanceApproverId) {
      toast.error(t('Vui lòng chọn Người duyệt cấp 1!'));
      return;
    }
    setSubmittingAdvance(true);
    try {
      await fetchAPI('hrm/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: advanceAmount,
          reason: advanceReason,
          approver_id: advanceApproverId,
          approver_id_2: advanceApproverId2 || null,
          related_user_ids: advanceRelatedUserIds
        })
      });
      toast.success(t('Gửi đề xuất tạm ứng lương thành công!'));
      setAdvanceAmount(0);
      setAdvanceReason('');
      setAdvanceApproverId('');
      setAdvanceApproverId2('');
      setAdvanceRelatedUserIds([]);
      loadAdvances();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi gửi yêu cầu tạm ứng'));
    } finally {
      setSubmittingAdvance(false);
    }
  };

  // --- SIGNATURE DRAWING PAD ---
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'var(--color-primary, #3b82f6)';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  const handleConfirmPayslip = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
      toast.error(t('Vui lòng vẽ chữ ký của bạn trước khi xác nhận!'));
      return;
    }

    setSubmitting(true);
    const signatureUrl = canvas.toDataURL('image/png');

    try {
      await fetchAPI('hrm/payroll/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: payslip.id,
          signature_url: signatureUrl
        })
      });
      toast.success(t('Đã ký nhận và xác nhận phiếu lương thành công!'));
      loadAllPayslips();
      loadPayslip();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi xác nhận phiếu lương'));
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const currentYear = new Date().getFullYear();
  const years = [currentYear, currentYear - 1, currentYear - 2];

  return (
    <div>
      
      {/* Title */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">
            {t('Cổng Nhân sự Cá nhân')}
          </h1>
          <p className="page-subtitle">
            {t('Tra cứu phiếu lương, đăng ký lịch nghỉ phép và tạm ứng thu nhập nhanh chóng.')}
          </p>
        </div>
        
        {activeSubTab === 'payslip' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0, whiteSpace: 'nowrap' }} className="no-print">
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap', display: 'inline-block' }}>{t('Chọn năm')}:</span>
            <select
              value={selectedYear}
              onChange={e => setSelectedYear(parseInt(e.target.value, 10))}
              className="form-input"
              style={{
                height: 38,
                padding: '0 30px 0 16px',
                fontWeight: 700,
                fontSize: '0.875rem',
                minWidth: '100px',
                width: 'auto',
                borderRadius: '12px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)',
                outline: 'none',
                transition: 'all 0.2s',
                appearance: 'none',
                WebkitAppearance: 'none',
                backgroundImage: 'url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http://www.w3.org/2000/svg%27 width=%2712%27 height=%2712%27 viewBox=%270 0 12 12%27%3E%3Cpath fill=%27%236b7280%27 d=%27M6 8L2 4h8z%27/%3E%3C/svg%3E")',
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '10px'
              }}
            >
              {years.map(yr => (
                <option key={yr} value={yr}>
                  {yr}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: PAYSLIP */}
      {activeSubTab === 'payslip' && (
        <div>
          {/* 12-Month Cards Layout (4 cards per row) */}
          <div 
            style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(4, 1fr)', 
              gap: '16px', 
              marginBottom: '2rem' 
            }} 
            className="no-print"
          >
            {Array.from({ length: 12 }).map((_, idx) => {
              const m = idx + 1;
              const mStr = `${selectedYear}-${String(m).padStart(2, '0')}`;
              const payslipForMonth = allPayslips.find(p => p.month_year === mStr);
              const isAvailable = !!payslipForMonth;
              const isSelected = selectedMonth === mStr;

              return (
                <div
                  key={mStr}
                  onClick={() => {
                    if (isAvailable) {
                      setSelectedMonth(mStr);
                      setIsModalOpen(true);
                    }
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--color-primary-light, #eff6ff), #dbeafe)' 
                      : isAvailable 
                        ? 'var(--color-surface)' 
                        : 'rgba(241, 245, 249, 0.4)',
                    border: isSelected 
                      ? '2px solid var(--color-primary, #3b82f6)' 
                      : '1px solid var(--color-border-light)',
                    cursor: isAvailable ? 'pointer' : 'not-allowed',
                    opacity: isAvailable ? 1 : 0.5,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.25s',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)',
                    pointerEvents: isAvailable ? 'auto' : 'none'
                  }}
                  className={isAvailable ? 'hover-translate-y' : ''}
                >
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Tháng</span>
                  <span style={{ fontSize: '1.5rem', fontWeight: 800, color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-text)' }}>{m}</span>
                  {isAvailable ? (
                    <>
                      <span style={{ 
                        fontSize: '0.85rem', 
                        fontWeight: 800, 
                        color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-text)', 
                        marginTop: '4px' 
                      }}>
                        {formatCurrency(payslipForMonth.net_salary)}
                      </span>
                      <span style={{ 
                        fontSize: '0.65rem', 
                        fontWeight: 700, 
                        color: payslipForMonth.status === 'confirmed' ? '#10b981' : '#f59e0b',
                        background: payslipForMonth.status === 'confirmed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                        padding: '2px 6px',
                        borderRadius: '6px',
                        marginTop: '4px'
                      }}>
                        {payslipForMonth.status === 'confirmed' ? 'Đã ký nhận' : 'Chờ ký'}
                      </span>
                    </>
                  ) : (
                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginTop: '6px' }}>
                      Chưa có
                    </span>
                  )}
                </div>
              );
            })}

            {/* Special Periods */}
            {['MID', '13', 'YEND'].map(suffix => {
              const key = `${selectedYear}-${suffix}`;
              const payslipForPeriod = allPayslips.find(p => p.month_year === key);
              if (!payslipForPeriod) return null;
              const isSelected = selectedMonth === key;
              const label = suffix === '13' ? 'Lương T13' : suffix === 'MID' ? 'Thưởng Giữa Năm' : 'Thưởng Cuối Năm';

              return (
                <div
                  key={key}
                  onClick={() => {
                    setSelectedMonth(key);
                    setIsModalOpen(true);
                  }}
                  style={{
                    padding: '16px',
                    borderRadius: '16px',
                    background: isSelected 
                      ? 'linear-gradient(135deg, var(--color-primary-light, #eff6ff), #dbeafe)' 
                      : 'var(--color-surface)',
                    border: isSelected 
                      ? '2px solid var(--color-primary, #3b82f6)' 
                      : '1px solid var(--color-border-light)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.25s',
                    boxShadow: isSelected ? 'var(--shadow-md)' : 'var(--shadow-sm)'
                  }}
                  className="hover-translate-y"
                >
                  <span style={{ fontSize: '0.8rem', fontWeight: 800, color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-text)', textAlign: 'center' }}>
                    {label}
                  </span>
                  <span style={{ 
                    fontSize: '0.85rem', 
                    fontWeight: 800, 
                    color: isSelected ? 'var(--color-primary, #3b82f6)' : 'var(--color-text)', 
                    marginTop: '2px' 
                  }}>
                    {formatCurrency(payslipForPeriod.net_salary)}
                  </span>
                  <span style={{ 
                    fontSize: '0.65rem', 
                    fontWeight: 700, 
                    color: payslipForPeriod.status === 'confirmed' ? '#10b981' : '#f59e0b',
                    background: payslipForPeriod.status === 'confirmed' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(245, 158, 11, 0.08)',
                    padding: '2px 6px',
                    borderRadius: '6px',
                    marginTop: '4px'
                  }}>
                    {payslipForPeriod.status === 'confirmed' ? 'Đã ký nhận' : 'Chờ ký'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detailed Payslip Modal */}
      <CustomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={t("Chi tiết Phiếu lương")}
        width="860px"
      >
        <div style={{ maxHeight: '80vh', overflowY: 'auto', padding: '10px' }} className="no-scrollbar">
          {payslip ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div style={{
                background: payslip.status === 'confirmed' ? 'rgba(16, 185, 129, 0.08)' : payslip.status === 'sent' ? 'rgba(59, 130, 246, 0.08)' : 'rgba(107, 114, 128, 0.08)',
                border: `1px solid ${payslip.status === 'confirmed' ? 'rgba(16, 185, 129, 0.3)' : payslip.status === 'sent' ? 'rgba(59, 130, 246, 0.3)' : 'rgba(107, 114, 128, 0.3)'}`,
                borderRadius: '12px',
                padding: '1rem 1.25rem',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                {payslip.status === 'confirmed' ? (
                  <ShieldCheck size={20} style={{ color: '#10b981' }} />
                ) : (
                  <Clock size={20} style={{ color: '#3b82f6' }} />
                )}
                <div style={{ flex: 1 }}>
                  <strong style={{ fontSize: '0.9rem', color: payslip.status === 'confirmed' ? '#10b981' : '#3b82f6' }}>
                    {payslip.status === 'confirmed' ? t('Bảng lương đã ký nhận thành công!') : payslip.status === 'sent' ? t('Phiếu lương đang chờ bạn ký xác nhận') : t('Phiếu lương nháp (chưa công bố)')}
                  </strong>
                  <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                    {payslip.status === 'confirmed' 
                      ? `${t('Đã xác nhận lúc')}: ${new Date(payslip.confirmed_at).toLocaleString('vi-VN')}` 
                      : t('Vui lòng kiểm tra kỹ chi tiết trước khi ký số xác nhận lương Net.')}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }} className="no-print">
                <button
                  onClick={() => window.print()}
                  className="btn danger sm"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    background: 'var(--color-danger, #ef4444)',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(239, 68, 68, 0.2)',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = '#dc2626'}
                  onMouseLeave={e => e.currentTarget.style.background = '#ef4444'}
                >
                  <Download size={14} /> {t('In / Xuất PDF')}
                </button>
              </div>

              <div id="payslip-print-area" className="card" style={{
                padding: '3rem',
                background: '#ffffff',
                color: '#1e293b',
                border: '1px solid var(--color-border-light)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
                position: 'relative',
                width: '100%',
                boxSizing: 'border-box'
              }}>
                <style>{`
                  @media print {
                    body * { visibility: hidden !important; }
                    #payslip-print-area, #payslip-print-area * { visibility: visible !important; }
                    #payslip-print-area { position: absolute !important; left: 0 !important; top: 0 !important; width: 100% !important; padding: 20mm !important; }
                  }
                `}</style>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Logo" style={{ height: 42, maxWidth: 100, objectFit: 'contain' }} />
                    ) : (
                      <div style={{ background: 'var(--color-primary)', color: 'white', padding: '8px 12px', borderRadius: '8px', fontWeight: 900, fontSize: '1rem' }}>
                        {companyName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ fontSize: '0.9rem', color: '#1e293b', textTransform: 'uppercase' }}>{companyName}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{t('Địa chỉ')}: {companyAddress}</span>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: '#64748b', marginTop: 2 }}>
                        <span>{t('SĐT')}: {companyPhone}</span>
                        <span>{t('MST')}: {companyTaxId}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: '#64748b' }}>
                    <strong>{t('MÃ PHIẾU')}: PL-{payslip.id}-{selectedMonth}</strong>
                    <span>{t('Ngày in')}: {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: '#1e293b' }}>
                    {getTitleLabel(selectedMonth)}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: '#64748b', marginTop: 6, fontWeight: 600 }}>
                    {t('Kỳ thanh toán')}: {getPeriodLabel(selectedMonth)}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', textAlign: 'left', fontSize: '0.875rem', border: '1px solid var(--color-border-light)', borderRadius: '10px', padding: '1rem', background: '#f8fafc' }}>
                    <div>
                      <span style={{ color: '#64748b' }}>{t('Nhân viên')}:</span> <strong>{payslip.employee_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t('Chức vụ')}:</span> <strong>{payslip.job_title || 'Tư vấn viên'}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t('Số ngày công làm việc')}:</span> <strong>{payslip.work_days_actual} / {payslip.work_days_required}</strong>
                    </div>
                    <div>
                      <span style={{ color: '#64748b' }}>{t('Đi muộn')}:</span> <strong style={{ color: payslip.lateness_minutes > 0 ? '#ef4444' : 'inherit' }}>{payslip.lateness_minutes} {t('phút')}</strong>
                    </div>
                  </div>
                </div>

                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: '#1e293b', background: '#f8fafc', fontWeight: 700 }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>{t('Khoản mục')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>{t('Thông số')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t('Cộng (Thu nhập)')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t('Trừ (Khấu trừ)')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương thực tế theo ngày công')}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{payslip.work_days_actual} / {payslip.work_days_required} {t('ngày công')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.salary_basic_calculated)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                    </tr>
                    {Number(payslip.kpi_bonus || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương thưởng doanh số KPI')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.kpi_bonus)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                      </tr>
                    )}
                    {Number(payslip.overtime_salary || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương tăng ca')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{payslip.overtime_days || 0} {t('ngày')} (x1.5)</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.overtime_salary)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                      </tr>
                    )}
                    {Number(payslip.diligence_bonus || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Thưởng chuyên cần')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.diligence_bonus)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                      </tr>
                    )}
                    {Number(payslip.allowance_total || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Phụ cấp (Ăn trưa, Xăng xe, Điện thoại)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.allowance_total)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                      </tr>
                    )}
                    {(Number(payslip.insurance_bhxh || 0) + Number(payslip.insurance_bhyt || 0) + Number(payslip.insurance_bhtn || 0)) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ Bảo hiểm (BHXH, BHYT, BHTN)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{payslip.has_insurance === 1 ? t('Có tham gia') : t('Không')}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(Number(payslip.insurance_bhxh || 0) + Number(payslip.insurance_bhyt || 0) + Number(payslip.insurance_bhtn || 0))}</td>
                      </tr>
                    )}
                    {Number(payslip.lateness_penalty || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ đi trễ')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>{payslip.lateness_minutes} {t('phút')}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.lateness_penalty)}</td>
                      </tr>
                    )}
                    {Number(payslip.tax_pit || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Thuế Thu nhập Cá nhân (PIT)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.tax_pit)}</td>
                      </tr>
                    )}
                    {Number(payslip.advance_deduction || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ tạm ứng')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: '#64748b' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#94a3b8' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.advance_deduction)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                <div style={{ marginTop: '1.5rem', borderTop: '2px double #cbd5e1', paddingTop: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <strong style={{ fontSize: '1rem', textTransform: 'uppercase' }}>{t('THỰC LĨNH CHUYỂN KHOẢN (NET PAY)')}</strong>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{formatCurrency(payslip.net_salary)}</strong>
                </div>
                {payslip.status === 'confirmed' && payslip.signature_url && (
                  <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', color: '#64748b', fontStyle: 'italic', marginBottom: 4 }}>{t('Đã xác nhận & ký nhận online')}</span>
                    <img src={payslip.signature_url} alt="Signature" style={{ width: '150px', height: '60px', objectFit: 'contain', borderBottom: '1px solid #64748b' }} />
                    <strong style={{ fontSize: '0.85rem', marginTop: 4 }}>{payslip.employee_name}</strong>
                  </div>
                )}
              </div>
              {payslip.status === 'sent' && (
                <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
                    <PenTool size={16} style={{ color: 'var(--color-primary)' }} />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{t('Ký nhận Phiếu Lương trực tuyến')}</h4>
                  </div>
                  <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, background: 'var(--color-bg-secondary)', overflow: 'hidden', position: 'relative', height: 160 }}>
                    <canvas ref={canvasRef} width={500} height={160} style={{ width: '100%', height: '100%', cursor: 'crosshair' }} onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing} onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                    <button onClick={clearCanvas} className="btn secondary" style={{ padding: '6px 14px', fontSize: '0.825rem' }}>{t('Vẽ lại')}</button>
                    <button onClick={handleConfirmPayslip} disabled={submitting} className="btn primary" style={{ padding: '6px 20px', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <CheckCircle size={14} />
                      {submitting ? t('Đang ký...') : t('Ký xác nhận lương')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      </CustomModal>

      {/* Progress Timeline Drawer */}
      {selectedTimelineItem && (
        <ApprovalDetailDrawer
          item={selectedTimelineItem}
          onClose={() => setSelectedTimelineItem(null)}
          users={users}
          t={t}
          onApprove={async () => {}}
          onReject={() => {}}
          isAdmin={false}
        />
      )}
    </div>
  );
}


