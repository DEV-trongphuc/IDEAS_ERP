import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import api from '../api/axios';
import { 
  FileText, Calendar, CheckCircle, ShieldCheck, PenTool,
  Clock, DollarSign, Award, Percent, HelpCircle, Plus, Send,
  ChevronLeft, ChevronRight, XCircle, CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { CustomSelect } from '../components/ui/CustomSelect';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';

export default function MyPayslips() {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'payslip' | 'leaves' | 'advances'>('payslip');
  
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
        
        {activeSubTab === 'payslip' && (
          <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)', padding: '2px', height: 40, boxShadow: 'var(--shadow-sm)' }}>
            <button 
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const prevDate = new Date(y, m - 2, 1);
                setSelectedMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: 'var(--color-text-light)', borderRadius: 6 }}
              className="hover-bg-secondary"
            >
              <ChevronLeft size={18} />
            </button>
            <span style={{ padding: '0 16px', fontWeight: 700, fontSize: '0.9rem', minWidth: '120px', textAlign: 'center', color: 'var(--color-text)' }}>
              {(() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                return `Tháng ${String(m).padStart(2, '0')}/${y}`;
              })()}
            </span>
            <button 
              type="button"
              onClick={() => {
                const [y, m] = selectedMonth.split('-').map(Number);
                const nextDate = new Date(y, m, 1);
                setSelectedMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
              }}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, color: 'var(--color-text-light)', borderRadius: 6 }}
              className="hover-bg-secondary"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '0.375rem', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
        <button
          onClick={() => setActiveSubTab('payslip')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeSubTab === 'payslip' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'payslip' ? 'var(--color-text)' : 'var(--color-text-light)',
            boxShadow: activeSubTab === 'payslip' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {t('Phiếu lương cá nhân')}
        </button>
        <button
          onClick={() => setActiveSubTab('leaves')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeSubTab === 'leaves' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'leaves' ? 'var(--color-text)' : 'var(--color-text-light)',
            boxShadow: activeSubTab === 'leaves' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {t('Đăng ký Nghỉ phép')}
        </button>
        <button
          onClick={() => setActiveSubTab('advances')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeSubTab === 'advances' ? 'var(--color-surface)' : 'transparent',
            color: activeSubTab === 'advances' ? 'var(--color-text)' : 'var(--color-text-light)',
            boxShadow: activeSubTab === 'advances' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          {t('Đề xuất Tạm ứng')}
        </button>
      </div>

      {/* TAB 1: PAYSLIP */}
      {activeSubTab === 'payslip' && (
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
              <div className="card" style={{
                padding: '2.5rem',
                background: 'var(--color-surface)',
                border: '1px solid var(--color-border)',
                borderRadius: '16px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.04)',
                position: 'relative'
              }}>
                {/* Header info */}
                <div style={{ textAlign: 'center', marginBottom: '2rem', borderBottom: '1px dashed var(--color-border)', paddingBottom: '1.5rem' }}>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{t('BẢNG THANH TOÁN TIỀN LƯƠNG')}</h2>
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                    {t('Kỳ thanh toán')}: {selectedMonth}
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem', textAlign: 'left', fontSize: '0.875rem' }}>
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

                {/* Salary Breakdown Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem', fontSize: '0.9rem' }}>
                  
                  {/* Gross and Basic calculation */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <DollarSign size={15} style={{ color: 'var(--color-text-muted)' }} />
                      {t('Lương thực tế theo ngày công')}
                    </span>
                    <span>{formatCurrency(payslip.salary_basic_calculated)}</span>
                  </div>

                  {/* KPI Thưởng */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Award size={15} style={{ color: '#10b981' }} />
                      {t('Lương thưởng doanh số KPI')}
                    </span>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>{formatCurrency(payslip.kpi_bonus)}</span>
                  </div>

                  {/* Allowances */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Percent size={15} style={{ color: 'var(--color-text-muted)' }} />
                      {t('Các khoản phụ cấp (Ăn trưa, Xăng xe, Điện thoại)')}
                    </span>
                    <span>{formatCurrency(payslip.allowance_total)}</span>
                  </div>

                  <div style={{ height: '1px', background: 'var(--color-border)', margin: '4px 0' }} />

                  {/* Deductions: Insurance */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <HelpCircle size={15} />
                      {t('Khấu trừ Bảo hiểm (BHXH, BHYT, BHTN)')}
                    </span>
                    <span>-{formatCurrency(Number(payslip.insurance_bhxh || 0) + Number(payslip.insurance_bhyt || 0) + Number(payslip.insurance_bhtn || 0))}</span>
                  </div>

                  {/* Deductions: Lateness */}
                  {payslip.lateness_penalty > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                      <span>{t('Phạt đi trễ (Chưa nộp phép/chưa duyệt)')}</span>
                      <span>-{formatCurrency(payslip.lateness_penalty)}</span>
                    </div>
                  )}

                  {/* Deductions: PIT Tax */}
                  {payslip.tax_pit > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                      <span>{t('Khấu trừ Thuế Thu nhập Cá nhân (PIT)')}</span>
                      <span>-{formatCurrency(payslip.tax_pit)}</span>
                    </div>
                  )}

                  {/* Deductions: Advances */}
                  {payslip.advance_deduction > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#ef4444' }}>
                      <span>{t('Khấu trừ tạm ứng lương')}</span>
                      <span>-{formatCurrency(payslip.advance_deduction)}</span>
                    </div>
                  )}

                  {/* Total footer */}
                  <div style={{
                    marginTop: '1.5rem',
                    borderTop: '2px double var(--color-border)',
                    paddingTop: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <strong style={{ fontSize: '1.1rem' }}>{t('THỰC LĨNH CHUYỂN KHOẢN (NET PAY)')}</strong>
                    <strong style={{ fontSize: '1.4rem', color: 'var(--color-primary)' }}>{formatCurrency(payslip.net_salary)}</strong>
                  </div>
                </div>

                {/* Signature View (If confirmed) */}
                {payslip.status === 'confirmed' && payslip.signature_url && (
                  <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
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

      {/* TAB 2: LEAVES */}
      {activeSubTab === 'leaves' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
          {/* Left: Request Form */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Plus size={16} style={{ color: 'var(--color-primary)' }} />
              {t('Đăng ký nghỉ phép')}
            </h3>
            <form onSubmit={handleRequestLeave} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Loại nghỉ phép')}</label>
                <CustomSelect
                  options={[
                    { value: 'annual', label: t('Phép năm (Có hưởng lương)') },
                    { value: 'sick', label: t('Nghỉ ốm (Có hưởng lương)') },
                    { value: 'compensatory', label: t('Nghỉ bù (Có hưởng lương)') },
                    { value: 'unpaid', label: t('Nghỉ không lương') },
                    { value: 'late_early', label: t('Xin Đi trễ / Về sớm') }
                  ]}
                  value={leaveType}
                  onChange={val => setLeaveType(val)}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người duyệt cấp 1 (Quản lý) *')}</label>
                <CustomSelect
                  options={userOptions}
                  value={leaveApproverId}
                  onChange={val => setLeaveApproverId(val)}
                  searchable={true}
                  showAvatars={true}
                  placeholder={t('Chọn người duyệt cấp 1...')}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người duyệt cấp 2 (Ban Giám đốc) (Không bắt buộc)')}</label>
                <CustomSelect
                  options={approver2Options}
                  value={leaveApproverId2}
                  onChange={val => setLeaveApproverId2(val)}
                  searchable={true}
                  showAvatars={true}
                  placeholder={t('Chọn người duyệt cấp 2...')}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người liên quan (CC)')}</label>
                <CustomSelect
                  options={userOptions}
                  value={leaveRelatedUserIds}
                  onChange={val => setLeaveRelatedUserIds(val)}
                  searchable={true}
                  showAvatars={true}
                  multiple={true}
                  placeholder={t('Chọn người liên quan...')}
                  size="sm"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Từ ngày')}</label>
                  <input type="datetime-local" className="form-input" value={leaveStart} onChange={e => setLeaveStart(e.target.value)} />
                </div>
                <div>
                  <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Đến ngày')}</label>
                  <input type="datetime-local" className="form-input" value={leaveEnd} onChange={e => setLeaveEnd(e.target.value)} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Số ngày quy đổi')}</label>
                <input type="number" step="0.5" className="form-input" value={leaveTotalDays} onChange={e => setLeaveTotalDays(Math.max(0.5, Number(e.target.value)))} />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Lý do chi tiết')}</label>
                <textarea className="form-input" style={{ height: 80, resize: 'none' }} value={leaveReason} onChange={e => setLeaveReason(e.target.value)} placeholder={t('Điền lý do cụ thể...')} />
              </div>

              <button type="submit" disabled={submittingLeave} className="btn primary" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={14} />
                {submittingLeave ? t('Đang gửi...') : t('Gửi yêu cầu nghỉ phép')}
              </button>
            </form>
          </div>

          {/* Right: History List */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t('Lịch sử nghỉ phép')}</h3>
            {leavesList.length === 0 ? (
              <EmptyCard
                icon={<Calendar />}
                title={t('Chưa có đơn nghỉ phép')}
                description={t('Bạn chưa có đơn đăng ký nghỉ phép nào.')}
              />
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {leavesList.map(req => (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedTimelineItem({ ...req, type: 'leave' })}
                    className="hover-lift"
                    style={{ 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 12, 
                      padding: '1rem', 
                      background: 'var(--color-surface)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: '0.725rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 6px', borderRadius: 6, fontWeight: 700 }}>
                          {req.leave_type === 'annual' ? t('Phép năm') : req.leave_type === 'sick' ? t('Nghỉ ốm') : req.leave_type === 'compensatory' ? t('Nghỉ bù') : req.leave_type === 'late_early' ? t('Đi trễ/Về sớm') : t('Không lương')}
                        </span>
                        <strong style={{ fontSize: '0.85rem' }}>{req.total_days} {t('ngày')}</strong>
                      </div>
                      <p style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {t('Từ')}: {new Date(req.start_date).toLocaleString('vi-VN')} {t('đến')} {new Date(req.end_date).toLocaleString('vi-VN')}
                      </p>
                      <p style={{ fontSize: '0.825rem', marginTop: 6, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>"{req.reason || t('Không có lý do')}"</span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}>{t('Xem tiến trình')}</span>
                      </p>
                    </div>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 10,
                        textTransform: 'uppercase',
                        background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : req.status === 'level1_approved' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: req.status === 'approved' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : req.status === 'level1_approved' ? '#3b82f6' : '#6b7280'
                      }}>
                        {req.status === 'approved' ? t('Đã duyệt') : req.status === 'rejected' ? t('Từ chối') : req.status === 'level1_approved' ? t('Đã duyệt Cấp 1') : t('Chờ duyệt')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: ADVANCES */}
      {activeSubTab === 'advances' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '2rem' }}>
          {/* Left: Advance Form */}
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 16, border: '1px solid var(--color-border)', height: 'fit-content' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: 6 }}>
              <DollarSign size={16} style={{ color: 'var(--color-primary)' }} />
              {t('Đề xuất tạm ứng lương')}
            </h3>
            <form onSubmit={handleRequestAdvance} style={{ display: 'grid', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Số tiền đề xuất (VND)')}</label>
                <input type="number" className="form-input" value={advanceAmount} onChange={e => setAdvanceAmount(Number(e.target.value))} placeholder={t('Ví dụ: 1000000')} />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người duyệt cấp 1 (Quản lý) *')}</label>
                <CustomSelect
                  options={userOptions}
                  value={advanceApproverId}
                  onChange={val => setAdvanceApproverId(val)}
                  searchable={true}
                  showAvatars={true}
                  placeholder={t('Chọn người duyệt cấp 1...')}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người duyệt cấp 2 (Ban Giám đốc) (Không bắt buộc)')}</label>
                <CustomSelect
                  options={approver2Options}
                  value={advanceApproverId2}
                  onChange={val => setAdvanceApproverId2(val)}
                  searchable={true}
                  showAvatars={true}
                  placeholder={t('Chọn người duyệt cấp 2...')}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Người liên quan (CC)')}</label>
                <CustomSelect
                  options={userOptions}
                  value={advanceRelatedUserIds}
                  onChange={val => setAdvanceRelatedUserIds(val)}
                  searchable={true}
                  showAvatars={true}
                  multiple={true}
                  placeholder={t('Chọn người liên quan...')}
                  size="sm"
                />
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '0.78rem' }}>{t('Lý do tạm ứng')}</label>
                <textarea className="form-input" style={{ height: 80, resize: 'none' }} value={advanceReason} onChange={e => setAdvanceReason(e.target.value)} placeholder={t('Điền lý do cụ thể...')} />
              </div>

              <button type="submit" disabled={submittingAdvance} className="btn primary" style={{ width: '100%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                <Send size={14} />
                {submittingAdvance ? t('Đang gửi...') : t('Gửi yêu cầu tạm ứng')}
              </button>
            </form>
          </div>

          {/* Right: Advances List */}
          <div>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '1.25rem' }}>{t('Lịch sử tạm ứng')}</h3>
            {advancesList.length === 0 ? (
              <EmptyCard
                icon={<DollarSign />}
                title={t('Chưa có đề xuất tạm ứng')}
                description={t('Bạn chưa có đề xuất tạm ứng lương nào.')}
              />
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {advancesList.map(adv => (
                  <div 
                    key={adv.id} 
                    onClick={() => setSelectedTimelineItem({ ...adv, type: 'advance' })}
                    className="hover-lift"
                    style={{ 
                      border: '1px solid var(--color-border)', 
                      borderRadius: 12, 
                      padding: '1rem', 
                      background: 'var(--color-surface)', 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>{formatCurrency(adv.amount)}</strong>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                          ({t('Ngày đề xuất')}: {new Date(adv.request_date).toLocaleDateString('vi-VN')})
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', marginTop: 6, fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span>"{adv.reason || t('Tạm ứng sinh hoạt')}"</span>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}>{t('Xem tiến trình')}</span>
                      </p>
                      {adv.deducted_payslip_id && (
                        <p style={{ fontSize: '0.725rem', color: '#10b981', marginTop: 4, fontWeight: 600 }}>
                          ✓ {t('Đã khấu trừ vào phiếu lương')}
                        </p>
                      )}
                    </div>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 10,
                        textTransform: 'uppercase',
                        background: adv.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : adv.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : adv.status === 'level1_approved' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: adv.status === 'approved' ? '#10b981' : adv.status === 'rejected' ? '#ef4444' : adv.status === 'level1_approved' ? '#3b82f6' : '#6b7280'
                      }}>
                        {adv.status === 'approved' ? t('Đã duyệt chi') : adv.status === 'rejected' ? t('Từ chối') : adv.status === 'level1_approved' ? t('Đã duyệt Cấp 1') : t('Chờ duyệt')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
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
