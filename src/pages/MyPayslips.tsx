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
  const [payslip, setPayslip] = useState<any>(null);
  const [submitting, setSubmitting] = useState(false);
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

  useEffect(() => {
    if (activeSubTab === 'payslip') {
      loadPayslip();
    } else if (activeSubTab === 'leaves') {
      loadLeaves();
    } else if (activeSubTab === 'advances') {
      loadAdvances();
    }
  }, [activeSubTab, selectedMonth]);

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

  return (
    <div>
      
      {/* Title */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">
            {t('Cổng Nhân sự Cá nhân (My HR)')}
          </h1>
          <p className="page-subtitle">
            {t('Tra cứu phiếu lương, đăng ký lịch nghỉ phép và tạm ứng thu nhập nhanh chóng.')}
          </p>
        </div>
        
        {true && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{t('Chọn kỳ thanh toán')}:</span>
            <select
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
              className="form-input"
              style={{
                height: 38,
                padding: '0 30px 0 12px',
                fontWeight: 700,
                fontSize: '0.875rem',
                minWidth: '220px',
                borderRadius: '10px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text)',
                cursor: 'pointer',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              {periodOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* TAB 1: PAYSLIP */}
      {true && (
        <div>
          {!payslip ? (
            <EmptyCard
              icon={<FileText />}
              title={t('Chưa có phiếu lương')}
              description={t('Chưa có phiếu lương được phát hành cho tháng này.')}
            />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
              
              {/* Status Alert Banner */}
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

              {/* Paper Bill Design Card */}
              <div id="payslip-print-area" className="card" style={{
                padding: '2.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                {/* Print Template CSS */}
                <style>{`
                  @media print {
                    body * {
                      visibility: hidden !important;
                    }
                    #payslip-print-area, #payslip-print-area * {
                      visibility: visible !important;
                    }
                    #payslip-print-area {
                      position: absolute !important;
                      left: 0 !important;
                      top: 0 !important;
                      width: 100% !important;
                      max-width: 100% !important;
                      padding: 20mm !important;
                      margin: 0 !important;
                      box-shadow: none !important;
                      border: none !important;
                      background: white !important;
                      color: black !important;
                    }
                    .no-print {
                      display: none !important;
                    }
                  }
                `}</style>

                {/* Print Action Button */}
                <button
                  onClick={() => window.print()}
                  className="btn outline sm no-print"
                  style={{
                    position: 'absolute',
                    top: '20px',
                    right: '20px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '6px 14px',
                    fontSize: '0.8rem',
                    fontWeight: 700
                  }}
                >
                  <Download size={14} /> {t('In / Xuất PDF')}
                </button>

                {/* Company Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', borderBottom: '2px solid var(--color-primary)', paddingBottom: '1.5rem' }}>
                  <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {companyLogoUrl ? (
                      <img src={companyLogoUrl} alt="Logo" style={{ height: 42, maxWidth: 100, objectFit: 'contain' }} />
                    ) : (
                      <div style={{
                        background: 'var(--color-primary)',
                        color: 'white',
                        padding: '8px 12px',
                        borderRadius: '8px',
                        fontWeight: 900,
                        fontSize: '1rem',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
                      }}>
                        {companyName.split(' ').slice(-2).map(w => w[0]).join('').toUpperCase()}
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <strong style={{ fontSize: '0.9rem', color: 'var(--color-text)', textTransform: 'uppercase' }}>{companyName}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{t('Địa chỉ')}: {companyAddress}</span>
                      <div style={{ display: 'flex', gap: '15px', fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: 2 }}>
                        <span>{t('SĐT')}: {companyPhone}</span>
                        <span>{t('MST')}: {companyTaxId}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 4, fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                    <strong>{t('MÃ PHIẾU')}: PL-{payslip.id}-{selectedMonth}</strong>
                    <span>{t('Ngày in')}: {new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                </div>

                {/* Title */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', paddingBottom: '1rem' }}>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: 0, textTransform: 'uppercase', color: 'var(--color-text)' }}>
                    {getTitleLabel(selectedMonth)}
                  </h2>
                  <p style={{ fontSize: '0.9rem', color: 'var(--color-text-muted)', marginTop: 6, fontWeight: 600 }}>
                    {t('Kỳ thanh toán')}: {getPeriodLabel(selectedMonth)}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', textAlign: 'left', fontSize: '0.875rem', border: '1px solid var(--color-border-light)', borderRadius: '10px', padding: '1rem', background: 'var(--color-bg-secondary)' }}>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('Nhân viên')}:</span> <strong>{payslip.employee_name}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('Chức vụ')}:</span> <strong>{payslip.job_title || 'Tư vấn viên'}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('Số ngày công làm việc')}:</span> <strong>{payslip.work_days_actual} / {payslip.work_days_required}</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-muted)' }}>{t('Đi muộn')}:</span> <strong style={{ color: payslip.lateness_minutes > 0 ? '#ef4444' : 'inherit' }}>{payslip.lateness_minutes} {t('phút')}</strong>
                    </div>
                  </div>
                </div>

                {/* Salary Breakdown Table */}
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1.5rem', fontSize: '0.875rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text)', background: 'var(--color-bg-secondary)', fontWeight: 700 }}>
                      <th style={{ padding: '10px 12px', textAlign: 'left' }}>{t('Khoản mục')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>{t('Thông số')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t('Cộng (Thu nhập)')}</th>
                      <th style={{ padding: '10px 12px', textAlign: 'right' }}>{t('Trừ (Khấu trừ)')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Basic calculated */}
                    <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                      <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương thực tế theo ngày công')}</td>
                      <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{payslip.work_days_actual} / {payslip.work_days_required} {t('ngày công')}</td>
                      <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.salary_basic_calculated)}</td>
                      <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                    </tr>

                    {/* KPI Bonus */}
                    {Number(payslip.kpi_bonus || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương thưởng doanh số KPI')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.kpi_bonus)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                      </tr>
                    )}

                    {/* Overtime Salary */}
                    {Number(payslip.overtime_salary || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Lương tăng ca')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{payslip.overtime_days || 0} {t('ngày')} (x1.5)</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.overtime_salary)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                      </tr>
                    )}

                    {/* Diligence Bonus */}
                    {Number(payslip.diligence_bonus || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Thưởng chuyên cần')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600, color: '#10b981' }}>{formatCurrency(payslip.diligence_bonus)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                      </tr>
                    )}

                    {/* Allowance */}
                    {Number(payslip.allowance_total || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Phụ cấp (Ăn trưa, Xăng xe, Điện thoại)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', fontWeight: 600 }}>{formatCurrency(payslip.allowance_total)}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                      </tr>
                    )}

                    {/* Insurance Deduction */}
                    {(Number(payslip.insurance_bhxh || 0) + Number(payslip.insurance_bhyt || 0) + Number(payslip.insurance_bhtn || 0)) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ Bảo hiểm (BHXH, BHYT, BHTN)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{payslip.has_insurance === 1 ? t('Có tham gia') : t('Không')}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(Number(payslip.insurance_bhxh || 0) + Number(payslip.insurance_bhyt || 0) + Number(payslip.insurance_bhtn || 0))}</td>
                      </tr>
                    )}

                    {/* Lateness Penalty */}
                    {Number(payslip.lateness_penalty || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ đi trễ')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>{payslip.lateness_minutes} {t('phút')}</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.lateness_penalty)}</td>
                      </tr>
                    )}

                    {/* Tax PIT */}
                    {Number(payslip.tax_pit || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Thuế Thu nhập Cá nhân (PIT)')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.tax_pit)}</td>
                      </tr>
                    )}

                    {/* Advance Deduction */}
                    {Number(payslip.advance_deduction || 0) > 0 && (
                      <tr style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                        <td style={{ padding: '12px', fontWeight: 600 }}>{t('Khấu trừ tạm ứng')}</td>
                        <td style={{ padding: '12px', textAlign: 'center', color: 'var(--color-text-muted)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: 'var(--color-text-light)' }}>—</td>
                        <td style={{ padding: '12px', textAlign: 'right', color: '#ef4444', fontWeight: 600 }}>-{formatCurrency(payslip.advance_deduction)}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {/* Total Footer */}
                <div style={{
                  marginTop: '1.5rem',
                  borderTop: '2px double var(--color-border)',
                  paddingTop: '1.25rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong style={{ fontSize: '1rem', textTransform: 'uppercase' }}>{t('THỰC LĨNH CHUYỂN KHOẢN (NET PAY)')}</strong>
                  <strong style={{ fontSize: '1.5rem', color: 'var(--color-primary)' }}>{formatCurrency(payslip.net_salary)}</strong>
                </div>

                {/* Signature View (If confirmed) */}
                {payslip.status === 'confirmed' && payslip.signature_url && (
                  <div style={{ marginTop: '2.5rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontStyle: 'italic', marginBottom: 4 }}>
                      {t('Đã xác nhận & ký nhận online')}
                    </span>
                    <img 
                      src={payslip.signature_url} 
                      alt="Signature" 
                      style={{ width: '150px', height: '60px', objectFit: 'contain', borderBottom: '1px solid var(--color-text-muted)' }} 
                    />
                    <strong style={{ fontSize: '0.85rem', marginTop: 4 }}>{payslip.employee_name}</strong>
                  </div>
                )}
              </div>

              {/* Signature Signing Pad (If status is sent) */}
              {payslip.status === 'sent' && (
                <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '1rem' }}>
                    <PenTool size={16} style={{ color: 'var(--color-primary)' }} />
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{t('Ký nhận Phiếu Lương trực tuyến')}</h4>
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', marginBottom: '1rem' }}>
                    {t('Vui lòng vẽ chữ ký của bạn vào khung bên dưới để đồng ý với các chi tiết bảng lương.')}
                  </p>

                  <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, background: 'var(--color-bg-secondary)', overflow: 'hidden', position: 'relative', height: 160 }}>
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={160}
                      style={{ width: '100%', height: '100%', cursor: 'crosshair' }}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: '1rem' }}>
                    <button onClick={clearCanvas} className="btn secondary" style={{ padding: '6px 14px', fontSize: '0.825rem' }}>
                      {t('Vẽ lại')}
                    </button>
                    <button 
                      onClick={handleConfirmPayslip} 
                      disabled={submitting}
                      className="btn primary" 
                      style={{ padding: '6px 20px', fontSize: '0.825rem', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <CheckCircle size={14} />
                      {submitting ? t('Đang ký...') : t('Ký xác nhận lương')}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      
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

// Side-Drawer Component detailing step-by-step progress
function ApprovalDetailDrawer({ item, onClose, users, t, onApprove, onReject, isAdmin }: {
  item: any;
  onClose: () => void;
  users: any[];
  t: any;
  onApprove: (item: any) => Promise<void>;
  onReject: (item: any) => void;
  isAdmin: boolean;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDetail = async () => {
      setLoading(true);
      try {
        if (item.type === 'leave') {
          const res = await fetchAPI('hrm/leaves');
          const found = res?.data?.find((l: any) => l.id === item.id);
          if (active) setDetail(found);
        } else if (item.type === 'advance') {
          const res = await fetchAPI('hrm/advances');
          const found = res?.data?.find((a: any) => a.id === item.id);
          if (active) setDetail(found);
        } else if (item.type === 'expense') {
          const res = await api.get('/expenses');
          const found = res?.data?.data?.find((e: any) => e.id === item.id);
          if (active) setDetail(found);
        } else if (item.type === 'checkin') {
          const res = await api.get('/check_ins');
          const found = res?.data?.data?.find((c: any) => c.id === item.id);
          if (active) setDetail(found);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchDetail();
    return () => { active = false; };
  }, [item]);

  const getEmployeeName = () => {
    if (detail?.employee_name) return detail.employee_name;
    if (item.employee_name) return item.employee_name;
    return t('Nhân viên');
  };

  const getEmployeeAvatar = () => {
    const emp = users.find(u => String(u.full_name) === String(getEmployeeName()) || String(u.id) === String(detail?.user_id || detail?.created_by));
    return emp?.avatar_url || emp?.avatar;
  };

  const renderTimeline = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner sm" style={{ margin: '0 auto 10px auto' }}></div>
          {t('Đang tải tiến trình...')}
        </div>
      );
    }

    const steps = [];

    // Step 1: Proposal Submission
    steps.push({
      title: item.type === 'leave' ? t('Lập đề nghị nghỉ phép') : item.type === 'advance' ? t('Lập đề xuất tạm ứng') : item.type === 'expense' ? t('Lập đề xuất chi phí') : t('Gửi giải trình chấm công'),
      user: {
        name: getEmployeeName(),
        avatar: getEmployeeAvatar()
      },
      status: 'approved',
      time: detail?.created_at || item.created_at,
      notes: detail?.reason || detail?.notes || detail?.description
    });

    // Multi-level Leaves & Salary Advances
    if (item.type === 'leave' || item.type === 'advance') {
      const approver1Id = detail?.approver_id;
      if (approver1Id) {
        const app1 = users.find(u => String(u.id) === String(approver1Id));
        const app1Status = detail?.status_level_1 || 'pending';
        steps.push({
          title: t('Trưởng phòng phê duyệt'),
          user: {
            name: app1?.full_name || t('Trưởng phòng'),
            avatar: app1?.avatar_url || app1?.avatar
          },
          status: app1Status,
          time: app1Status !== 'pending' ? detail?.updated_at : null,
          notes: app1Status === 'rejected' ? detail?.reason : null
        });
      }

      const approver2Id = detail?.approver_id_2;
      if (approver2Id) {
        const app2 = users.find(u => String(u.id) === String(approver2Id));
        const app2Status = detail?.status_level_2 || 'pending';
        steps.push({
          title: t('Kế toán toán tổng hợp kiểm tra'),
          user: {
            name: app2?.full_name || t('Kế toán'),
            avatar: app2?.avatar_url || app2?.avatar
          },
          status: app2Status,
          time: app2Status !== 'pending' ? detail?.updated_at : null,
          notes: app2Status === 'rejected' ? detail?.reject_reason || detail?.reason : null
        });
      }
    } else if (item.type === 'expense') {
      const approverId = detail?.approver_id;
      const app = users.find(u => String(u.id) === String(approverId || '1003'));
      const appStatus = detail?.status || 'pending';
      steps.push({
        title: t('Phê duyệt đề xuất chi phí'),
        user: {
          name: app?.full_name || t('Người phê duyệt'),
          avatar: app?.avatar_url || app?.avatar
        },
        status: appStatus,
        time: appStatus !== 'pending' ? detail?.approved_at : null,
        notes: appStatus === 'rejected' ? detail?.reject_reason : null
      });
    } else if (item.type === 'checkin') {
      const appStatus = detail?.status === 'approved' ? 'approved' : (detail?.status === 'rejected' ? 'rejected' : 'pending');
      steps.push({
        title: t('Phê duyệt giải trình chấm công'),
        user: {
          name: t('Admin hệ thống'),
          initial: 'AD'
        },
        status: appStatus,
        time: appStatus !== 'pending' ? detail?.updated_at : null,
        notes: appStatus === 'rejected' ? detail?.reason : null
      });
    }

    return (
      <div style={{ position: 'relative', paddingLeft: '2.5rem', marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        {/* Gray connecting line background */}
        <div style={{
          position: 'absolute',
          left: '9px',
          top: '16px',
          bottom: '16px',
          width: '2px',
          background: 'var(--color-border-light)'
        }} />
        
        {/* Green connecting line foreground for completed steps */}
        <div style={{
          position: 'absolute',
          left: '9px',
          top: '16px',
          height: `${Math.max(0, (steps.filter(s => s.status === 'approved').length - 1)) * 100 / Math.max(1, steps.length - 1)}%`,
          width: '2px',
          background: '#10b981',
          transition: 'height 0.3s ease'
        }} />

        {steps.map((step, idx) => {
          const isDone = step.status === 'approved' || step.status === 'confirmed';
          const isRejected = step.status === 'rejected' || step.status === 'failed';
          const isPending = step.status === 'pending';
          
          const borderStyle = isPending ? '1px solid #3b82f6' : (isRejected ? '1px solid #ef4444' : '1px solid var(--color-border-light)');
          
          return (
            <div key={idx} style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              {/* Timeline circle dot */}
              <div style={{
                position: 'absolute',
                left: '-2.5rem',
                top: '12px',
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 10,
                background: isDone ? '#10b981' : (isRejected ? '#ef4444' : 'var(--color-surface)'),
                border: isDone || isRejected ? 'none' : '2px solid var(--color-border)',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 'bold',
                boxShadow: '0 0 0 4px var(--color-surface)'
              }}>
                {isDone && '✓'}
                {isRejected && '✗'}
              </div>

              {/* Speech bubble card body */}
              <div style={{
                background: 'var(--color-surface)',
                border: borderStyle,
                borderRadius: '12px',
                padding: '1.25rem',
                boxShadow: isPending ? '0 4px 12px rgba(59, 130, 246, 0.08)' : '0 1px 3px rgba(0,0,0,0.02)',
                position: 'relative',
                transition: 'all 0.2s',
                textAlign: 'left'
              }}>
                {/* Speech bubble triangle pointer */}
                <div style={{
                  position: 'absolute',
                  left: '-8px',
                  top: '16px',
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: `8px solid ${isPending ? '#3b82f6' : (isRejected ? '#ef4444' : 'var(--color-border-light)')}`,
                  zIndex: 1
                }} />
                <div style={{
                  position: 'absolute',
                  left: '-7px',
                  top: '16px',
                  width: 0,
                  height: 0,
                  borderTop: '6px solid transparent',
                  borderBottom: '6px solid transparent',
                  borderRight: '8px solid var(--color-surface)',
                  zIndex: 2
                }} />

                {/* Card details */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 8 }}>
                      <h4 style={{ fontSize: '0.925rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                        {step.title}
                      </h4>
                      {/* Optional comment bubble icon for logs containing reason / notes */}
                      {step.notes && (
                        <div title={step.notes} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '50%', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)', cursor: 'help' }}>
                          <span style={{ fontSize: '11px' }}>💬</span>
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Avatar src={step.user.avatar} name={step.user.name} size={24} />
                      <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)' }}>
                        {step.user.name}
                      </span>
                    </div>
                    
                    {step.time && (
                      <div style={{ fontSize: '0.78rem', color: isRejected ? '#ef4444' : '#10b981', fontWeight: 600, marginTop: '8px' }}>
                        {new Date(step.time).toLocaleString('vi-VN')}
                      </div>
                    )}

                    {!step.time && isPending && (
                      <div style={{ fontSize: '0.78rem', color: '#6b7280', fontStyle: 'italic', marginTop: '8px' }}>
                        {t('Đang chờ phê duyệt...')}
                      </div>
                    )}

                    {step.notes && (
                      <div style={{
                        marginTop: '8px',
                        padding: '6px 10px',
                        background: isRejected ? 'rgba(239, 68, 68, 0.05)' : 'var(--color-bg-secondary)',
                        borderLeft: `3px solid ${isRejected ? '#ef4444' : 'var(--color-primary)'}`,
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        color: 'var(--color-text-muted)',
                        fontStyle: 'italic'
                      }}>
                        "{step.notes}"
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(15, 23, 42, 0.4)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'flex-end',
      zIndex: 1000000,
      animation: 'fadeIn 0.2s ease-out'
    }} onClick={onClose}>
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
      
      <div style={{
        width: '480px',
        maxWidth: '100%',
        height: '100vh',
        background: 'var(--color-surface)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>
            {t('Chi tiết tiến trình')}
          </h3>
          <button className="btn-icon-bare" onClick={onClose} style={{ fontSize: '1.5rem', lineHeight: 1 }}>×</button>
        </div>

        {/* Drawer Body */}
        <div className="custom-scrollbar" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem 1.5rem 3rem 1.5rem'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.85rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.5px' }}>
            {t('CÁC BƯỚC THỰC HIỆN')}
          </h3>
          
          {renderTimeline()}
        </div>

        {/* Drawer Footer Actions (Pending only) */}
        {isAdmin && (
          <div style={{
            padding: '1.5rem',
            borderTop: '1px solid var(--color-border-light)',
            display: 'flex',
            gap: '1rem',
            background: 'var(--color-bg-secondary)'
          }}>
            <button
              className="btn secondary"
              style={{ flex: 1, color: '#ef4444', borderColor: '#ef4444' }}
              onClick={() => onReject(item)}
            >
              <XCircle size={14} style={{ marginRight: 4 }} />
              {t('Từ chối')}
            </button>
            <button
              className="btn primary"
              style={{ flex: 1 }}
              onClick={async () => {
                await onApprove(item);
                onClose();
              }}
            >
              <CheckCircle2 size={14} style={{ marginRight: 4 }} />
              {t('Phê duyệt')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
