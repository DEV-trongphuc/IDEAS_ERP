import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import { 
  FileText, Calendar, CheckCircle, ShieldCheck, PenTool,
  Clock, DollarSign, Award, Percent, HelpCircle, Plus, Send
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

export default function MyPayslips() {
  const { t } = useLanguage();
  const [activeSubTab, setActiveSubTab] = useState<'payslip' | 'leaves' | 'advances'>('payslip');
  
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
          reason: leaveReason
        })
      });
      toast.success(t('Gửi đơn xin nghỉ phép thành công!'));
      setLeaveReason('');
      setLeaveTotalDays(1.0);
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
    setSubmittingAdvance(true);
    try {
      await fetchAPI('hrm/advances', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: advanceAmount,
          reason: advanceReason
        })
      });
      toast.success(t('Gửi đề xuất tạm ứng lương thành công!'));
      setAdvanceAmount(0);
      setAdvanceReason('');
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
    <div style={{ padding: '2rem 3rem', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
      
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
            {t('Cổng Nhân sự Cá nhân (My HR)')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('Tra cứu phiếu lương, đăng ký lịch nghỉ phép và tạm ứng thu nhập nhanh chóng.')}
          </p>
        </div>
        
        {activeSubTab === 'payslip' && (
          <div>
            <input
              type="month"
              className="form-input"
              style={{ height: 40 }}
              value={selectedMonth}
              onChange={e => setSelectedMonth(e.target.value)}
            />
          </div>
        )}
      </div>

      {/* Sub Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        <button
          onClick={() => setActiveSubTab('payslip')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'payslip' ? 'var(--color-primary-light)' : 'transparent',
            color: activeSubTab === 'payslip' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          {t('Phiếu lương cá nhân')}
        </button>
        <button
          onClick={() => setActiveSubTab('leaves')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'leaves' ? 'var(--color-primary-light)' : 'transparent',
            color: activeSubTab === 'leaves' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          {t('Đăng ký Nghỉ phép')}
        </button>
        <button
          onClick={() => setActiveSubTab('advances')}
          style={{
            padding: '8px 16px',
            borderRadius: '6px',
            border: 'none',
            background: activeSubTab === 'advances' ? 'var(--color-primary-light)' : 'transparent',
            color: activeSubTab === 'advances' ? 'var(--color-primary)' : 'var(--color-text-muted)',
            fontWeight: 600,
            fontSize: '0.85rem',
            cursor: 'pointer'
          }}
        >
          {t('Đề xuất Tạm ứng')}
        </button>
      </div>

      {/* TAB 1: PAYSLIP */}
      {activeSubTab === 'payslip' && (
        <div>
          {!payslip ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
              <FileText size={48} style={{ margin: '0 auto 1rem', opacity: 0.5 }} />
              {t('Chưa có phiếu lương được phát hành cho tháng này.')}
            </div>
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
                <select className="form-input" value={leaveType} onChange={e => setLeaveType(e.target.value)}>
                  <option value="annual">{t('Phép năm (Có hưởng lương)')}</option>
                  <option value="sick">{t('Nghỉ ốm (Có hưởng lương)')}</option>
                  <option value="compensatory">{t('Nghỉ bù (Có hưởng lương)')}</option>
                  <option value="unpaid">{t('Nghỉ không lương')}</option>
                  <option value="late_early">{t('Xin Đi trễ / Về sớm')}</option>
                </select>
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
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {t('Bạn chưa có đơn đăng ký nghỉ phép nào.')}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {leavesList.map(req => (
                  <div key={req.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem', background: 'var(--color-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
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
                      <p style={{ fontSize: '0.825rem', marginTop: 6, fontStyle: 'italic' }}>
                        "{req.reason || t('Không có lý do')}"
                      </p>
                    </div>
                    <div>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '3px 8px', 
                        borderRadius: 10,
                        textTransform: 'uppercase',
                        background: req.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: req.status === 'approved' ? '#10b981' : req.status === 'rejected' ? '#ef4444' : '#6b7280'
                      }}>
                        {req.status === 'approved' ? t('Đã duyệt') : req.status === 'rejected' ? t('Từ chối') : t('Chờ duyệt')}
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
              <div className="card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {t('Bạn chưa có đề xuất tạm ứng lương nào.')}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '0.75rem' }}>
                {advancesList.map(adv => (
                  <div key={adv.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1rem', background: 'var(--color-surface)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '0.95rem', color: 'var(--color-primary)' }}>{formatCurrency(adv.amount)}</strong>
                        <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                          ({t('Ngày đề xuất')}: {new Date(adv.request_date).toLocaleDateString('vi-VN')})
                        </span>
                      </div>
                      <p style={{ fontSize: '0.825rem', marginTop: 6, fontStyle: 'italic' }}>
                        "{adv.reason || t('Tạm ứng sinh hoạt')}"
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
                        background: adv.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : adv.status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                        color: adv.status === 'approved' ? '#10b981' : adv.status === 'rejected' ? '#ef4444' : '#6b7280'
                      }}>
                        {adv.status === 'approved' ? t('Đã duyệt chi') : adv.status === 'rejected' ? t('Từ chối') : t('Chờ duyệt')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
