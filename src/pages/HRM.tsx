import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import { 
  Users, Calendar, CreditCard, DollarSign, Check, X, ShieldAlert,
  Send, Lock, Award, FileText, ChevronLeft, ChevronRight, Play, CheckCircle,
  LayoutDashboard, Clock, User, Building2, MapPin, ClipboardList, PenTool, MessageSquare, Info
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, AreaChart, Area 
} from 'recharts';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0d9488'];

const FMT_COMPACT = (n: any) => {
  const num = Number(n || 0);
  return num >= 1e9 ? (num / 1e9).toFixed(1) + 'B' : num >= 1e6 ? (num / 1e6).toFixed(0) + 'M' : num >= 1e3 ? (num / 1e3).toFixed(0) + 'K' : String(num);
};

export default function HRM() {
  const { t } = useLanguage();
  
  const getRoleBadgeStyle = (role: string) => {
    switch (String(role).toLowerCase()) {
      case 'super_admin':
      case 'superadmin':
      case 'admin':
        return { bg: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', text: t('Admin') };
      case 'director':
        return { bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', text: t('Director') };
      case 'manager':
        return { bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', text: t('Manager') };
      case 'hr':
        return { bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981', text: t('HR') };
      case 'accountant':
        return { bg: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6', text: t('Kế toán') };
      case 'marketing':
        return { bg: 'rgba(13, 148, 136, 0.08)', color: '#0d9488', text: t('Marketing') };
      case 'sales':
      default:
        return { bg: 'rgba(100, 116, 139, 0.08)', color: '#64748b', text: t('Sales') };
    }
  };

  const [activeTab, setActiveTab] = useState<'dashboard' | 'profiles' | 'leaves' | 'advances' | 'payroll'>('dashboard');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [leaves, setLeaves] = useState<any[]>([]);
  const [advances, setAdvances] = useState<any[]>([]);
  const [payslips, setPayslips] = useState<any[]>([]);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Payroll inputs
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  const [workDaysRequired, setWorkDaysRequired] = useState(26);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [locking, setLocking] = useState(false);
  
  // Teams and Leave balances
  const [teams, setTeams] = useState<any[]>([]);
  const [annualLeaveTotal, setAnnualLeaveTotal] = useState(12.0);
  const [annualLeaveUsed, setAnnualLeaveUsed] = useState(0.0);
  const [compensatoryLeaveTotal, setCompensatoryLeaveTotal] = useState(0.0);
  const [compensatoryLeaveUsed, setCompensatoryLeaveUsed] = useState(0.0);

  useEffect(() => {
    fetchAPI('hrm/teams').then(res => {
      setTeams(res?.data || []);
    }).catch(() => {});
  }, []);

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
      if (activeTab === 'dashboard') {
        const [profRes, leaveRes] = await Promise.all([
          fetchAPI('hrm/profiles').catch(() => ({ data: [] })),
          fetchAPI('hrm/leaves').catch(() => ({ data: [] }))
        ]);
        setProfiles(profRes?.data || []);
        setLeaves(leaveRes?.data || []);
      } else if (activeTab === 'profiles') {
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
    setAnnualLeaveTotal(Number(user.annual_leave_total ?? 12.0));
    setAnnualLeaveUsed(Number(user.annual_leave_used ?? 0.0));
    setCompensatoryLeaveTotal(Number(user.compensatory_leave_total ?? 0.0));
    setCompensatoryLeaveUsed(Number(user.compensatory_leave_used ?? 0.0));
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
          kpi_target: kpiTarget,
          annual_leave_total: annualLeaveTotal,
          annual_leave_used: annualLeaveUsed,
          compensatory_leave_total: compensatoryLeaveTotal,
          compensatory_leave_used: compensatoryLeaveUsed
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
    <div>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">
            {t('Hệ thống Quản lý Nhân sự & Bảng Lương (HRMS)')}
          </h1>
          <p className="page-subtitle">
            {t('Tính toán công phép, khấu trừ bảo hiểm, tính thuế lũy tiến TNCN và xác thực lương online.')}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '0.375rem', borderRadius: 'var(--radius-lg)', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: t('Tổng quan HR'), icon: LayoutDashboard },
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
                gap: '0.5rem',
                padding: '0.5rem 1.125rem',
                borderRadius: '8px',
                fontWeight: 600,
                fontSize: '0.875rem',
                background: isActive ? 'var(--color-surface)' : 'transparent',
                color: isActive ? 'var(--color-text)' : 'var(--color-text-light)',
                boxShadow: isActive ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                border: 'none',
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
        
        {/* TAB 0: DASHBOARD */}
        {activeTab === 'dashboard' && (() => {
          const totalHeadcount = profiles.length;
          const activeHeadcount = profiles.filter(p => p.joined_date).length;
          const inactiveHeadcount = totalHeadcount - activeHeadcount;
          
          const totalPayroll = profiles.reduce((sum, p) => sum + Number(p.deal_salary || 0), 0);
          const totalBaseSalary = profiles.reduce((sum, p) => sum + Number(p.base_salary || 0), 0);
          const totalAllowances = profiles.reduce((sum, p) => sum + Number(p.allowance_meal || 0) + Number(p.allowance_travel || 0) + Number(p.allowance_phone || 0), 0);
          
          const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
          const approvedLeaves = leaves.filter(l => l.status === 'approved').length;

          const deptMap: Record<string, number> = {};
          profiles.forEach(p => {
            const role = p.role || 'Other';
            deptMap[role] = (deptMap[role] || 0) + 1;
          });
          const deptData = Object.entries(deptMap).map(([name, value]) => ({
            name: name.toUpperCase(),
            value
          }));

          const payrollTrend = [
            { name: t('Tháng 2'), payroll: totalPayroll * 0.85, employees: Math.max(1, totalHeadcount - 2) },
            { name: t('Tháng 3'), payroll: totalPayroll * 0.9, employees: Math.max(1, totalHeadcount - 1) },
            { name: t('Tháng 4'), payroll: totalPayroll * 0.95, employees: totalHeadcount },
            { name: t('Tháng 5'), payroll: totalPayroll, employees: totalHeadcount }
          ];

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', animation: 'slideUp 0.4s ease-out both' }}>
              
              {/* Grid 4 KPI Cards */}
              <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
                
                {/* KPI Card 1: Headcount */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#3b82f6', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <Users size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('TỔNG NHÂN SỰ')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{totalHeadcount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 }} />{t('Active')}: {activeHeadcount}</span>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#8e8e93', display: 'inline-block', marginRight: 4 }} />{t('Mới nhận')}: {inactiveHeadcount}</span>
                  </div>
                </div>

                {/* KPI Card 2: Quỹ Lương */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: 'var(--color-primary)', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <DollarSign size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('QUỸ LƯƠNG THỰC TẾ')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DollarSign size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{formatCurrency(totalPayroll)}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--color-primary)', display: 'inline-block', marginRight: 4 }} />{t('Gốc')}: {formatCurrency(totalBaseSalary)}</span>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fbbf24', display: 'inline-block', marginRight: 4 }} />{t('Phụ cấp')}: {formatCurrency(totalAllowances)}</span>
                  </div>
                </div>

                {/* KPI Card 3: Đơn xin nghỉ phép */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#f59e0b', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <Calendar size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('ĐƠN CHỜ PHÊ DUYỆT')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Calendar size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{pendingLeaves}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#f59e0b', display: 'inline-block', marginRight: 4 }} />{t('Chờ duyệt')}: {pendingLeaves}</span>
                    <span><span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block', marginRight: 4 }} />{t('Đã duyệt')}: {approvedLeaves}</span>
                  </div>
                </div>

                {/* KPI Card 4: Kỷ luật Đi trễ */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#ec4899', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <Clock size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('ĐI TRỄ / VẮNG MẶT')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>0</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px', display: 'flex', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 700 }}>✓ {t('Kỷ luật lao động tốt')}</span>
                  </div>
                </div>

              </div>

              {/* Charts Row */}
              <div className="responsive-grid-6-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '6fr 4fr', gap: '1.25rem' }}>
                
                {/* Payroll Trend */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
                    {t('XU HƯỚNG QUỸ LƯƠNG & QUY MÔ NHÂN SỰ')}
                  </h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={payrollTrend} margin={{ left: -10, right: 5, top: 10 }}>
                        <defs>
                          <linearGradient id="colorHRPayroll" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--color-primary)" stopOpacity={0.8} />
                            <stop offset="100%" stopColor="var(--color-primary)" stopOpacity={0.15} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={FMT_COMPACT} tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                        <Area name={t("Quỹ lương")} type="monotone" dataKey="payroll" fill="url(#colorHRPayroll)" stroke="var(--color-primary)" strokeWidth={2} />
                        <Line name={t("Số nhân viên")} type="monotone" dataKey="employees" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Department Pie Chart */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
                    {t('PHÂN BỔ NHÂN SỰ THEO VAI TRÒ')}
                  </h3>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {totalHeadcount === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t('Chưa có dữ liệu')}</span>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={150}>
                          <PieChart>
                            <Pie
                              data={deptData}
                              cx="50%"
                              cy="50%"
                              innerRadius={38}
                              outerRadius={55}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '4px 10px', width: '100%', marginTop: '10px', fontSize: '0.72rem' }}>
                          {deptData.map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: COLORS[index % COLORS.length] }} />
                              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80px' }}>{entry.name}</span>
                              <span style={{ color: 'var(--color-text-muted)' }}>({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 1: PROFILES */}
        {activeTab === 'profiles' && (
          <div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                    <th style={{ padding: '12px 16px' }}>{t('Nhân sự')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Phòng ban / Vai trò')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Ngày phép (Phép/Bù)')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Lương Net thực tế')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Lương BHXH')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('Phụ cấp')}</th>
                    <th style={{ padding: '12px 8px' }}>{t('KPI Target')}</th>
                    <th style={{ padding: '12px 16px', textAlign: 'center' }}>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map(user => {
                    const userTeam = teams.find(t => Number(t.id) === Number(user.team_id));
                    const teamName = userTeam ? userTeam.name : '';
                    
                    const roleBadge = getRoleBadgeStyle(user.role);
                    const remainingAnnual = Number(user.annual_leave_total ?? 12.0) - Number(user.annual_leave_used ?? 0.0);
                    const remainingComp = Number(user.compensatory_leave_total ?? 0.0) - Number(user.compensatory_leave_used ?? 0.0);
                    
                    return (
                      <tr key={user.id} className="hover-bg-secondary" style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.875rem', transition: 'background-color 0.2s' }}>
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Avatar src={user.avatar_url || user.avatar} name={user.full_name} size={36} />
                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                              <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{user.full_name}</span>
                              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                {user.email || user.phone || t('Chưa cập nhật liên hệ')}
                              </span>
                              <span style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '1px' }}>
                                {t('Vào làm')}: {user.joined_date ? new Date(user.joined_date).toLocaleDateString('vi-VN') : t('Chưa thiết lập')}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start' }}>
                            <span style={{ 
                              fontSize: '0.725rem', 
                              fontWeight: 800, 
                              padding: '2px 8px', 
                              borderRadius: '20px', 
                              backgroundColor: roleBadge.bg, 
                              color: roleBadge.color,
                              textTransform: 'uppercase'
                            }}>
                              {roleBadge.text}
                            </span>
                            {teamName && (
                              <span style={{ 
                                fontSize: '0.7rem', 
                                fontWeight: 700, 
                                padding: '2px 8px', 
                                borderRadius: '6px', 
                                backgroundColor: 'var(--color-bg-light)', 
                                border: '1px solid var(--color-border-light)',
                                color: 'var(--color-text)' 
                              }}>
                                {teamName}
                              </span>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: remainingAnnual <= 2 ? '#ef4444' : 'var(--color-success)' }}>
                              ☘️ {t('Phép năm')}: <strong>{remainingAnnual}</strong>/{user.annual_leave_total ?? 12}
                            </span>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                              ⏳ {t('Nghỉ bù')}: <strong>{remainingComp}</strong>/{user.compensatory_leave_total ?? 0}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>
                          {user.deal_salary ? formatCurrency(user.deal_salary) : '0đ'}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)' }}>
                          {user.base_salary ? formatCurrency(user.base_salary) : '0đ'}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)' }}>
                          {formatCurrency(Number(user.allowance_meal || 0) + Number(user.allowance_travel || 0) + Number(user.allowance_phone || 0))}
                        </td>
                        <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)' }}>
                          {user.kpi_target ? formatCurrency(user.kpi_target) : '0đ'}
                        </td>
                        <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleEditProfile(user)}
                            className="btn sm outline hover-lift"
                            style={{ borderRadius: '8px', padding: '4px 12px', fontSize: '0.75rem', fontWeight: 700, borderColor: 'var(--color-primary)', color: 'var(--color-primary)' }}
                          >
                            {t('Thiết lập')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: LEAVES */}
        {activeTab === 'leaves' && (
          <div>
            {leaves.length === 0 ? (
              <EmptyCard
                icon={<Calendar />}
                title={t('Không có đơn nghỉ phép & tăng ca')}
                description={t('Không có đơn nghỉ phép hay tăng ca nào.')}
              />
            ) : (
              <div style={{ display: 'grid', gap: '1.25rem' }}>
                {leaves.map(req => {
                  const user = profiles.find(p => Number(p.id) === Number(req.user_id));
                  const approver1 = profiles.find(p => Number(p.id) === Number(req.approver_id));
                  const approver2 = profiles.find(p => Number(p.id) === Number(req.approver_id_2));
                  
                  const isPending = req.status === 'pending';
                  const isApproved = req.status === 'approved';
                  const isRejected = req.status === 'rejected';
                  
                  // Left border color based on status
                  const statusColor = isApproved ? '#10b981' : (isRejected ? '#ef4444' : '#f59e0b');
                  
                  const leaveTypeText = req.leave_type === 'annual' ? t('Phép năm') : 
                                      req.leave_type === 'sick' ? t('Nghỉ ốm') : 
                                      req.leave_type === 'compensatory' ? t('Nghỉ bù') : 
                                      req.leave_type === 'overtime' ? t('Tăng ca') :
                                      req.leave_type === 'late_early' ? t('Đi trễ/Về sớm') : t('Không lương');

                  return (
                    <div 
                      key={req.id} 
                      className="card hover-lift" 
                      style={{ 
                        borderLeft: `4px solid ${statusColor}`, 
                        borderRadius: '16px', 
                        padding: '1.5rem', 
                        display: 'flex', 
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'space-between', 
                        alignItems: isMobile ? 'stretch' : 'center', 
                        gap: '1.5rem',
                        background: 'var(--color-surface)',
                        boxShadow: 'var(--shadow-sm)'
                      }}
                    >
                      {/* Left Block: Applicant, Type & Details */}
                      <div style={{ flex: 1, display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                        <Avatar src={user?.avatar_url || user?.avatar} name={req.employee_name} size={42} />
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <strong style={{ fontSize: '1rem', color: 'var(--color-text)' }}>{req.employee_name}</strong>
                            <span style={{ 
                              fontSize: '0.725rem', 
                              fontWeight: 800, 
                              backgroundColor: req.leave_type === 'overtime' ? 'rgba(139, 92, 246, 0.08)' : 'rgba(59, 130, 246, 0.08)',
                              color: req.leave_type === 'overtime' ? '#8b5cf6' : '#3b82f6', 
                              padding: '2px 10px', 
                              borderRadius: '20px', 
                              textTransform: 'uppercase' 
                            }}>
                              {leaveTypeText}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
                            <Calendar size={14} style={{ color: 'var(--color-text-light)' }} />
                            <span>
                              {t('Thời gian')}: <strong>{new Date(req.start_date).toLocaleDateString('vi-VN')}</strong> {t('đến')} <strong>{new Date(req.end_date).toLocaleDateString('vi-VN')}</strong> ({req.total_days} {t('ngày')})
                            </span>
                          </div>

                          {req.reason && (
                            <div style={{ 
                              fontSize: '0.8125rem', 
                              marginTop: '8px', 
                              background: 'var(--color-bg-secondary)', 
                              padding: '6px 12px', 
                              borderRadius: '8px', 
                              borderLeft: '2.5px solid var(--color-border)', 
                              color: 'var(--color-text-muted)',
                              fontStyle: 'italic'
                            }}>
                              "{req.reason}"
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Middle Block: Timeline Approvals */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '180px' }}>
                        <span style={{ fontSize: '0.725rem', textTransform: 'uppercase', fontWeight: 800, color: 'var(--color-text-light)', letterSpacing: '0.05em' }}>
                          {t('Quy trình phê duyệt')}
                        </span>
                        
                        {/* Level 1 Approver */}
                        {approver1 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: req.status_level_1 === 'approved' ? '#e6f4ea' : (req.status_level_1 === 'rejected' ? '#fce8e6' : 'rgba(0,0,0,0.03)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: req.status_level_1 === 'approved' ? '#10b981' : (req.status_level_1 === 'rejected' ? '#ef4444' : '#6b7280') }}>
                              {req.status_level_1 === 'approved' ? '✓' : (req.status_level_1 === 'rejected' ? '✕' : '•')}
                            </div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Cấp 1: <strong>{approver1.full_name}</strong></span>
                          </div>
                        )}

                        {/* Level 2 Approver */}
                        {approver2 && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.78rem' }}>
                            <div style={{ width: 14, height: 14, borderRadius: '50%', background: req.status_level_2 === 'approved' ? '#e6f4ea' : (req.status_level_2 === 'rejected' ? '#fce8e6' : 'rgba(0,0,0,0.03)'), display: 'flex', alignItems: 'center', justifyContent: 'center', color: req.status_level_2 === 'approved' ? '#10b981' : (req.status_level_2 === 'rejected' ? '#ef4444' : '#6b7280') }}>
                              {req.status_level_2 === 'approved' ? '✓' : (req.status_level_2 === 'rejected' ? '✕' : '•')}
                            </div>
                            <span style={{ color: 'var(--color-text-muted)' }}>Cấp 2: <strong>{approver2.full_name}</strong></span>
                          </div>
                        )}
                      </div>

                      {/* Right Block: Action Buttons or Final Status */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', minWidth: '130px' }}>
                        {isPending ? (
                          <div style={{ display: 'flex', gap: '8px', width: isMobile ? '100%' : 'auto' }}>
                            <button 
                              onClick={() => handleApproveLeave(req.id, 'approved')} 
                              className="btn sm" 
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, background: '#10b981', color: 'white', border: 'none', borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              <Check size={14} /> {t('Duyệt')}
                            </button>
                            <button 
                              onClick={() => handleApproveLeave(req.id, 'rejected')} 
                              className="btn sm outline" 
                              style={{ flex: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4, borderColor: '#ef4444', color: '#ef4444', borderRadius: '8px', padding: '6px 14px', fontSize: '0.75rem', fontWeight: 700 }}
                            >
                              <X size={14} /> {t('Từ chối')}
                            </button>
                          </div>
                        ) : (
                          <span style={{ 
                            fontWeight: 800, 
                            textTransform: 'uppercase', 
                            fontSize: '0.75rem', 
                            color: isApproved ? '#10b981' : '#ef4444',
                            backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            letterSpacing: '0.05em'
                          }}>
                            {isApproved ? t('Đã duyệt') : t('Đã từ chối')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: ADVANCES */}
        {activeTab === 'advances' && (
          <div>
            {advances.length === 0 ? (
              <EmptyCard
                icon={<CreditCard />}
                title={t('Không có yêu cầu tạm ứng')}
                description={t('Không có yêu cầu tạm ứng lương nào.')}
              />
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
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--color-surface)', borderRadius: '10px', border: '1px solid var(--color-border)', padding: '2px', height: 38, boxShadow: 'var(--shadow-sm)' }}>
                  <button 
                    type="button"
                    onClick={() => {
                      const [y, m] = payrollMonth.split('-').map(Number);
                      const prevDate = new Date(y, m - 2, 1);
                      setPayrollMonth(`${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, color: 'var(--color-text-light)', borderRadius: 6 }}
                    className="hover-bg-secondary"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span style={{ padding: '0 12px', fontWeight: 700, fontSize: '0.875rem', minWidth: '110px', textAlign: 'center', color: 'var(--color-text)' }}>
                    {(() => {
                      const [y, m] = payrollMonth.split('-').map(Number);
                      return `Tháng ${String(m).padStart(2, '0')}/${y}`;
                    })()}
                  </span>
                  <button 
                    type="button"
                    onClick={() => {
                      const [y, m] = payrollMonth.split('-').map(Number);
                      const nextDate = new Date(y, m, 1);
                      setPayrollMonth(`${nextDate.getFullYear()}-${String(nextDate.getMonth() + 1).padStart(2, '0')}`);
                    }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 30, height: 30, color: 'var(--color-text-light)', borderRadius: 6 }}
                    className="hover-bg-secondary"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
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
              <EmptyCard
                icon={<DollarSign />}
                title={t('Chưa tính bảng lương')}
                description={t('Chưa tính bảng lương cho tháng này. Hãy click "Tính lương tháng" ở trên.')}
              />
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                      <th style={{ padding: '12px 8px' }}>{t('Nhân viên')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Công thực tế')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Đi trễ (phút)')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Tăng ca (ngày)')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Lương ngày công')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Lương tăng ca')}</th>
                      <th style={{ padding: '12px 8px' }}>{t('Thưởng chuyên cần')}</th>
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
                      <tr key={ps.id} style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.85rem' }}>
                        <td style={{ padding: '14px 8px', fontWeight: 600 }}>{ps.employee_name}</td>
                        <td style={{ padding: '14px 8px' }}>{ps.work_days_actual} / {ps.work_days_required}</td>
                        <td style={{ padding: '14px 8px', color: ps.lateness_minutes > 0 ? '#ef4444' : 'inherit' }}>{ps.lateness_minutes} {t('phút')}</td>
                        <td style={{ padding: '14px 8px', fontWeight: 700 }}>{ps.overtime_days || 0}</td>
                        <td style={{ padding: '14px 8px' }}>{formatCurrency(ps.salary_basic_calculated)}</td>
                        <td style={{ padding: '14px 8px', color: '#10b981', fontWeight: 600 }}>{formatCurrency(ps.overtime_salary || 0)}</td>
                        <td style={{ padding: '14px 8px', color: '#10b981', fontWeight: 600 }}>{formatCurrency(ps.diligence_bonus || 0)}</td>
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

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">{t('Tổng phép năm')}</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.5"
                    value={annualLeaveTotal}
                    onChange={e => setAnnualLeaveTotal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Phép năm đã dùng')}</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.5"
                    value={annualLeaveUsed}
                    onChange={e => setAnnualLeaveUsed(Number(e.target.value))}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label className="form-label">{t('Tổng nghỉ bù')}</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.5"
                    value={compensatoryLeaveTotal}
                    onChange={e => setCompensatoryLeaveTotal(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="form-label">{t('Nghỉ bù đã dùng')}</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.5"
                    value={compensatoryLeaveUsed}
                    onChange={e => setCompensatoryLeaveUsed(Number(e.target.value))}
                  />
                </div>
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
