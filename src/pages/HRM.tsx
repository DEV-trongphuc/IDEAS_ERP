import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import { 
  Users, Calendar, CreditCard, DollarSign, Check, X, ShieldAlert,
  Send, Lock, Award, FileText, ChevronRight, Play, CheckCircle
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';

export default function HRM() {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'profiles' | 'leaves' | 'advances' | 'payroll'>('profiles');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);
  
  // Payroll inputs
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  const [workDaysRequired, setWorkDaysRequired] = useState(26);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [locking, setLocking] = useState(false);

  // Edit Profile modal/drawer state
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [joinedDate, setJoinedDate] = useState('');
  const [baseSalary, setBaseSalary] = useState(0);
  const [dealSalary, setDealSalary] = useState(0);
  const [hasInsurance, setHasInsurance] = useState(true);
  const [allowanceMeal, setAllowanceMeal] = useState(0);
  const [allowanceTravel, setAllowanceTravel] = useState(0);
  const [allowancePhone, setAllowancePhone] = useState(0);
  const [kpiTarget, setKpiTarget] = useState(0);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      if (activeTab === 'profiles') {
        const res = await fetchAPI('hrm/profiles');
        setProfiles(res?.data || []);
      } else if (activeTab === 'leaves') {
        const res = await fetchAPI('hrm/leaves');
        setLeaves(res?.data || []);
      } else if (activeTab === 'advances') {
        const res = await fetchAPI('hrm/advances');
        setAdvances(res?.data || []);
      } else if (activeTab === 'payroll') {
        loadPayslips();
      }
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi tải dữ liệu'));
    }
  };

  const loadPayslips = async () => {
    try {
      const res = await fetchAPI(`hrm/payroll?month_year=${payrollMonth}`);
      setPayslips(res?.data || []);
    } catch (err: any) {
      setPayslips([]);
    }
  };

  useEffect(() => {
    if (activeTab === 'payroll') {
      loadPayslips();
    }
  }, [payrollMonth]);

  const handleEditProfile = (user: any) => {
    setSelectedUser(user);
    setJoinedDate(user.joined_date || new Date().toISOString().substring(0, 10));
    setBaseSalary(Number(user.base_salary || 0));
    setDealSalary(Number(user.deal_salary || 0));
    setHasInsurance(user.has_insurance !== 0 && user.has_insurance !== '0');
    setAllowanceMeal(Number(user.allowance_meal || 0));
    setAllowanceTravel(Number(user.allowance_travel || 0));
    setAllowancePhone(Number(user.allowance_phone || 0));
    setKpiTarget(Number(user.kpi_target || 0));
  };

  const handleSaveProfile = async () => {
    if (!selectedUser) return;
    try {
      await fetchAPI('hrm/profiles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: selectedUser.id,
          joined_date: joinedDate,
          base_salary: baseSalary,
          deal_salary: dealSalary,
          has_insurance: hasInsurance ? 1 : 0,
          allowance_meal: allowanceMeal,
          allowance_travel: allowanceTravel,
          allowance_phone: allowancePhone,
          kpi_target: kpiTarget
        })
      });
      toast.success(t('Cập nhật hồ sơ nhân sự thành công!'));
      setSelectedUser(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khi lưu thông tin'));
    }
  };

  const handleApproveLeave = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await fetchAPI('hrm/leaves', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      toast.success(status === 'approved' ? t('Đã duyệt đơn nghỉ phép') : t('Đã từ chối đơn nghỉ phép'));
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi xử lý'));
    }
  };

  const handleApproveAdvance = async (id: number, status: 'approved' | 'rejected') => {
    try {
      await fetchAPI('hrm/advances', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      toast.success(status === 'approved' ? t('Đã duyệt tạm ứng lương') : t('Đã từ chối tạm ứng lương'));
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi xử lý'));
    }
  };

  const handleRunPayroll = async () => {
    setCalculating(true);
    try {
      await fetchAPI('hrm/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          month_year: payrollMonth,
          work_days_required: workDaysRequired
        })
      });
      toast.success(t('Tính lương hoàn tất!'));
      loadPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi tính lương'));
    } finally {
      setCalculating(false);
    }
  };

  const handlePublishPayroll = async () => {
    setPublishing(true);
    try {
      await fetchAPI('hrm/payroll/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_year: payrollMonth })
      });
      toast.success(t('Đã gửi phiếu lương yêu cầu xác thực đến toàn bộ nhân sự!'));
      loadPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi phát hành'));
    } finally {
      setPublishing(false);
    }
  };

  const handleLockPayroll = async () => {
    setLocking(true);
    try {
      await fetchAPI('hrm/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_year: payrollMonth })
      });
      toast.success(t('Đã chốt và khóa sổ lương thành công!'));
      loadPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khóa sổ'));
    } finally {
      setLocking(false);
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  return (
    <div style={{ padding: '2rem 3rem', width: '100%' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h1 className="page-title" style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800 }}>
            {t('Hệ thống Quản lý Nhân sự & Bảng Lương (HRMS)')}
          </h1>
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem', marginTop: 4 }}>
            {t('Tính toán công phép, khấu trừ bảo hiểm, tính thuế lũy tiến TNCN và xác thực lương online.')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
        {[
          { id: 'profiles', label: t('Hồ sơ lương nhân viên'), icon: Users },
          { id: 'leaves', label: t('Phê duyệt Nghỉ Phép'), icon: Calendar },
          { id: 'advances', label: t('Tạm ứng Lương'), icon: CreditCard },
          { id: 'payroll', label: t('Tính & Chốt Lương'), icon: DollarSign }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 16px',
                borderRadius: '8px',
                border: 'none',
                background: isActive ? 'var(--color-primary-light)' : 'transparent',
                color: isActive ? 'var(--color-primary)' : 'var(--color-text-muted)',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
        
        {/* TAB 1: PROFILES */}
        {activeTab === 'profiles' && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 8px' }}>{t('Họ và Tên')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Vai trò')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Ngày vào làm')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Lương Net thỏa thuận')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Lương BHXH')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Phụ cấp')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('KPI Target')}</th>
                    <th style={{ padding: '12px 8px', textAlign: 'center' }}>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(user => (
                    <tr key={user.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.875rem' }}>
                      <td style={{ padding: '14px 8px', fontWeight: 600 }}>{user.full_name}</td>
                      <td style={{ padding: '14px 8px' }}>{user.role}</td>
                      <td style={{ padding: '14px 8px' }}>{user.joined_date || <span style={{ color: '#ef4444' }}>{t('Chưa thiết lập')}</span>}</td>
                      <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>{user.deal_salary ? formatCurrency(user.deal_salary) : '0đ'}</td>
                      <td style={{ padding: '14px 8px' }}>{user.base_salary ? formatCurrency(user.base_salary) : '0đ'}</td>
                      <td style={{ padding: '14px 8px' }}>
                        {formatCurrency(Number(user.allowance_meal || 0) + Number(user.allowance_travel || 0) + Number(user.allowance_phone || 0))}
                      </td>
                      <td style={{ padding: '14px 8px' }}>{user.kpi_target ? formatCurrency(user.kpi_target) : '0đ'}</td>
                      <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                        <button
                          onClick={() => handleEditProfile(user)}
                          className="btn sm primary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                        >
                          {t('Thiết lập')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVES */}
        {activeTab === 'leaves' && (
          <div>
            {leaves.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {t('Không có đơn nghỉ phép nào.')}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {leaves.map(req => (
                  <div key={req.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1rem' }}>{req.employee_name}</strong>
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', padding: '2px 8px', borderRadius: 10, fontWeight: 700 }}>
                          {req.leave_type === 'annual' ? t('Phép năm') : req.leave_type === 'sick' ? t('Nghỉ ốm') : t('Không lương')}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {t('Từ ngày')}: {new Date(req.start_date).toLocaleDateString('vi-VN')} {t('đến')} {new Date(req.end_date).toLocaleDateString('vi-VN')} ({req.total_days} {t('ngày')})
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
                        <strong>{t('Lý do')}:</strong> {req.reason || t('Không có lý do chi tiết')}
                      </p>
                    </div>
                    <div>
                      {req.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleApproveLeave(req.id, 'approved')} className="btn sm primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981' }}>
                            <Check size={14} /> {t('Duyệt')}
                          </button>
                          <button onClick={() => handleApproveLeave(req.id, 'rejected')} className="btn sm secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white' }}>
                            <X size={14} /> {t('Từ chối')}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: req.status === 'approved' ? '#10b981' : '#ef4444' }}>
                          {req.status === 'approved' ? t('Đã duyệt') : t('Đã từ chối')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADVANCES */}
        {activeTab === 'advances' && (
          <div>
            {advances.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {t('Không có yêu cầu tạm ứng lương nào.')}
              </div>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {advances.map(adv => (
                  <div key={adv.id} style={{ border: '1px solid var(--color-border)', borderRadius: 12, padding: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg-secondary)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <strong style={{ fontSize: '1rem' }}>{adv.employee_name}</strong>
                        <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                          {formatCurrency(adv.amount)}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', marginTop: 4 }}>
                        {t('Ngày đề xuất')}: {new Date(adv.request_date).toLocaleDateString('vi-VN')}
                      </p>
                      <p style={{ fontSize: '0.875rem', marginTop: 8 }}>
                        <strong>{t('Lý do')}:</strong> {adv.reason || t('Tạm ứng sinh hoạt')}
                      </p>
                    </div>
                    <div>
                      {adv.status === 'pending' ? (
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => handleApproveAdvance(adv.id, 'approved')} className="btn sm primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#10b981' }}>
                            <Check size={14} /> {t('Duyệt chi')}
                          </button>
                          <button onClick={() => handleApproveAdvance(adv.id, 'rejected')} className="btn sm secondary" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#ef4444', color: 'white' }}>
                            <X size={14} /> {t('Từ chối')}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', color: adv.status === 'approved' ? '#10b981' : '#ef4444' }}>
                          {adv.status === 'approved' ? t('Đã duyệt chi') : t('Đã từ chối')}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PAYROLL CALCULATION */}
        {activeTab === 'payroll' && (
          <div>
            {/* Control panel */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', marginBottom: '1.5rem', padding: '1rem', background: 'var(--color-bg-secondary)', borderRadius: 12 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{t('Tháng tính lương')}</label>
                <input
                  type="month"
                  className="form-input"
                  style={{ height: 38 }}
                  value={payrollMonth}
                  onChange={e => setPayrollMonth(e.target.value)}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>{t('Số ngày công chuẩn')}</label>
                <input
                  type="number"
                  className="form-input"
                  style={{ height: 38, width: 100 }}
                  value={workDaysRequired}
                  onChange={e => setWorkDaysRequired(Math.max(1, Number(e.target.value)))}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, flex: 1, justifyContent: 'flex-end' }}>
                <button
                  onClick={handleRunPayroll}
                  disabled={calculating}
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                >
                  <Play size={15} />
                  {calculating ? t('Đang tính...') : t('Tính lương tháng')}
                </button>
                <button
                  onClick={handlePublishPayroll}
                  disabled={publishing || payslips.length === 0}
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981' }}
                >
                  <Send size={15} />
                  {publishing ? t('Đang gửi...') : t('Gửi yêu cầu xác nhận')}
                </button>
                <button
                  onClick={handleLockPayroll}
                  disabled={locking || payslips.length === 0}
                  className="btn primary"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444' }}
                >
                  <Lock size={15} />
                  {locking ? t('Đang khóa...') : t('Chốt & Khóa sổ lương')}
                </button>
              </div>
            </div>

            {/* Payroll list */}
            {payslips.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                {t('Chưa tính bảng lương cho tháng này. Hãy click "Tính lương tháng" ở trên.')}
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px 8px' }}>{t('Nhân viên')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Công thực tế')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Đi trễ (phút)')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Lương ngày công')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Thưởng KPI')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Phụ cấp')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Khấu trừ BHXH')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Thuế TNCN')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Tạm ứng')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Thực lĩnh (Net)')}</th>
                      <th style={{ padding: '12px 8px', textAlign: 'center' }}>{t('Trạng thái')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payslips.map(ps => (
                      <tr key={ps.id} style={{ borderBottom: '1px solid var(--color-border)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '14px 8px', fontWeight: 600 }}>{ps.employee_name}</td>
                        <td style={{ padding: '14px 8px' }}>{ps.work_days_actual} / {ps.work_days_required}</td>
                        <td style={{ padding: '14px 8px', color: ps.lateness_minutes > 0 ? '#ef4444' : 'inherit' }}>{ps.lateness_minutes} {t('phút')}</td>
                        <td style={{ padding: '14px 8px' }}>{formatCurrency(ps.salary_basic_calculated)}</td>
                        <td style={{ padding: '14px 8px', color: '#10b981', fontWeight: 600 }}>{formatCurrency(ps.kpi_bonus)}</td>
                        <td style={{ padding: '14px 8px' }}>{formatCurrency(ps.allowance_total)}</td>
                        <td style={{ padding: '14px 8px', color: '#ef4444' }}>{formatCurrency(Number(ps.insurance_bhxh || 0) + Number(ps.insurance_bhyt || 0) + Number(ps.insurance_bhtn || 0))}</td>
                        <td style={{ padding: '14px 8px', color: '#ef4444' }}>{formatCurrency(ps.tax_pit)}</td>
                        <td style={{ padding: '14px 8px', color: '#ef4444' }}>{formatCurrency(ps.advance_deduction)}</td>
                        <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(ps.net_salary)}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          <span style={{ 
                            fontSize: '0.725rem', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: 10,
                            textTransform: 'uppercase',
                            background: ps.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : ps.status === 'sent' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                            color: ps.status === 'confirmed' ? '#10b981' : ps.status === 'sent' ? '#3b82f6' : '#6b7280'
                          }}>
                            {ps.status === 'confirmed' ? t('Đã ký nhận') : ps.status === 'sent' ? t('Chờ ký') : t('Nháp')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Edit Profile Dialog */}
      {selectedUser && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem', width: 500, maxWidth: '90%' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.5rem' }}>
              {t('Thiết lập Hồ sơ Nhân sự')}: <span style={{ color: 'var(--color-primary)' }}>{selectedUser.full_name}</span>
            </h3>
            
            <div style={{ display: 'grid', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label className="form-label">{t('Ngày vào làm chính thức')}</label>
                <input
                  type="date"
                  className="form-input"
                  value={joinedDate}
                  onChange={e => setJoinedDate(e.target.value)}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">{t('Lương Net thực tế')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={dealSalary}
                    onChange={e => setDealSalary(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Lương đóng BHXH')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={baseSalary}
                    onChange={e => setBaseSalary(Number(e.target.value))}
                  />
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                <div>
                  <label className="form-label">{t('Phụ cấp ăn trưa')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={allowanceMeal}
                    onChange={e => setAllowanceMeal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Phụ cấp xăng xe')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={allowanceTravel}
                    onChange={e => setAllowanceTravel(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Phụ cấp đt')}</label>
                  <input
                    type="number"
                    className="form-input"
                    value={allowancePhone}
                    onChange={e => setAllowancePhone(Number(e.target.value))}
                  />
                </div>
              </div>

              <div>
                <label className="form-label">{t('Target doanh số KPI tối thiểu')}</label>
                <input
                  type="number"
                  className="form-input"
                  value={kpiTarget}
                  onChange={e => setKpiTarget(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <input
                  type="checkbox"
                  id="has_insurance"
                  checked={hasInsurance}
                  onChange={e => setHasInsurance(e.target.checked)}
                />
                <label htmlFor="has_insurance" style={{ fontWeight: 600, fontSize: '0.875rem' }}>
                  {t('Đóng bảo hiểm xã hội bắt buộc')}
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={() => setSelectedUser(null)} className="btn secondary">
                {t('Hủy bỏ')}
              </button>
              <button onClick={handleSaveProfile} className="btn primary">
                {t('Lưu thay đổi')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
