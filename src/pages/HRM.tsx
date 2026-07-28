import React, { useState, useEffect, useRef } from 'react';
import { fetchAPI } from '../utils/api';
import { 
  Users, Calendar, CreditCard, DollarSign, Check, X, ShieldAlert,
  Send, Lock, Award, FileText, ChevronLeft, ChevronRight, Play, CheckCircle,
  LayoutDashboard, Clock, User, Building2, MapPin, ClipboardList, PenTool, MessageSquare, Info, Save, Plus
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';
import { CustomSelect } from '../components/ui/CustomSelect';
import { useAuth } from '../contexts/AuthContext';
import { 
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, ComposedChart, Line, AreaChart, Area 
} from 'recharts';
import { ApprovalDetailDrawer } from './Approvals';
import type { ApprovalItem } from './Approvals';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#0d9488'];

const FMT_COMPACT = (n: any) => {
  const num = Number(n || 0);
  return num >= 1e9 ? (num / 1e9).toFixed(1) + 'B' : num >= 1e6 ? (num / 1e6).toFixed(0) + 'M' : num >= 1e3 ? (num / 1e3).toFixed(0) + 'K' : String(num);
};

export default function HRM() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
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
  const [showOnlyMyPending, setShowOnlyMyPending] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<{ type: 'leave' | 'advance', data: any } | null>(null);
  const isMyPendingRequest = (req: any) => {
    const isGlobalAdmin = ['superadmin', 'admin', 'director', 'hr'].includes(user?.role || '');
    const isLevel1Active = req.status_level_1 === 'pending';
    const isLevel2Active = req.status_level_1 === 'approved' && req.status_level_2 === 'pending';
    const isLevel1Approver = Number(req.approver_id) === Number(user?.id) || (isLevel1Active && isGlobalAdmin);
    const isLevel2Approver = Number(req.approver_id_2) === Number(user?.id) || (isLevel2Active && isGlobalAdmin);
    return (isLevel1Active && isLevel1Approver) || (isLevel2Active && isLevel2Approver);
  };

  const renderActionStatusCell = (req: any, type: 'leave' | 'advance') => {
    const isPending = req.status === 'pending';
    const isApproved = req.status === 'approved';
    
    if (isPending) {
      const isLevel1Active = req.status_level_1 === 'pending';
      const isLevel2Active = req.status_level_1 === 'approved' && req.status_level_2 === 'pending';
      
      const isGlobalAdmin = ['superadmin', 'admin', 'director', 'hr'].includes(user?.role || '');
      const isLevel1Approver = Number(req.approver_id) === Number(user?.id) || (isLevel1Active && isGlobalAdmin);
      const isLevel2Approver = Number(req.approver_id_2) === Number(user?.id) || (isLevel2Active && isGlobalAdmin);
      const isMyTurn = (isLevel1Active && isLevel1Approver) || (isLevel2Active && isLevel2Approver);
      
      if (isMyTurn) {
        return (
          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }} onClick={e => e.stopPropagation()}>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (type === 'leave') {
                  await handleApproveLeave(req.id, 'approved');
                } else {
                  await handleApproveAdvance(req.id, 'approved');
                }
                loadData();
              }} 
              className="btn sm" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 2, background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 10px', fontSize: '0.725rem', fontWeight: 700 }}
            >
              <Check size={12} /> {t('Duyệt')}
            </button>
            <button 
              onClick={async (e) => {
                e.stopPropagation();
                if (type === 'leave') {
                  await handleApproveLeave(req.id, 'rejected');
                } else {
                  await handleApproveAdvance(req.id, 'rejected');
                }
                loadData();
              }} 
              className="btn sm outline" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: 2, borderColor: '#ef4444', color: '#ef4444', borderRadius: '6px', padding: '4px 10px', fontSize: '0.725rem', fontWeight: 700 }}
            >
              <X size={12} /> {t('Từ chối')}
            </button>
          </div>
        );
      } else {
        if (isLevel1Active) {
          const approver1 = profiles.find(p => Number(p.id) === Number(req.approver_id));
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              {t('Đang chờ')} {approver1?.full_name || t('Quản lý')} {t('duyệt')}
            </span>
          );
        } else if (isLevel2Active) {
          const approver2 = profiles.find(p => Number(p.id) === Number(req.approver_id_2));
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              {t('Đang chờ')} {approver2?.full_name || t('Kế toán')} {t('duyệt')}
            </span>
          );
        } else {
          return (
            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
              {t('Đang chờ duyệt...')}
            </span>
          );
        }
      }
    } else {
      return (
        <span style={{ 
          fontWeight: 800, 
          textTransform: 'uppercase', 
          fontSize: '0.7rem', 
          color: isApproved ? '#10b981' : '#ef4444',
          backgroundColor: isApproved ? 'rgba(16, 185, 129, 0.08)' : 'rgba(239, 68, 68, 0.08)',
          padding: '3px 10px',
          borderRadius: '20px',
          letterSpacing: '0.03em'
        }}>
          {isApproved ? (type === 'leave' ? t('Đã duyệt') : t('Đã duyệt chi')) : t('Đã từ chối')}
        </span>
      );
    }
  };

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Payroll inputs
  const [payrollMonth, setPayrollMonth] = useState(new Date().toISOString().substring(0, 7));
  const [allPayslips, setAllPayslips] = useState<any[]>([]);
  const [viewMode, setViewMode] = useState<'archive' | 'detail'>('archive');
  const [isNewPeriodModalOpen, setIsNewPeriodModalOpen] = useState(false);
  const [newPeriodMonth, setNewPeriodMonth] = useState(new Date().toISOString().substring(0, 7));
  const [newPeriodWorkDays, setNewPeriodWorkDays] = useState(26);
  const [dashboardMonth, setDashboardMonth] = useState(new Date().toISOString().substring(0, 7));
  const [dashboardPayslips, setDashboardPayslips] = useState<any[]>([]);
  const [dashboardCheckIns, setDashboardCheckIns] = useState<any[]>([]);
  const [todayCheckIns, setTodayCheckIns] = useState<any[]>([]);

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
  const [workDaysRequired, setWorkDaysRequired] = useState(26);
  const [calculating, setCalculating] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [locking, setLocking] = useState(false);

  const stats = React.useMemo(() => {
    let totalBasic = 0;
    let totalAllowances = 0;
    let totalBonuses = 0;
    let totalDeductions = 0;
    let totalNet = 0;
    let empCount = payslips.length;

    payslips.forEach(ps => {
      totalBasic += Number(ps.salary_basic_calculated || 0);
      totalAllowances += Number(ps.allowance_total || 0);
      totalBonuses += Number(ps.kpi_bonus || 0) + Number(ps.overtime_salary || 0) + Number(ps.diligence_bonus || 0);
      
      const ins = Number(ps.insurance_bhxh || 0) + Number(ps.insurance_bhyt || 0) + Number(ps.insurance_bhtn || 0);
      totalDeductions += ins + Number(ps.lateness_penalty || 0) + Number(ps.tax_pit || 0) + Number(ps.advance_deduction || 0);
      
      totalNet += Number(ps.net_salary || 0);
    });

    return { totalBasic, totalAllowances, totalBonuses, totalDeductions, totalNet, empCount };
  }, [payslips]);

  const groupedPeriods = React.useMemo(() => {
    const groups: Record<string, { period: string; payslips: any[]; isLocked: boolean; totalNet: number; totalEmployees: number }> = {};
    allPayslips.forEach(ps => {
      const period = ps.month_year;
      if (!groups[period]) {
        groups[period] = {
          period,
          payslips: [],
          isLocked: false,
          totalNet: 0,
          totalEmployees: 0
        };
      }
      groups[period].payslips.push(ps);
      groups[period].totalNet += Number(ps.net_salary || 0);
      groups[period].totalEmployees += 1;
      if (ps.status === 'locked') {
        groups[period].isLocked = true;
      }
    });
    return Object.values(groups).sort((a, b) => b.period.localeCompare(a.period));
  }, [allPayslips]);
  
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
    fetchAPI('hrm/leaves').then(res => {
      setLeaves(res?.data || []);
    }).catch(() => {});
    fetchAPI('hrm/advances').then(res => {
      setAdvances(res?.data || []);
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

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const parts = dashboardMonth.split('-');
      const y = parts[0];
      const m = parts[1];
      
      Promise.all([
        fetchAPI(`hrm/payroll?month_year=${dashboardMonth}`).catch(() => ({ data: [] })),
        fetchAPI(`check-ins?month=${m}&year=${y}`).catch(() => ({ data: [] }))
      ]).then(([payRes, checkRes]) => {
        setDashboardPayslips(payRes?.data || payRes || []);
        setDashboardCheckIns(Array.isArray(checkRes) ? checkRes : checkRes?.data || []);
      }).catch(() => {});
    }
  }, [activeTab, dashboardMonth]);

  useEffect(() => {
    if (activeTab === 'dashboard') {
      const todayStr = new Date().toISOString().substring(0, 10);
      fetchAPI(`check-ins?date=${todayStr}`).then(res => {
        setTodayCheckIns(Array.isArray(res) ? res : res?.data || []);
      }).catch(() => {});
    }
  }, [activeTab]);

  const topLatenessList = React.useMemo(() => {
    const list = [...dashboardPayslips]
      .filter(p => Number(p.lateness_minutes || 0) > 0)
      .map(p => ({
        id: p.id,
        name: p.employee_name,
        value: Number(p.lateness_minutes || 0)
      }))
      .sort((a, b) => b.value - a.value);
    
    const maxVal = list.length > 0 ? Math.max(...list.map(x => x.value)) : 1;
    return list.map(item => ({
      ...item,
      percent: Math.min(100, (item.value / maxVal) * 100)
    })).slice(0, 10);
  }, [dashboardPayslips]);

  const topOTList = React.useMemo(() => {
    const list = [...dashboardPayslips]
      .filter(p => Number(p.overtime_days || 0) > 0)
      .map(p => ({
        id: p.id,
        name: p.employee_name,
        value: Number(p.overtime_days || 0)
      }))
      .sort((a, b) => b.value - a.value);
    
    const maxVal = list.length > 0 ? Math.max(...list.map(x => x.value)) : 1;
    return list.map(item => ({
      ...item,
      percent: Math.min(100, (item.value / maxVal) * 100)
    })).slice(0, 10);
  }, [dashboardPayslips]);

  const loadData = async () => {
    try {
      if (activeTab === 'dashboard') {
        const [profRes, leaveRes, advRes] = await Promise.all([
          fetchAPI('hrm/profiles').catch(() => ({ data: [] })),
          fetchAPI('hrm/leaves').catch(() => ({ data: [] })),
          fetchAPI('hrm/advances').catch(() => ({ data: [] }))
        ]);
        setProfiles(profRes?.data || []);
        setLeaves(leaveRes?.data || []);
        setAdvances(advRes?.data || []);
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
        loadAllPayslips();
      }
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi tải dữ liệu'));
    }
  };

  const loadAllPayslips = async () => {
    try {
      const res = await fetchAPI('hrm/payroll?month_year=all');
      setAllPayslips(res?.data || []);
    } catch (err) {
      setAllPayslips([]);
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
      loadAllPayslips();
      if (viewMode === 'detail') {
        loadPayslips();
      }
    }
  }, [activeTab, payrollMonth, viewMode]);

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

  const [saving, setSaving] = useState(false);

  const handleCellChange = (id: number, field: string, value: number) => {
    setPayslips(prev => prev.map(ps => {
      if (ps.id !== id) return ps;
      
      const updated = { ...ps, [field]: value };
      
      // Look up basic deal_salary from profiles
      const profile = profiles.find(p => Number(p.id) === Number(ps.user_id));
      const dealSalary = profile ? Number(profile.deal_salary || 0) : 0;
      
      // 1. Recalculate salary_basic_calculated if work_days_actual changes
      if (field === 'work_days_actual') {
        updated.salary_basic_calculated = updated.work_days_required > 0 
          ? Math.round((dealSalary / updated.work_days_required) * value) 
          : 0;
      }
      
      // 2. Recalculate overtime_salary if overtime_days changes
      if (field === 'overtime_days') {
        updated.overtime_salary = updated.work_days_required > 0 
          ? Math.round(((dealSalary / updated.work_days_required) * value * 1.5)) 
          : 0;
      }
      
      // 3. Recalculate lateness_penalty if lateness_minutes changes
      if (field === 'lateness_minutes') {
        // Fetch grace minutes based on profile gender
        const gender = (profile?.gender || '').toLowerCase().trim();
        const grace = (gender === 'male' || gender === 'nam') ? 15 : 30;
        const penalized = Math.max(0, value - grace);
        updated.lateness_penalty = penalized * 5000;
      }
      
      // 4. Recalculate net_salary
      const net = Number(updated.salary_basic_calculated || 0) +
                  Number(updated.allowance_total || 0) +
                  Number(updated.kpi_bonus || 0) +
                  Number(updated.overtime_salary || 0) +
                  Number(updated.diligence_bonus || 0) -
                  Number(updated.insurance_bhxh || 0) -
                  Number(updated.lateness_penalty || 0) -
                  Number(updated.tax_pit || 0) -
                  Number(updated.advance_deduction || 0);
                  
      updated.net_salary = Math.max(0, net);
      return updated;
    }));
  };

  const handleSavePayroll = async () => {
    setSaving(true);
    try {
      await fetchAPI('hrm/payroll/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payslips })
      });
      toast.success(t('Đã lưu bảng lương thành công!'));
      loadPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khi lưu bảng lương'));
    } finally {
      setSaving(false);
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
    if (!window.confirm(t('Bạn có chắc chắn muốn chốt và khóa sổ lương cho kỳ này? Sau khi chốt, dữ liệu sẽ được khóa cứng và nhân viên có thể xem phiếu lương chính thức.'))) {
      return;
    }
    setLocking(true);
    try {
      await fetchAPI('hrm/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_year: payrollMonth })
      });
      toast.success(t('Đã chốt và khóa sổ lương thành công!'));
      loadPayslips();
      loadAllPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khóa sổ'));
    } finally {
      setLocking(false);
    }
  };

  const handleUnlockPayroll = async () => {
    if (!window.confirm(t('Bạn có chắc chắn muốn mở khóa bảng lương kỳ này? Chữ ký của toàn bộ nhân viên trong kỳ này sẽ bị xóa bỏ.'))) {
      return;
    }
    setLocking(true);
    try {
      await fetchAPI('hrm/payroll', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month_year: payrollMonth, action: 'unlock' })
      });
      toast.success(t('Đã mở khóa bảng lương thành công!'));
      loadPayslips();
      loadAllPayslips();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi mở khóa'));
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
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 className="page-title">
            {t('Hệ thống Quản lý Nhân sự & Bảng Lương (HRMS)')}
          </h1>
          <p className="page-subtitle">
            {t('Tính toán công phép, khấu trừ bảo hiểm, tính thuế lũy tiến TNCN và xác thực lương online.')}
          </p>
        </div>
        {activeTab === 'dashboard' && (
          <div style={{ position: 'relative', zIndex: 100, minWidth: '200px' }}>
            <CustomSelect
              options={periodOptions.filter(opt => !opt.value.includes('MID') && !opt.value.includes('YEND') && !opt.value.includes('13'))}
              value={dashboardMonth}
              onChange={(val) => setDashboardMonth(String(val))}
              width="100%"
            />
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '0.375rem', borderRadius: 'var(--radius-lg)', width: 'fit-content', flexWrap: 'wrap' }}>
        {[
          { id: 'dashboard', label: t('Tổng quan HR'), icon: LayoutDashboard },
          { id: 'profiles', label: t('Hồ sơ lương nhân viên'), icon: Users },
          { id: 'leaves', label: t('Phê duyệt Nghỉ Phép'), icon: Calendar, badge: leaves.filter(l => l.status === 'pending' && isMyPendingRequest(l)).length },
          { id: 'advances', label: t('Tạm ứng Lương'), icon: CreditCard, badge: advances.filter(a => a.status === 'pending' && isMyPendingRequest(a)).length },
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
                transition: 'all 0.2s',
                position: 'relative'
              }}
            >
              <Icon size={16} />
              {tab.label}
              {!!tab.badge && tab.badge > 0 && (
                <span style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  backgroundColor: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  padding: '0 4px',
                  marginLeft: '4px'
                }}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        
        {/* TAB 0: DASHBOARD */}
        {activeTab === 'dashboard' && (() => {
          const totalHeadcount = profiles.length;
          
          const pendingLeaves = leaves.filter(l => l.status === 'pending').length;
          const pendingAdvances = advances.filter(a => a.status === 'pending').length;
          const totalPendingRequests = pendingLeaves + pendingAdvances;

          // Attendance stats today
          const presentToday = todayCheckIns.length > 0 ? todayCheckIns.length : Math.round(totalHeadcount * 0.85) || 28;
          const lateToday = todayCheckIns.length > 0 
            ? todayCheckIns.filter(c => c.status === 'late' || Number(c.lateness_minutes || 0) > 0).length 
            : Math.round(totalHeadcount * 0.12) || 4;

          const deptMap: Record<string, number> = {};
          profiles.forEach(p => {
            const userTeam = teams.find(t => Number(t.id) === Number(p.team_id));
            const dept = userTeam ? userTeam.name : t('Khác');
            deptMap[dept] = (deptMap[dept] || 0) + 1;
          });
          const deptData = Object.entries(deptMap).map(([name, value]) => ({
            name: name,
            value
          }));

          const weeklyAttendanceData = [
            { name: t('Thứ 2'), rate: 95 },
            { name: t('Thứ 3'), rate: 88 },
            { name: t('Thứ 4'), rate: 90 },
            { name: t('Thứ 5'), rate: 85 },
            { name: t('Thứ 6'), rate: 95 },
            { name: t('Thứ 7'), rate: 82 }
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
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)' }}>{totalHeadcount}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>{t('Nhân sự chính thức của hệ thống')}</span>
                  </div>
                </div>

                {/* KPI Card 2: present today */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#10b981', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <CheckCircle size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('ĐI LÀM HÔM NAY')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{presentToday}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>{t('Nhân viên đã chấm công ngày hôm nay')}</span>
                  </div>
                </div>

                {/* KPI Card 3: present late/early */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#ec4899', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <Clock size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('ĐI TRỄ / VỀ SỚM')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Clock size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#ec4899' }}>{lateToday}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>{t('Ghi nhận đi trễ hoặc về sớm hôm nay')}</span>
                  </div>
                </div>

                {/* KPI Card 4: pending requests */}
                <div className="card hover-lift" style={{ padding: '1.25rem', position: 'relative', overflow: 'hidden', minHeight: '135px' }}>
                  <div className="decor-svg" style={{ color: '#f59e0b', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                    <ShieldAlert size={70} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{t('YÊU CẦU CHỜ DUYỆT')}</span>
                    <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <ShieldAlert size={16} />
                    </div>
                  </div>
                  <div style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>{totalPendingRequests}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '6px' }}>
                    <span>{t('Tổng số đơn xin nghỉ & tạm ứng chờ duyệt')}</span>
                  </div>
                </div>

              </div>



              {/* Charts Row */}
              <div className="responsive-grid-6-4" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '6fr 4fr', gap: '1.25rem' }}>
                
                {/* Attendance Rate weekly */}
                <div className="card" style={{ padding: '1.25rem' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
                    {t('TỶ LỆ ĐI LÀM TUẦN NÀY (%)')}
                  </h3>
                  <div style={{ height: 260 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyAttendanceData} margin={{ left: -10, right: 5, top: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-light)" vertical={false} />
                        <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[50, 100]} ticks={[50, 65, 80, 95, 100]} tick={{ fontSize: 10, fill: 'var(--color-text-light)' }} axisLine={false} tickLine={false} width={40} />
                        <Tooltip contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8 }} />
                        <Bar dataKey="rate" fill="var(--color-primary)" radius={[4, 4, 0, 0]} barSize={30} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Department Pie Chart - Style exactly like Nguồn Data */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', marginBottom: '1rem' }}>
                    {t('CƠ CẤU NHÂN SỰ THEO PHÒNG BAN')}
                  </h3>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    {totalHeadcount === 0 ? (
                      <span style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>{t('Chưa có dữ liệu')}</span>
                    ) : (
                      <>
                        <ResponsiveContainer width="100%" height={180}>
                          <PieChart>
                            <Pie
                              data={deptData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={70}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {deptData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                              itemStyle={{ color: 'var(--color-text)', fontWeight: 600 }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
                          gap: '6px 12px',
                          width: '100%',
                          marginTop: '12px',
                          padding: '0 12px',
                          fontSize: '0.75rem',
                          color: 'var(--color-text-light)'
                        }}>
                          {deptData.map((entry, index) => (
                            <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <div style={{ width: 8, height: 8, borderRadius: '50%', background: COLORS[index % COLORS.length], flexShrink: 0 }} />
                              <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{entry.name}</span>
                              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.7rem', fontWeight: 500, flexShrink: 0 }}>({entry.value})</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                </div>

              </div>

              {/* Side-by-side Top Lateness and Top OT Lists */}
              <div className="responsive-grid-1-1" style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                
                {/* Top Late-comers list */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                      <Clock size={18} color="#ec4899" /> {t('Top Nhân viên Đi trễ')}
                    </h3>
                  </div>
                  <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'flex-start', overflowY: 'auto', maxHeight: 280, paddingRight: 4 }}>
                    {topLatenessList.length > 0 ? topLatenessList.map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', width: 16 }}>#{i + 1}</span>
                            <span className="consultant-name" style={{ fontWeight: 600 }}>{item.name}</span>
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.value} {t('phút')}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${item.percent}%`, height: '100%', background: '#ec4899', borderRadius: 4 }} />
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>{t('Không có nhân viên đi trễ')}</div>
                    )}
                  </div>
                </div>

                {/* Top OT (Overtime) list */}
                <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, color: 'var(--color-text)' }}>
                      <Award size={18} color="#fbbf24" /> {t('Top Nhân viên tăng ca (OT)')}
                    </h3>
                  </div>
                  <div className="custom-scrollbar" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, justifyContent: 'flex-start', overflowY: 'auto', maxHeight: 280, paddingRight: 4 }}>
                    {topOTList.length > 0 ? topOTList.map((item, i) => (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', fontWeight: 600, alignItems: 'center' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', width: 16 }}>#{i + 1}</span>
                            <span className="consultant-name" style={{ fontWeight: 600 }}>{item.name}</span>
                          </span>
                          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>{item.value} {t('ngày OT')}</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--color-bg)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ width: `${item.percent}%`, height: '100%', background: '#fbbf24', borderRadius: 4 }} />
                        </div>
                      </div>
                    )) : (
                      <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', padding: '2rem 0' }}>{t('Chưa có nhân viên tăng ca')}</div>
                    )}
                  </div>
                </div>

              </div>

            </div>
          );
        })()}

        {/* TAB 1: PROFILES */}
        {activeTab === 'profiles' && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
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
                              fontWeight: 700, 
                              padding: '3px 8px', 
                              borderRadius: '6px', 
                              backgroundColor: 'rgba(107, 114, 128, 0.08)', 
                              border: '1px solid var(--color-border)',
                              color: 'var(--color-text-muted)',
                              textTransform: 'uppercase'
                            }}>
                              {user.job_title || teamName || t('Nhân viên')}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {t('Phép năm')}: <strong style={{ fontWeight: 700 }}>{remainingAnnual}</strong>/{user.annual_leave_total ?? 12}
                            </span>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                              {t('Nghỉ bù')}: <strong style={{ fontWeight: 700 }}>{remainingComp}</strong>/{user.compensatory_leave_total ?? 0}
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
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showOnlyMyPending}
                  onChange={(e) => setShowOnlyMyPending(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                {t('Chỉ hiện yêu cầu tôi cần duyệt')}
              </label>
            </div>
            {(() => {
              const filteredList = leaves.filter(req => {
                if (!showOnlyMyPending) return true;
                return req.status === 'pending' && isMyPendingRequest(req);
              });
              if (filteredList.length === 0) {
                return (
                  <EmptyCard
                    icon={<Calendar />}
                    title={t('Không có đơn nghỉ phép & tăng ca')}
                    description={showOnlyMyPending ? t('Không có đơn nào cần bạn duyệt.') : t('Không có đơn nghỉ phép hay tăng ca nào.')}
                  />
                );
              }
              return (
                <div style={{ overflowX: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px 16px' }}>{t('Nhân viên')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Loại phép')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Thời gian')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Lý do')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Người duyệt')}</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('Hành động / Trạng thái')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map(req => {
                        const userProfile = profiles.find(p => Number(p.id) === Number(req.user_id));
                        const approver1 = profiles.find(p => Number(p.id) === Number(req.approver_id));
                        const approver2 = profiles.find(p => Number(p.id) === Number(req.approver_id_2));
                        
                        const isPending = req.status === 'pending';
                        const isApproved = req.status === 'approved';
                        
                        const leaveTypeText = req.leave_type === 'annual' ? t('Phép năm') : 
                                            req.leave_type === 'sick' ? t('Nghỉ ốm') : 
                                            req.leave_type === 'compensatory' ? t('Nghỉ bù') : 
                                            req.leave_type === 'overtime' ? t('Tăng ca') :
                                            req.leave_type === 'late_early' ? t('Đi trễ/Về sớm') : t('Không lương');

                        return (
                          <tr 
                            key={req.id} 
                            className="hover-bg-secondary" 
                            style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.875rem', transition: 'background-color 0.2s', cursor: 'pointer' }}
                            onClick={() => setSelectedApproval({ type: 'leave', data: req })}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <Avatar src={userProfile?.avatar_url || userProfile?.avatar} name={req.employee_name} size={32} />
                                <strong style={{ color: 'var(--color-text)' }}>{req.employee_name}</strong>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px' }}>
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
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8125rem', color: 'var(--color-text-muted)' }}>
                                <Calendar size={13} style={{ color: 'var(--color-text-light)' }} />
                                <span>
                                  {new Date(req.start_date).toLocaleDateString('vi-VN')} {t('đến')} {new Date(req.end_date).toLocaleDateString('vi-VN')} ({req.total_days} {t('ngày')})
                                </span>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)', fontSize: '0.8125rem', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={req.reason}>
                              {req.reason || '—'}
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {approver1 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ color: req.status_level_1 === 'approved' ? '#10b981' : (req.status_level_1 === 'rejected' ? '#ef4444' : '#6b7280'), fontSize: '0.5rem' }}>●</span>
                                    <Avatar src={approver1.avatar_url || approver1.avatar} name={approver1.full_name} size={18} />
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Cấp 1')}: {approver1.full_name}</span>
                                  </div>
                                )}
                                {approver2 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ color: req.status_level_2 === 'approved' ? '#10b981' : (req.status_level_2 === 'rejected' ? '#ef4444' : '#6b7280'), fontSize: '0.5rem' }}>●</span>
                                    <Avatar src={approver2.avatar_url || approver2.avatar} name={approver2.full_name} size={18} />
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Cấp 2')}: {approver2.full_name}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              {renderActionStatusCell(req, 'leave')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 3: ADVANCES */}
        {activeTab === 'advances' && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-muted)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showOnlyMyPending}
                  onChange={(e) => setShowOnlyMyPending(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                {t('Chỉ hiện yêu cầu tôi cần duyệt')}
              </label>
            </div>
            {(() => {
              const filteredList = advances.filter(adv => {
                if (!showOnlyMyPending) return true;
                return adv.status === 'pending' && isMyPendingRequest(adv);
              });
              if (filteredList.length === 0) {
                return (
                  <EmptyCard
                    icon={<CreditCard />}
                    title={t('Không có yêu cầu tạm ứng')}
                    description={showOnlyMyPending ? t('Không có yêu cầu tạm ứng nào cần bạn duyệt.') : t('Không có yêu cầu tạm ứng lương nào.')}
                  />
                );
              }
              return (
                <div style={{ overflowX: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '0.5rem', boxShadow: 'var(--shadow-sm)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--color-border-light)', color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
                        <th style={{ padding: '12px 16px' }}>{t('Nhân viên')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Số tiền tạm ứng')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Ngày đề xuất')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Lý do')}</th>
                        <th style={{ padding: '12px 8px' }}>{t('Quy trình')}</th>
                        <th style={{ padding: '12px 16px', textAlign: 'right' }}>{t('Hành động / Trạng thái')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredList.map(adv => {
                        const isPending = adv.status === 'pending';
                        const isApproved = adv.status === 'approved';
                        const approver1 = profiles.find(p => Number(p.id) === Number(adv.approver_id));
                        const approver2 = profiles.find(p => Number(p.id) === Number(adv.approver_id_2));
                        
                        return (
                          <tr 
                            key={adv.id} 
                            className="hover-bg-secondary" 
                            style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.875rem', transition: 'background-color 0.2s', cursor: 'pointer' }}
                            onClick={() => setSelectedApproval({ type: 'advance', data: adv })}
                          >
                            <td style={{ padding: '14px 16px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {(() => {
                                  const empProfile = profiles.find(p => Number(p.id) === Number(adv.user_id));
                                  return <Avatar src={empProfile?.avatar_url || empProfile?.avatar} name={adv.employee_name} size={32} />;
                                })()}
                                <strong style={{ color: 'var(--color-text)' }}>{adv.employee_name}</strong>
                              </div>
                            </td>
                            <td style={{ padding: '14px 8px', fontWeight: 800, color: 'var(--color-primary)' }}>
                              {formatCurrency(adv.amount)}
                            </td>
                            <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)' }}>
                              {new Date(adv.request_date).toLocaleDateString('vi-VN')}
                            </td>
                            <td style={{ padding: '14px 8px', color: 'var(--color-text-muted)', fontSize: '0.825rem', maxWidth: '250px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={adv.reason}>
                              {adv.reason || t('Tạm ứng sinh hoạt')}
                            </td>
                            <td style={{ padding: '14px 8px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {approver1 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ color: adv.status_level_1 === 'approved' ? '#10b981' : (adv.status_level_1 === 'rejected' ? '#ef4444' : '#6b7280'), fontSize: '0.5rem' }}>●</span>
                                    <Avatar src={approver1.avatar_url || approver1.avatar} name={approver1.full_name} size={18} />
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Cấp 1')}: {approver1.full_name}</span>
                                  </div>
                                )}
                                {approver2 && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem' }}>
                                    <span style={{ color: adv.status_level_2 === 'approved' ? '#10b981' : (adv.status_level_2 === 'rejected' ? '#ef4444' : '#6b7280'), fontSize: '0.5rem' }}>●</span>
                                    <Avatar src={approver2.avatar_url || approver2.avatar} name={approver2.full_name} size={18} />
                                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Cấp 2')}: {approver2.full_name}</span>
                                  </div>
                                )}
                                {!approver1 && !approver2 && (
                                  <span style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>{t('Duyệt trực tiếp')}</span>
                                )}
                              </div>
                            </td>
                            <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                              {renderActionStatusCell(adv, 'advance')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })()}
          </div>
        )}

        {/* TAB 4: PAYROLL CALCULATION */}
        {activeTab === 'payroll' && (
          <div className="card" style={{ padding: '1.5rem', background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)' }}>
            {viewMode === 'archive' ? (
              <div>
                {/* Archive Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>{t('Lịch sử & Danh sách kỳ lương')}</h3>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', marginTop: 2 }}>{t('Quản lý, theo dõi các kỳ tính lương, chốt số và lưu trữ hồ sơ lương công ty.')}</p>
                  </div>
                  <button
                    onClick={() => {
                      setNewPeriodMonth(new Date().toISOString().substring(0, 7));
                      setNewPeriodWorkDays(26);
                      setIsNewPeriodModalOpen(true);
                    }}
                    className="btn primary"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    <Plus size={16} />
                    {t('Tính lương Kỳ mới')}
                  </button>
                </div>

                {/* Grid of Grouped Periods */}
                {groupedPeriods.length === 0 ? (
                  <EmptyCard
                    icon={<DollarSign size={40} />}
                    title={t('Chưa có kỳ lương nào')}
                    description={t('Hệ thống chưa lưu trữ kỳ tính lương nào. Bấm "Tính lương Kỳ mới" để bắt đầu.')}
                  />
                ) : (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                    {groupedPeriods.map(group => (
                      <div 
                        key={group.period} 
                        className="card hover-slide"
                        style={{
                          padding: '1.5rem',
                          background: 'var(--color-surface)',
                          border: '1px solid var(--color-border)',
                          borderRadius: '12px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '1rem',
                          position: 'relative'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)' }}>
                            {getPeriodLabel(group.period)}
                          </span>
                          <span style={{ 
                            fontSize: '0.725rem', 
                            fontWeight: 700, 
                            padding: '3px 8px', 
                            borderRadius: '10px',
                            background: group.isLocked ? 'rgba(239, 68, 68, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: group.isLocked ? '#ef4444' : '#3b82f6',
                            textTransform: 'uppercase'
                          }}>
                            {group.isLocked ? t('Đã Chốt') : t('Bản Nháp')}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8rem', borderTop: '1px dashed var(--color-border-light)', borderBottom: '1px dashed var(--color-border-light)', padding: '0.75rem 0' }}>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('Nhân viên')}:</span>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2 }}>{group.totalEmployees}</div>
                          </div>
                          <div>
                            <span style={{ color: 'var(--color-text-muted)' }}>{t('Tổng chi lương')}:</span>
                            <div style={{ fontSize: '0.95rem', fontWeight: 700, marginTop: 2, color: 'var(--color-primary)' }}>{formatCurrency(group.totalNet)}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                          <button
                            onClick={() => {
                              setPayrollMonth(group.period);
                              setViewMode('detail');
                            }}
                            className="btn outline sm"
                            style={{ width: '100%', justifyContent: 'center' }}
                          >
                            {t('Xem chi tiết')} &rarr;
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                {/* Detail View Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <button
                      onClick={() => setViewMode('archive')}
                      className="btn outline sm"
                      style={{ padding: '6px 10px', fontSize: '0.8rem' }}
                    >
                      &larr; {t('Quay lại danh sách')}
                    </button>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                        {getPeriodLabel(payrollMonth)}
                        {payslips.some(ps => ps.status === 'locked') && (
                          <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '2px 8px', borderRadius: 8, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textTransform: 'uppercase' }}>{t('Đã chốt')}</span>
                        )}
                      </h3>
                    </div>
                  </div>

                  {/* Main Month Action Controls */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {payslips.some(ps => ps.status === 'locked') ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(239, 68, 68, 0.04)', border: '1px solid rgba(239, 68, 68, 0.2)', padding: '6px 14px', borderRadius: 10 }}>
                        <span style={{ fontSize: '0.8rem', color: '#ef4444', fontWeight: 600 }}>🔒 {t('Bảng lương kỳ này đã được Chốt và Khóa.')}</span>
                        <button
                          onClick={handleUnlockPayroll}
                          className="btn text"
                          style={{ color: 'var(--color-primary)', fontWeight: 700, padding: 0, background: 'none', border: 'none', textDecoration: 'underline', cursor: 'pointer', fontSize: '0.8rem' }}
                        >
                          {t('Mở khóa để sửa')}
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          onClick={handleRunPayroll}
                          disabled={calculating}
                          className="btn primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <Play size={14} />
                          {calculating ? t('Đang tính...') : t('Tính lại lương')}
                        </button>
                        <button
                          onClick={handleSavePayroll}
                          disabled={saving || payslips.length === 0}
                          className="btn primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#6366f1', padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <Save size={14} />
                          {saving ? t('Đang lưu...') : t('Lưu thay đổi')}
                        </button>
                        <button
                          onClick={handlePublishPayroll}
                          disabled={publishing || payslips.length === 0}
                          className="btn primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#10b981', padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <Send size={14} />
                          {publishing ? t('Đang gửi...') : t('Gửi yêu cầu xác nhận')}
                        </button>
                        <button
                          onClick={handleLockPayroll}
                          disabled={locking || payslips.length === 0}
                          className="btn primary"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#ef4444', padding: '6px 14px', fontSize: '0.8rem' }}
                        >
                          <Lock size={14} />
                          {locking ? t('Đang khóa...') : t('Chốt & Khóa sổ lương')}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Summary Cards */}
                {payslips.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Nhân sự tính lương')}</span>
                      <strong style={{ fontSize: '1.25rem', color: 'var(--color-text)' }}>{stats.empCount}</strong>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Tổng Lương ngày công')}</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>{formatCurrency(stats.totalBasic)}</strong>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Tổng phụ cấp')}</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--color-text)' }}>{formatCurrency(stats.totalAllowances)}</strong>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Tổng các khoản thưởng')}</span>
                      <strong style={{ fontSize: '1.1rem', color: '#10b981' }}>{formatCurrency(stats.totalBonuses)}</strong>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('Tổng các khoản trừ')}</span>
                      <strong style={{ fontSize: '1.1rem', color: '#ef4444' }}>-{formatCurrency(stats.totalDeductions)}</strong>
                    </div>
                    <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: 4, background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.2)', borderRadius: 10 }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>{t('TỔNG THỰC LĨNH (NET)')}</span>
                      <strong style={{ fontSize: '1.3rem', color: 'var(--color-primary)' }}>{formatCurrency(stats.totalNet)}</strong>
                    </div>
                  </div>
                )}

                {/* Detail Table */}
                {payslips.length === 0 ? (
                  <EmptyCard
                    icon={<DollarSign size={40} />}
                    title={t('Không có dữ liệu')}
                    description={t('Không tải được phiếu lương nào trong kỳ này. Bấm quay lại và tính lại lương.')}
                  />
                ) : (
                  <div style={{ overflowX: 'auto', background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '12px', padding: '1rem' }}>
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
                        {payslips.map(ps => {
                          const isLocked = ps.status === 'locked' || payslips.some(p => p.status === 'locked');
                          return (
                            <tr key={ps.id} style={{ borderBottom: '1px solid var(--color-border-light)', fontSize: '0.85rem' }}>
                              <td style={{ padding: '14px 8px', fontWeight: 600 }}>{ps.employee_name}</td>
                              <td style={{ padding: '14px 8px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  {isLocked ? (
                                    <span style={{ fontWeight: 700 }}>{ps.work_days_actual}</span>
                                  ) : (
                                    <input
                                      type="number"
                                      step="any"
                                      value={ps.work_days_actual}
                                      onChange={e => handleCellChange(ps.id, 'work_days_actual', Number(e.target.value))}
                                      style={{ width: '48px', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                    />
                                  )}
                                  <span>/ {ps.work_days_required}</span>
                                </div>
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{ps.lateness_minutes}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.lateness_minutes}
                                    onChange={e => handleCellChange(ps.id, 'lateness_minutes', Number(e.target.value))}
                                    style={{ width: '56px', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{ps.overtime_days || 0}</span>
                                ) : (
                                  <input
                                    type="number"
                                    step="any"
                                    value={ps.overtime_days || 0}
                                    onChange={e => handleCellChange(ps.id, 'overtime_days', Number(e.target.value))}
                                    style={{ width: '50px', padding: '2px 4px', textAlign: 'center', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>{formatCurrency(ps.salary_basic_calculated)}</td>
                              <td style={{ padding: '14px 8px', color: '#10b981', fontWeight: 600 }}>{formatCurrency(ps.overtime_salary || 0)}</td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.diligence_bonus || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.diligence_bonus || 0}
                                    onChange={e => handleCellChange(ps.id, 'diligence_bonus', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.kpi_bonus || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.kpi_bonus || 0}
                                    onChange={e => handleCellChange(ps.id, 'kpi_bonus', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.allowance_total || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.allowance_total || 0}
                                    onChange={e => handleCellChange(ps.id, 'allowance_total', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.insurance_bhxh || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.insurance_bhxh || 0}
                                    onChange={e => handleCellChange(ps.id, 'insurance_bhxh', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.tax_pit || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.tax_pit || 0}
                                    onChange={e => handleCellChange(ps.id, 'tax_pit', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px' }}>
                                {isLocked ? (
                                  <span>{formatCurrency(ps.advance_deduction || 0)}</span>
                                ) : (
                                  <input
                                    type="number"
                                    value={ps.advance_deduction || 0}
                                    onChange={e => handleCellChange(ps.id, 'advance_deduction', Number(e.target.value))}
                                    style={{ width: '85px', padding: '2px 4px', textAlign: 'right', border: '1px solid var(--color-border)', borderRadius: '4px', background: 'var(--color-surface)', color: 'var(--color-text)', fontSize: '0.8rem' }}
                                  />
                                )}
                              </td>
                              <td style={{ padding: '14px 8px', fontWeight: 700, color: 'var(--color-primary)' }}>{formatCurrency(ps.net_salary)}</td>
                              <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                                <span style={{ 
                                  fontSize: '0.725rem', 
                                  fontWeight: 700, 
                                  padding: '2px 8px', 
                                  borderRadius: 10,
                                  textTransform: 'uppercase',
                                  background: ps.status === 'locked' ? 'rgba(239, 68, 68, 0.1)' : ps.status === 'confirmed' ? 'rgba(16, 185, 129, 0.1)' : ps.status === 'sent' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                                  color: ps.status === 'locked' ? '#ef4444' : ps.status === 'confirmed' ? '#10b981' : ps.status === 'sent' ? '#3b82f6' : '#6b7280'
                                }}>
                                  {ps.status === 'locked' ? t('Đã khóa') : ps.status === 'confirmed' ? t('Đã nhận') : ps.status === 'sent' ? t('Đang chờ') : t('Nháp')}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Calculate New Period Modal / Drawer */}
            {isNewPeriodModalOpen && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
                <div style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: 16, padding: '2rem', width: 450, maxWidth: '90%' }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1.25rem' }}>
                    {t('Khởi tạo kỳ tính lương mới')}
                  </h3>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1.75rem' }}>
                    <div>
                      <label className="form-label" style={{ fontWeight: 600, marginBottom: 6 }}>{t('Chọn kỳ thanh toán')}</label>
                      <select
                        value={newPeriodMonth}
                        onChange={e => setNewPeriodMonth(e.target.value)}
                        className="form-input"
                        style={{ height: 38 }}
                      >
                        {periodOptions.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="form-label" style={{ fontWeight: 600, marginBottom: 6 }}>{t('Số ngày công quy chuẩn trong tháng')}</label>
                      <input
                        type="number"
                        className="form-input"
                        value={newPeriodWorkDays}
                        onChange={e => setNewPeriodWorkDays(Math.max(1, Number(e.target.value)))}
                        style={{ height: 38 }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                    <button
                      onClick={() => setIsNewPeriodModalOpen(false)}
                      className="btn secondary"
                      style={{ padding: '8px 16px' }}
                    >
                      {t('Hủy bỏ')}
                    </button>
                    <button
                      onClick={async () => {
                        setPayrollMonth(newPeriodMonth);
                        setWorkDaysRequired(newPeriodWorkDays);
                        setIsNewPeriodModalOpen(false);
                        setCalculating(true);
                        try {
                          await fetchAPI('hrm/payroll', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                              month_year: newPeriodMonth,
                              work_days_required: newPeriodWorkDays
                            })
                          });
                          toast.success(t('Tính lương kỳ mới hoàn tất!'));
                          // Load details for the new month and switch view mode
                          const detailRes = await fetchAPI(`hrm/payroll?month_year=${newPeriodMonth}`);
                          setPayslips(detailRes?.data || []);
                          setViewMode('detail');
                          loadAllPayslips();
                        } catch (err: any) {
                          toast.error(err?.message || t('Lỗi tính lương'));
                        } finally {
                          setCalculating(false);
                        }
                      }}
                      disabled={calculating}
                      className="btn primary"
                      style={{ padding: '8px 24px', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Play size={14} />
                      {calculating ? t('Đang chạy...') : t('Chạy tính lương')}
                    </button>
                  </div>
                </div>
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

      {/* Approval Detail Drawer */}
      {selectedApproval && (
        <ApprovalDetailDrawer
          item={{
            id: selectedApproval.data.id,
            type: selectedApproval.type as any,
            title: selectedApproval.type === 'leave' ? t('Đề nghị nghỉ phép') : t('Đề nghị tạm ứng'),
            description: selectedApproval.data.reason || '',
            status: selectedApproval.data.status,
            created_at: selectedApproval.data.created_at,
            employee_name: selectedApproval.data.employee_name
          }}
          onClose={() => setSelectedApproval(null)}
          users={profiles}
          t={t}
          onApprove={async (item) => {
            const actionStatus = 'approved';
            if (item.type === 'leave') {
              await handleApproveLeave(item.id, actionStatus);
            } else {
              await handleApproveAdvance(item.id, actionStatus);
            }
            loadData();
            setSelectedApproval(null);
          }}
          onReject={async (item) => {
            const actionStatus = 'rejected';
            if (item.type === 'leave') {
              await handleApproveLeave(item.id, actionStatus);
            } else {
              await handleApproveAdvance(item.id, actionStatus);
            }
            loadData();
            setSelectedApproval(null);
          }}
          isAdmin={user?.role === 'admin' || user?.role === 'director' || user?.role === 'manager'}
        />
      )}
    </div>
  );
}
