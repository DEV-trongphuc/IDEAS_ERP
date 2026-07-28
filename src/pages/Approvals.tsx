import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAPI } from '../utils/api';
import api from '../api/axios';
import { 
  FileText, Calendar, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck, User, Clipboard, DollarSign, Activity, FileSpreadsheet, Plus,
  Search, Trash2, Paperclip, Send, AlertTriangle, Users, CreditCard, ShoppingCart, Award,
  HelpCircle, HardDrive, FileSignature, Receipt, Package, Briefcase, ChevronRight, CheckSquare, Server,
  FileCheck, Settings, ArrowLeft, X, Save, GitBranch, Clock3, Copy, Bell
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';
import { CustomSelect } from '../components/ui/CustomSelect';
import { MentionInput } from '../components/ui/MentionInput';
import { motion } from 'framer-motion';
import { Pagination } from '../components/ui/Pagination';

const workflowList = [
  { id: 'payment', name: 'Đề nghị thanh toán', description: 'Đề xuất thanh toán nhà cung cấp, chi phí vận hành, đối tác.', category: 'finance', icon: FileSignature, bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
  { id: 'advance_money', name: 'Đề nghị tạm ứng', description: 'Đề xuất tạm ứng chi phí công tác, mua hàng hoặc ứng lương.', category: 'finance', icon: DollarSign, bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
  { id: 'expense_claim', name: 'Đề xuất chi phí', description: 'Yêu cầu hoàn trả chi phí tiếp khách, đi lại, văn phòng phẩm.', category: 'finance', icon: Receipt, bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
  { id: 'client_meeting', name: 'Đề xuất tiếp khách', description: 'Chi phí tiếp đãi khách hàng, đối tác quan trọng.', category: 'finance', icon: Briefcase, bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' },
  { id: 'business_trip', name: 'Đăng ký công tác', description: 'Yêu cầu công tác, tạm ứng công tác phí và phương tiện.', category: 'finance', icon: Briefcase, bg: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' },
  { id: 'phased_payment', name: 'Thanh toán theo đợt', description: 'Đề xuất thanh toán chia nhiều đợt theo tiến độ hợp đồng.', category: 'finance', icon: GitBranch, bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },
  { id: 'recurring_payment', name: 'Thanh toán định kỳ', description: 'Đề xuất thanh toán định kỳ hàng tháng/quý (tiền nhà, internet, phí dịch vụ).', category: 'finance', icon: Clock3, bg: 'rgba(16, 185, 129, 0.08)', color: '#10b981' },

  { id: 'leave_late', name: 'Đề nghị nghỉ phép', description: 'Yêu cầu nghỉ phép năm, nghỉ việc riêng, nghỉ thai sản.', category: 'hr', icon: Calendar, bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' },
  { id: 'checkin_explain', name: 'Giải trình chấm công', description: 'Giải trình đi trễ, về sớm hoặc quên chấm công.', category: 'hr', icon: Clock, bg: 'rgba(236, 72, 153, 0.08)', color: '#ec4899' },
  { id: 'recruitment', name: 'Đề xuất tuyển dụng', description: 'Yêu cầu bổ sung nhân sự cho phòng ban.', category: 'hr', icon: Users, bg: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' },
  { id: 'salary_raise', name: 'Đề xuất tăng lương', description: 'Đề xuất điều chỉnh thu nhập cho nhân sự xuất sắc.', category: 'hr', icon: DollarSign, bg: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' },
  { id: 'resignation', name: 'Đơn xin nghỉ việc', description: 'Thủ tục xin thôi việc, bàn giao công việc.', category: 'hr', icon: FileText, bg: 'rgba(139, 92, 246, 0.08)', color: '#8b5cf6' },

  { id: 'purchase_request', name: 'Mua sắm trang thiết bị', description: 'Đề xuất mua sắm công cụ dụng cụ, thiết bị văn phòng.', category: 'admin', icon: ShoppingCart, bg: 'rgba(6, 182, 212, 0.08)', color: '#06b6d4' },
  { id: 'it_request', name: 'Cấp thiết bị IT', description: 'Yêu cầu cấp phát laptop, màn hình, tài khoản phần mềm.', category: 'admin', icon: Server, bg: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' },
  { id: 'meeting_room', name: 'Sử dụng phòng họp', description: 'Đăng ký phòng họp lớn, họp trực tuyến.', category: 'admin', icon: Users, bg: 'rgba(234, 179, 8, 0.08)', color: '#eab308' },
  { id: 'stationery', name: 'Đề xuất văn phòng phẩm', description: 'Yêu cầu cung cấp giấy in, bút, tài liệu văn phòng.', category: 'admin', icon: FileText, bg: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }
];

interface ApprovalItem {
  id: number;
  type: 'leave' | 'advance' | 'expense' | 'checkin';
  employee_name?: string;
  title: string;
  description: string;
  status?: string;
  created_at: string;
  updated_at?: string;
}

const GreenToggle = ({ checked, onChange, disabled, label, id }: { checked: boolean, onChange?: (val: boolean) => void, disabled?: boolean, label: string, id: string }) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '12px' }}>
      <label htmlFor={id} style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)', cursor: disabled ? 'default' : 'pointer' }}>
        {label}
      </label>
      <label style={{
        position: 'relative',
        display: 'inline-block',
        width: '38px',
        height: '20px',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0
      }}>
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={e => !disabled && onChange && onChange(e.target.checked)}
          style={{ opacity: 0, width: 0, height: 0 }}
          disabled={disabled}
        />
        <span style={{
          position: 'absolute',
          cursor: disabled ? 'not-allowed' : 'pointer',
          top: 0, left: 0, right: 0, bottom: 0,
          background: checked ? '#10b981' : '#cbd5e1',
          transition: '0.3s',
          borderRadius: '20px',
          opacity: disabled ? 0.7 : 1
        }}>
          <span style={{
            position: 'absolute',
            content: '""',
            height: '14px',
            width: '14px',
            left: checked ? '20px' : '3px',
            bottom: '3px',
            background: 'white',
            transition: '0.3s',
            borderRadius: '50%',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
          }} />
        </span>
      </label>
    </div>
  );
};



export default function Approvals() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const isMobile = window.innerWidth < 768;
  
  const isAdmin = ['admin', 'superadmin', 'super_admin', 'director', 'assistant', 'manager', 'hr'].includes(String(user?.role).toLowerCase());
  const [activeTab, setActiveTab] = useState<'pending' | 'my_requests'>(isAdmin ? 'pending' : 'my_requests');
  
  const [pendingList, setPendingList] = useState<ApprovalItem[]>([]);
  const [myRequestsList, setMyRequestsList] = useState<ApprovalItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ApprovalItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  
  // Custom states for timeline details and user listings
  const [users, setUsers] = useState<any[]>([]);
  const [selectedTimelineItem, setSelectedTimelineItem] = useState<ApprovalItem | null>(null);

  // Creation workflow states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWorkflowDef, setSelectedWorkflowDef] = useState<any>(null);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('all');
  const [directorySearch, setDirectorySearch] = useState('');

  const [recentWorkflows, setRecentWorkflows] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    const localKey = `recent_workflows_${user.id}`;
    let saved = [];
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) {
        saved = JSON.parse(stored);
      }
    } catch (e) {}

    // If local storage is empty, initialize it from myRequestsList
    if (saved.length === 0 && myRequestsList.length > 0) {
      const derivedIds: string[] = [];
      myRequestsList.forEach(item => {
        const found = workflowList.find(w => {
          if (item.type === 'leave' && w.id === 'leave_late') return true;
          if (item.type === 'advance' && w.id === 'advance_money') return true;
          if (item.type === 'checkin' && w.id === 'checkin_explain') return true;
          if (item.type === 'expense') {
            const cleanTitle = (item.title || '').replace('Yêu cầu chi phí: ', '').toLowerCase().trim();
            return w.name.toLowerCase().trim() === cleanTitle;
          }
          return false;
        });
        if (found && !derivedIds.includes(found.id)) {
          derivedIds.push(found.id);
        }
      });
      saved = derivedIds.slice(0, 6);
      if (saved.length > 0) {
        localStorage.setItem(localKey, JSON.stringify(saved));
      }
    }

    const matched = saved
      .map(id => workflowList.find(w => w.id === id))
      .filter(Boolean);
    setRecentWorkflows(matched);
  }, [myRequestsList, user]);

  const handleSelectWorkflow = (workflowId: string) => {
    if (!user) return;
    const localKey = `recent_workflows_${user.id}`;
    let saved = [];
    try {
      const stored = localStorage.getItem(localKey);
      if (stored) saved = JSON.parse(stored);
    } catch (e) {}

    const newSaved = [workflowId, ...saved.filter(id => id !== workflowId)].slice(0, 6);
    localStorage.setItem(localKey, JSON.stringify(newSaved));
    
    const matched = newSaved
      .map(id => workflowList.find(w => w.id === id))
      .filter(Boolean);
    setRecentWorkflows(matched);
  };

  // Form field states
  const [proposerUser, setProposerUser] = useState<any>(null);
  const [formType, setFormType] = useState<'leave' | 'advance' | 'expense' | 'general'>('expense');
  const [expenseTitle, setExpenseTitle] = useState('');
  const [jobPosition, setJobPosition] = useState('');
  const [departmentName, setDepartmentName] = useState('');
  const [teams, setTeams] = useState<any[]>([]);

  useEffect(() => {
    fetchAPI('teams').then(res => {
      if (res && res.success && Array.isArray(res.data)) {
        setTeams(res.data);
      }
    }).catch(() => {});
  }, []);
  const [paymentTarget, setPaymentTarget] = useState('Nội bộ');
  const [paymentMethod, setPaymentMethod] = useState('Chuyển khoản');
  const [paymentDetails, setPaymentDetails] = useState('');
  const [paymentDestination, setPaymentDestination] = useState('');
  const [currencyType, setCurrencyType] = useState('VND');
  const [leaveType, setLeaveType] = useState('Nghỉ phép năm');
  const [leaveReason, setLeaveReason] = useState('');
  const [leaveFrom, setLeaveFrom] = useState('');
  const [leaveTo, setLeaveTo] = useState('');
  
  // Table item state
  const [expenseItems, setExpenseItems] = useState<any[]>([
    { id: Date.now(), content: '', quantity: 1, price: 0, vat: 10 }
  ]);

  // Comment states for Creation Drawer
  const [createComments, setCreateComments] = useState<any[]>([]);
  const [newCreateComment, setNewCreateComment] = useState('');
  const [createCommentAttachments, setCreateCommentAttachments] = useState<any[]>([]);
  const [createUploadingFile, setCreateUploadingFile] = useState(false);

  // Phased payment states
  const [isPhasedPayment, setIsPhasedPayment] = useState(false);
  const [installments, setInstallments] = useState<any[]>([
    { id: Date.now(), title: 'Đợt 1', amount: 0, dueDate: '' }
  ]);

  // Recurring proposal states
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFrequency, setRecurringFrequency] = useState('monthly');
  const [recurringEndDate, setRecurringEndDate] = useState('');

  // Main list filters
  const [listSearchText, setListSearchText] = useState('');
  const [listCategoryFilter, setListCategoryFilter] = useState('all');
  const [listStatusFilter, setListStatusFilter] = useState('all');



  // Pagination states
  const [page, setPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    setPage(1);
  }, [activeTab, listSearchText, listCategoryFilter, listStatusFilter]);

  // CC list / related users state
  const [relatedUsers, setRelatedUsers] = useState<string[]>([]);
  const [attachments, setAttachments] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Approval step visibility overrides (can be deleted/excluded by user)
  const [showStepManager, setShowStepManager] = useState(true);
  const [showStepAccountant, setShowStepAccountant] = useState(true);
  const [showStepDirector, setShowStepDirector] = useState(true);

  // Timeline custom approver overrides
  const [customApprover1, setCustomApprover1] = useState<any>(null);
  const [customApprover2, setCustomApprover2] = useState<any>(null);
  const [customApprover3, setCustomApprover3] = useState<any>(null);
  const [activeSelectorStep, setActiveSelectorStep] = useState<string | null>(null);
  const [timelineSearchQuery, setTimelineSearchQuery] = useState('');

  // Initialize proposer user as current logged in user
  useEffect(() => {
    if (user && users.length > 0) {
      const found = users.find(u => Number(u.id) === Number(user.id));
      if (found) {
        setProposerUser(found);
        if (found.role) setJobPosition(found.role);
      }
    }
  }, [user, users]);

  // Set default steps whenever the form type changes
  useEffect(() => {
    if (formType === 'leave') {
      setShowStepManager(true);
      setShowStepAccountant(false);
      setShowStepDirector(false);
    } else if (formType === 'advance' || formType === 'general') {
      setShowStepManager(true);
      setShowStepAccountant(true);
      setShowStepDirector(false);
    } else {
      // expense
      setShowStepManager(true);
      setShowStepAccountant(true);
      setShowStepDirector(true);
    }
  }, [formType]);

  useEffect(() => {
    fetchAPI('users?all=1').then(res => {
      setUsers(res?.data || []);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (isAdmin) {
        const [pendingRes, myRequestsRes] = await Promise.all([
          fetchAPI('hrm/approvals/pending'),
          fetchAPI('hrm/approvals/my-requests')
        ]);
        setPendingList(pendingRes?.data || []);
        setMyRequestsList(myRequestsRes?.data || []);
      } else {
        const res = await fetchAPI('hrm/approvals/my-requests');
        setMyRequestsList(res?.data || []);
      }
    } catch (err: any) {
      toast.error(t('Lỗi tải dữ liệu quy trình'));
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (item: ApprovalItem) => {
    try {
      if (item.type === 'leave') {
        await fetchAPI('hrm/leaves', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, status: 'approved' })
        });
      } else if (item.type === 'advance') {
        await fetchAPI('hrm/advances', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: item.id, status: 'approved' })
        });
      } else if (item.type === 'expense') {
        await api.patch(`/expenses/${item.id}`, { status: 'approved' });
      } else if (item.type === 'checkin') {
        await api.put(`/check_ins/${item.id}`, { status: 'approved' });
      }
      toast.success(t('Đã phê duyệt yêu cầu thành công!'));
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khi phê duyệt'));
    }
  };

  const openRejectModal = (item: ApprovalItem) => {
    setSelectedItem(item);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleRejectSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!rejectReason.trim()) {
      toast.error(t('Vui lòng nhập lý do từ chối!'));
      return;
    }

    try {
      if (selectedItem.type === 'leave') {
        await fetchAPI('hrm/leaves', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedItem.id, status: 'rejected', reason: rejectReason })
        });
      } else if (selectedItem.type === 'advance') {
        await fetchAPI('hrm/advances', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedItem.id, status: 'rejected', reason: rejectReason })
        });
      } else if (selectedItem.type === 'expense') {
        await api.patch(`/expenses/${selectedItem.id}`, { status: 'rejected', reject_reason: rejectReason });
      } else if (selectedItem.type === 'checkin') {
        await api.put(`/check_ins/${selectedItem.id}`, { status: 'rejected', reason: rejectReason });
      }
      toast.success(t('Đã từ chối yêu cầu thành công!'));
      setRejectModalOpen(false);
      setSelectedItem(null);
      setSelectedTimelineItem(null);
      loadData();
    } catch (err: any) {
      toast.error(err?.message || t('Lỗi khi từ chối'));
    }
  };

  const handleDuplicate = (item: ApprovalItem) => {
    setSelectedTimelineItem(null);
    setSelectedItem(null);
    
    const matchingDef = workflowList.find(w => w.id === item.type) || workflowList[0];
    setSelectedWorkflowDef(matchingDef);
    
    if (item.type === 'leave') {
      setFormType('leave');
    } else if (item.type === 'advance') {
      setFormType('advance');
    } else if (matchingDef.category === 'finance' || item.type === 'expense') {
      setFormType('expense');
    } else {
      setFormType('general');
    }
    
    setExpenseTitle(`${t('Nhân bản')} - ${item.title}`);
    setPaymentDetails(item.description || '');
    
    setShowCreateModal(true);
    toast.success(t('Đã nhân bản thông tin đề xuất! Vui lòng kiểm tra và gửi.'));
  };

  const formatBadge = (status: string) => {
    const s = status ? status.toLowerCase() : 'pending';
    if (s === 'approved' || s === 'confirmed') {
      return (
        <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', textTransform: 'uppercase' }}>
          {t('Đã duyệt')}
        </span>
      );
    }
    if (s === 'level1_approved') {
      return (
        <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6', textTransform: 'uppercase' }}>
          {t('Đã duyệt Cấp 1')}
        </span>
      );
    }
    if (s === 'rejected' || s === 'failed') {
      return (
        <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', textTransform: 'uppercase' }}>
          {t('Từ chối')}
        </span>
      );
    }
    return (
      <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b', textTransform: 'uppercase' }}>
        {t('Chờ duyệt')}
      </span>
    );
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leave': return <Calendar size={16} style={{ color: '#3b82f6' }} />;
      case 'advance': return <DollarSign size={16} style={{ color: '#10b981' }} />;
      case 'expense': return <FileText size={16} style={{ color: '#f59e0b' }} />;
      case 'checkin': return <Clock size={16} style={{ color: '#ec4899' }} />;
      default: return <Clipboard size={16} />;
    }
  };

  const renderCurrentApprover = (item: ApprovalItem) => {
    let approverUser: any = null;

    if (item.type === 'leave' || item.type === 'advance') {
      const status1 = (item as any).status_level_1 || 'pending';
      const status2 = (item as any).status_level_2 || 'pending';
      
      const app1Id = (item as any).approver_id;
      const app2Id = (item as any).approver_id_2;
      const directorId = (item as any).director_id || '1001';

      if (status1 === 'pending') {
        approverUser = users.find(u => String(u.id) === String(app1Id));
        if (!approverUser) {
          approverUser = users.find(u => ['manager', 'director', 'admin', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()));
        }
      } else if (status1 === 'approved' && status2 === 'pending') {
        approverUser = users.find(u => String(u.id) === String(app2Id));
        if (!approverUser) {
          approverUser = users.find(u => ['accountant', 'admin', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()));
        }
      } else {
        approverUser = users.find(u => String(u.id) === String(directorId));
        if (!approverUser) {
          approverUser = users.find(u => ['director', 'admin', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()));
        }
      }
    } else if (item.type === 'expense') {
      const appId = (item as any).approver_id || '1003';
      approverUser = users.find(u => String(u.id) === String(appId));
      if (!approverUser) {
        approverUser = users.find(u => ['accountant', 'manager', 'director', 'admin', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()));
      }
    } else if (item.type === 'checkin') {
      approverUser = users.find(u => String(u.role).toLowerCase() === 'admin' || String(u.role).toLowerCase() === 'superadmin' || String(u.role).toLowerCase() === 'super_admin');
    }

    if (!approverUser) {
      approverUser = users.find(u => u.full_name || u.name);
    }

    if (!approverUser) {
      return (
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {t('Chờ duyệt')}
        </span>
      );
    }

    const avatarUrl = approverUser?.avatar_url || approverUser?.avatar;
    const displayName = approverUser?.full_name || approverUser?.name;

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Avatar src={avatarUrl} name={displayName} size={24} />
        <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {displayName}
        </span>
      </div>
    );
  };

  // Filter logic for main lists
  const filterList = (list: ApprovalItem[]) => {
    return list.filter(item => {
      const matchesSearch = listSearchText === '' ||
        (item.title && item.title.toLowerCase().includes(listSearchText.toLowerCase())) ||
        (item.description && item.description.toLowerCase().includes(listSearchText.toLowerCase()));
      
      const matchingDef = workflowList.find(w => w.id === item.type);
      const itemCategory = matchingDef ? matchingDef.category : 'finance';
      const matchesCategory = listCategoryFilter === 'all' || itemCategory === listCategoryFilter;
      
      const matchesStatus = listStatusFilter === 'all' || 
        (item.status || 'pending').toLowerCase() === listStatusFilter.toLowerCase();
      
      return matchesSearch && matchesCategory && matchesStatus;
    });
  };

  const filteredPendingList = filterList(pendingList);
  const filteredMyRequestsList = filterList(myRequestsList);

  return (
    <div>

      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">{t('Trung tâm Phê duyệt Quy trình (Workflow Hub)')}</h1>
          <p className="page-subtitle">{t('Quản lý tập trung các quy trình đề xuất nghỉ phép, tạm ứng lương, chi phí hành chính và giải trình đi trễ.')}</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn primary"
          style={{ display: 'flex', alignItems: 'center', gap: '6px', height: '38px', fontWeight: 700 }}
        >
          <Plus size={16} />
          {t('Tạo đề xuất')}
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '0.25rem', marginBottom: '1.5rem', background: 'var(--color-bg)', padding: '0.375rem', borderRadius: 'var(--radius-lg)', width: 'fit-content' }}>
        {isAdmin && (
          <button
            onClick={() => setActiveTab('pending')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 1.125rem',
              borderRadius: '8px',
              fontWeight: 600,
              fontSize: '0.875rem',
              background: activeTab === 'pending' ? 'var(--color-surface)' : 'transparent',
              color: activeTab === 'pending' ? 'var(--color-text)' : 'var(--color-text-light)',
              boxShadow: activeTab === 'pending' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            <Activity size={15} />
            {t('Yêu cầu chờ duyệt')}
            {pendingList.length > 0 && (
              <span style={{ fontSize: '0.725rem', background: '#ef4444', color: 'white', padding: '1px 6px', borderRadius: 99, fontWeight: 700, marginLeft: 4 }}>
                {pendingList.length}
              </span>
            )}
          </button>
        )}
        <button
          onClick={() => setActiveTab('my_requests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1.125rem',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.875rem',
            background: activeTab === 'my_requests' ? 'var(--color-surface)' : 'transparent',
            color: activeTab === 'my_requests' ? 'var(--color-text)' : 'var(--color-text-light)',
            boxShadow: activeTab === 'my_requests' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
            border: 'none',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          <User size={15} />
          {t('Yêu cầu của tôi')}
        </button>
      </div>

      {/* Search and Filters Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        background: 'var(--color-surface)',
        border: '1px solid var(--color-border-light)',
        borderRadius: '16px',
        padding: '1rem 1.25rem',
        marginBottom: '1.5rem',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
      }}>
        {/* Search Field */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', borderRadius: '8px', padding: '0 10px', height: '36px', width: isMobile ? '100%' : '300px' }}>
          <Search size={16} style={{ color: 'var(--color-text-muted)' }} />
          <input
            type="text"
            placeholder={t('Tìm kiếm đề xuất...')}
            value={listSearchText}
            onChange={e => setListSearchText(e.target.value)}
            style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '0.85rem', outline: 'none', color: 'var(--color-text)' }}
          />
          {listSearchText && (
            <button onClick={() => setListSearchText('')} style={{ border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <X size={14} style={{ color: 'var(--color-text-muted)' }} />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', width: isMobile ? '100%' : 'auto' }}>
          {/* Category Pills */}
          <div style={{ display: 'flex', gap: '6px', background: 'var(--color-bg-secondary)', padding: '4px', borderRadius: '8px' }}>
            {[
              { id: 'all', label: t('Tất cả') },
              { id: 'finance', label: t('Tài chính') },
              { id: 'hr', label: t('Nhân sự') },
              { id: 'admin', label: t('Hành chính') }
            ].map(cat => (
              <button
                key={cat.id}
                onClick={() => setListCategoryFilter(cat.id)}
                style={{
                  border: 'none',
                  background: listCategoryFilter === cat.id ? 'var(--color-surface)' : 'transparent',
                  color: listCategoryFilter === cat.id ? 'var(--color-primary)' : 'var(--color-text-muted)',
                  fontSize: '0.8rem',
                  fontWeight: listCategoryFilter === cat.id ? 700 : 500,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  boxShadow: listCategoryFilter === cat.id ? '0 1px 3px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease'
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Status Dropdown */}
          <div style={{ width: isMobile ? '100%' : '150px' }}>
            <CustomSelect
              value={listStatusFilter}
              onChange={val => setListStatusFilter(val)}
              options={[
                { value: 'all', label: t('Trạng thái: Tất cả') },
                { value: 'pending', label: t('Đang chờ duyệt') },
                { value: 'approved', label: t('Đã duyệt') },
                { value: 'rejected', label: t('Từ chối') }
              ]}
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          {t('Đang tải dữ liệu quy trình...')}
        </div>
      ) : activeTab === 'pending' && isAdmin ? (
        /* ADMIN PENDING LIST */
        filteredPendingList.length === 0 ? (
          <EmptyCard
            icon={<ShieldCheck />}
            title={t('Không có yêu cầu phê duyệt')}
            description={t('Không có yêu cầu phê duyệt nào đang chờ xử lý.')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="responsive-table-wrap" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '450px' }}>{t('Yêu cầu & Nội dung')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '220px' }}>{t('Người tạo & Thời gian')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '120px' }}>{t('Trạng thái')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '180px' }}>{t('Người duyệt')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', textAlign: 'right', minWidth: '150px' }}>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPendingList.slice((page - 1) * pageSize, page * pageSize).map(item => {
                    const deadline = (item as any).deadline || new Date(new Date(item.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN') + ' 17:00';
                    const reminder = (item as any).reminder_interval || (item.type === 'leave' ? t('Mỗi 4 giờ') : item.type === 'advance' ? t('Mỗi 2 giờ') : item.type === 'expense' ? t('Hằng ngày') : t('Mỗi 1 giờ'));
                    const related = (item as any).related_persons || (item.id % 2 === 0 ? ['Dev Admin', 'Dev Director'] : ['Dev Manager', 'Dev Accountant']);
                    const approver = (item as any).approver_name || (item.status === 'approved' ? 'Dev Admin' : t('Chờ duyệt'));

                    return (
                      <tr 
                        key={`${item.type}-${item.id}`} 
                        onClick={() => setSelectedTimelineItem(item)}
                        style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'var(--color-bg-secondary)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {getTypeIcon(item.type)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const creatorUser = users.find(u => String(u.full_name) === String(item.employee_name) || String(u.name) === String(item.employee_name));
                            const avatarUrl = creatorUser?.avatar_url || creatorUser?.avatar;
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar src={avatarUrl} name={item.employee_name} size={28} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600 }}>{item.employee_name}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {new Date(item.created_at).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {formatBadge(item.status || 'pending')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {renderCurrentApprover(item)}
                        </td>


                        <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button onClick={() => openRejectModal(item)} className="btn secondary" style={{ color: '#ef4444', borderColor: '#ef4444', padding: '4px 10px', fontSize: '0.75rem', height: '28px', borderRadius: '6px' }}>
                              <XCircle size={12} style={{ marginRight: 2 }} />
                              {t('Từ chối')}
                            </button>
                            <button onClick={() => handleApprove(item)} className="btn primary" style={{ background: '#10b981', borderColor: '#10b981', color: '#ffffff', padding: '4px 12px', fontSize: '0.75rem', height: '28px', borderRadius: '6px' }}>
                              <CheckCircle2 size={12} style={{ marginRight: 2 }} />
                              {t('Duyệt')}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            
            <Pagination 
              total={filteredPendingList.length}
              page={page}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
            />
          </div>
        )
      ) : (
        /* MY REQUESTS LIST */
        filteredMyRequestsList.length === 0 ? (
          <EmptyCard
            icon={<Clipboard />}
            title={t('Không tìm thấy yêu cầu')}
            description={t('Bạn chưa gửi yêu cầu quy trình nào.')}
          />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="responsive-table-wrap" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)', fontWeight: 700 }}>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '450px' }}>{t('Yêu cầu & Nội dung')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '220px' }}>{t('Người tạo & Thời gian')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '120px' }}>{t('Trạng thái')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', minWidth: '180px' }}>{t('Người duyệt')}</th>
                    <th style={{ padding: '14px 16px', fontSize: '0.8125rem', textAlign: 'right', minWidth: '150px' }}>{t('Thao tác')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMyRequestsList.slice((page - 1) * pageSize, page * pageSize).map(item => {
                    const deadline = (item as any).deadline || new Date(new Date(item.created_at).getTime() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('vi-VN') + ' 17:00';
                    const reminder = (item as any).reminder_interval || (item.type === 'leave' ? t('Mỗi 4 giờ') : item.type === 'advance' ? t('Mỗi 2 giờ') : item.type === 'expense' ? t('Hằng ngày') : t('Mỗi 1 giờ'));
                    const related = (item as any).related_persons || (item.id % 2 === 0 ? ['Dev Admin', 'Dev Director'] : ['Dev Manager', 'Dev Accountant']);
                    const approver = (item as any).approver_name || (item.status === 'approved' ? 'Dev Admin' : t('Chờ duyệt'));

                    return (
                      <tr 
                        key={`${item.type}-${item.id}`} 
                        onClick={() => setSelectedTimelineItem(item)}
                        style={{ borderBottom: '1px solid var(--color-border-light)', cursor: 'pointer', transition: 'background 0.2s' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--color-bg)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <div style={{
                              width: '32px', height: '32px', borderRadius: '8px',
                              background: 'var(--color-bg-secondary)', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', flexShrink: 0
                            }}>
                              {getTypeIcon(item.type)}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--color-text)' }}>{item.title}</div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {(() => {
                            const creatorUser = users.find(u => String(u.full_name) === String(item.employee_name || user?.name) || String(u.name) === String(item.employee_name || user?.name));
                            const avatarUrl = creatorUser?.avatar_url || creatorUser?.avatar;
                            return (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <Avatar src={avatarUrl} name={item.employee_name || user?.name} size={28} />
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                  <span style={{ fontWeight: 600 }}>{item.employee_name || user?.name}</span>
                                  <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '2px' }}>
                                    {new Date(item.created_at).toLocaleString('vi-VN')}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {formatBadge(item.status || 'pending')}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          {renderCurrentApprover(item)}
                        </td>


                        <td style={{ padding: '14px 16px', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button
                              onClick={() => handleDuplicate(item)}
                              className="btn secondary"
                              style={{
                                height: '28px',
                                width: '28px',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                borderRadius: '6px'
                              }}
                              title={t('Nhân bản')}
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pagination 
              total={filteredMyRequestsList.length}
              page={page}
              pageSize={pageSize}
              onChange={(p) => setPage(p)}
            />
          </div>
        )
      )}

      {/* Reject Modal */}
      {rejectModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '450px', padding: '1.5rem', background: 'var(--color-surface)' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '1rem', color: '#ef4444' }}>
              {t('Từ chối Yêu cầu')}
            </h3>
            <form onSubmit={handleRejectSubmit}>
              <p style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>
                {t('Vui lòng cung cấp lý do từ chối cho nhân viên:')}
              </p>
              <textarea
                className="form-input"
                style={{ height: 100, resize: 'none', marginBottom: '1.5rem' }}
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder={t('Ví dụ: Không hợp lệ hoặc thiếu chứng từ...')}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" onClick={() => setRejectModalOpen(false)} className="btn secondary">
                  {t('Hủy')}
                </button>
                <button type="submit" className="btn primary" style={{ background: '#ef4444', borderColor: '#ef4444' }}>
                  {t('Xác nhận từ chối')}
                </button>
              </div>
            </form>
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
          onApprove={handleApprove}
          onReject={openRejectModal}
          isAdmin={isAdmin && activeTab === 'pending'}
          onDuplicate={handleDuplicate}
        />
      )}

      {/* Creation and Directory Portals */}
      {showCreateModal && createPortal((() => {
        const filteredWorkflows = workflowList.filter(wf => {
          const matchesSearch = wf.name.toLowerCase().includes(directorySearch.toLowerCase()) || 
                                wf.description.toLowerCase().includes(directorySearch.toLowerCase());
          const matchesCategory = selectedCategoryFilter === 'all' || wf.category === selectedCategoryFilter;
          return matchesSearch && matchesCategory;
        });

        // Dynamic table calculations
        const itemsTotalBeforeTax = expenseItems.reduce((acc, it) => acc + (it.quantity * it.price), 0);
        const itemsTotalVat = expenseItems.reduce((acc, it) => acc + (it.quantity * it.price) * (it.vat / 100), 0);
        const itemsGrandTotal = itemsTotalBeforeTax + itemsTotalVat;

        // Custom template selection default timeline mapping
        const selectedTemplate = 'standard';
        
        let defaultApp1 = null;
        if (formType === 'leave') {
          defaultApp1 = users.find(u => String(u.id) === String(leaveFrom)); // Mock logic or manager
        }
        if (!defaultApp1) {
          defaultApp1 = users.find(u => ['manager', 'admin', 'director'].includes(String(u.role).toLowerCase()));
        }
        const app1User = customApprover1 || defaultApp1;
        const app1Name = app1User?.full_name || app1User?.name || t('Trưởng phòng phê duyệt');
        const app1Avatar = app1User?.avatar_url || app1User?.avatar;

        const defaultAccountant = users.find(u => String(u.role).toLowerCase() === 'accountant');
        const accountantUser = customApprover2 || defaultAccountant;
        const accountantName = accountantUser?.full_name || accountantUser?.name || t('Kế toán tổng hợp kiểm tra');
        const accountantAvatar = accountantUser?.avatar_url || accountantUser?.avatar;

        const defaultDirector = users.find(u => ['director', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()));
        const directorUser = customApprover3 || defaultDirector;
        const directorName = directorUser?.full_name || directorUser?.name || t('Ban giám đốc phê duyệt');
        const directorAvatar = directorUser?.avatar_url || directorUser?.avatar;

        return (
          <>
            <style>{`
              @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
              @keyframes zoomIn {
                from { opacity: 0; transform: scale(0.95); }
                to { opacity: 1; transform: scale(1); }
              }
            `}</style>
            {!selectedWorkflowDef ? (
              /* 1. POPUP MODE (Workflow template directory list - styled exactly like Menu điều hướng nhanh) */
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: 'rgba(15, 23, 42, 0.4)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                zIndex: 10000000,
                animation: 'fadeIn 0.2s ease-out',
                padding: '1rem'
              }} onClick={() => {
                setShowCreateModal(false);
                setSelectedWorkflowDef(null);
              }}>
                <div style={{
                  width: '900px',
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  background: 'var(--color-surface)',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  border: '1px solid var(--color-border)',
                  animation: 'zoomIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative'
                }} onClick={e => e.stopPropagation()}>
                  
                  {/* Modal Header */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--color-border-light)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    background: 'var(--color-surface)'
                  }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)' }}>
                      {t('Quy trình & Đề xuất vận hành')}
                    </h3>
                    <button className="hover-lift" onClick={() => {
                      setShowCreateModal(false);
                      setSelectedWorkflowDef(null);
                    }} style={{
                      background: 'var(--color-bg)',
                      border: '1px solid var(--color-border)',
                      padding: '6px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: '32px',
                      width: '32px'
                    }}>
                      <X size={16} />
                    </button>
                  </div>

                  {/* Body - Grouped list like Menu điều hướng nhanh */}
                  <div className="custom-scrollbar" style={{
                    flex: 1,
                    padding: '1.5rem 2rem 2.5rem 2rem',
                    overflowY: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '2rem',
                    background: 'var(--color-surface)'
                  }}>
                    
                    
                    {/* Category: QUY TRÌNH GẦN ĐÂY */}
                    {recentWorkflows.length > 0 && (
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                            ⚡ {t('Quy trình gần đây')}
                          </span>
                          <div style={{ flex: 1, height: '1px', background: 'var(--color-primary-light, rgba(163, 20, 34, 0.1))' }} />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                          {recentWorkflows.map(item => {
                            const IconComp = item.icon;
                            return (
                              <div
                                key={`recent-${item.id}`}
                                onClick={() => {
                                  setSelectedWorkflowDef(item);
                                  if (item.id === 'leave_late') setFormType('leave');
                                  else if (item.id === 'advance_money') setFormType('advance');
                                  else setFormType('general');
                                  setExpenseTitle(item.name);
                                  handleSelectWorkflow(item.id);
                                }}
                                style={{
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '12px',
                                  padding: '10px',
                                  borderRadius: '12px',
                                  cursor: 'pointer',
                                  transition: 'all 0.2s',
                                  background: 'transparent',
                                  border: 'none'
                                }}
                                onMouseEnter={e => {
                                  e.currentTarget.style.background = 'var(--color-bg)';
                                }}
                                onMouseLeave={e => {
                                  e.currentTarget.style.background = 'transparent';
                                }}
                              >
                                <div style={{
                                  width: '38px',
                                  height: '38px',
                                  borderRadius: '50%',
                                  background: item.color,
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}>
                                  <IconComp size={16} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>{item.name}</strong>
                                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.description}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Category: TÀI CHÍNH & KẾ TOÁN */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                          {t('Tài chính & Kế toán')}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        {workflowList.filter(w => w.category === 'finance').map(item => {
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedWorkflowDef(item);
                                setFormType(item.id === 'advance_money' ? 'advance' : 'expense');
                                setExpenseTitle(item.name);
                                handleSelectWorkflow(item.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                border: 'none',
                                background: 'transparent'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-bg)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: item.color,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <IconComp size={16} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>{item.name}</strong>
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.4 }}>{item.description}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category: NHÂN SỰ & QUY TRÌNH */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                          {t('Nhân sự & Quy trình')}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        {workflowList.filter(w => w.category === 'hr').map(item => {
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedWorkflowDef(item);
                                setFormType(item.id === 'leave_late' ? 'leave' : 'general');
                                setExpenseTitle(item.name);
                                handleSelectWorkflow(item.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                border: 'none',
                                background: 'transparent'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-bg)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: item.color,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <IconComp size={16} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>{item.name}</strong>
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.4 }}>{item.description}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Category: HÀNH CHÍNH & TÀI SẢN */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '1.25rem' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', whiteSpace: 'nowrap' }}>
                          {t('Hành chính & Thiết bị')}
                        </span>
                        <div style={{ flex: 1, height: '1px', background: 'var(--color-border-light)' }} />
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1.25rem' }}>
                        {workflowList.filter(w => w.category === 'admin').map(item => {
                          const IconComp = item.icon;
                          return (
                            <div
                              key={item.id}
                              onClick={() => {
                                setSelectedWorkflowDef(item);
                                setFormType('general');
                                setExpenseTitle(item.name);
                                handleSelectWorkflow(item.id);
                              }}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '12px',
                                padding: '12px',
                                borderRadius: '12px',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease-in-out',
                                border: 'none',
                                background: 'transparent'
                              }}
                              onMouseEnter={e => {
                                e.currentTarget.style.background = 'var(--color-bg)';
                              }}
                              onMouseLeave={e => {
                                e.currentTarget.style.background = 'transparent';
                              }}
                            >
                              <div style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: item.color,
                                color: '#ffffff',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexShrink: 0
                              }}>
                                <IconComp size={16} />
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <strong style={{ fontSize: '0.85rem', color: 'var(--color-text)', display: 'block', marginBottom: '2px', fontWeight: 700 }}>{item.name}</strong>
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', lineHeight: 1.4 }}>{item.description}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                  </div>

                </div>
              </div>
            ) : (
              /* 2. DETAILED CREATION DRAWER MODE (Workspace Form edit mode) - aligned next to sidebar exactly like WorkspaceTaskDrawer */
              <>
                <motion.div
                  className="drawer-backdrop"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  onClick={() => {
                    setShowCreateModal(false);
                    setSelectedWorkflowDef(null);
                  }}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 10000000
                  }}
                />

                <motion.div
                  initial={{ x: '100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  style={{
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: isMobile ? 0 : 'var(--sidebar-width, 220px)',
                    right: 0,
                    background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-border-light) 100%)',
                    boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
                    display: 'flex',
                    flexDirection: 'column',
                    boxSizing: 'border-box',
                    borderTopLeftRadius: 0,
                    borderBottomLeftRadius: 0,
                    overflow: 'hidden',
                    zIndex: 10000100
                  }}
                >
                  
                  {/* Drawer Header styled EXACTLY like WorkspaceTaskDrawer */}
                  <div style={{
                    padding: '1.25rem 1.5rem',
                    borderBottom: '1px solid var(--color-border-light)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    background: 'var(--color-surface)',
                    zIndex: 100,
                    position: 'sticky',
                    top: 0,
                    flexShrink: 0
                  }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: '40px',
                        height: '40px',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'rgba(163, 20, 34, 0.08)',
                        color: 'var(--color-primary)',
                        flexShrink: 0
                      }}>
                        <FileSignature size={20} />
                      </div>
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--color-text)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{selectedWorkflowDef.name}</span>
                          <span className="badge warning" style={{ fontSize: '0.6rem', fontWeight: 800, padding: '1px 6px', borderRadius: '4px', textTransform: 'uppercase', flexShrink: 0 }}>
                            {t('MỚI')}
                          </span>
                        </h3>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                          <span>{t('Thiết lập quy trình đề xuất vận hành mới')}</span>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0 }}>
                      <button 
                        type="button" 
                        onClick={() => setSelectedWorkflowDef(null)}
                        className="hover-lift"
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          height: '36px',
                          fontSize: '0.85rem',
                          fontWeight: 700
                        }}
                      >
                        <ArrowLeft size={16} />
                        <span>{t('Quay lại')}</span>
                      </button>

                      <button 
                        type="button" 
                        onClick={async () => {
                          setSubmitting(true);
                          try {
                            // Resolve the last active step in the approval chain as finalApproverId
                            let finalApproverId = 1003;
                            if (showStepDirector) {
                              finalApproverId = customApprover3?.id || users.find(u => ['director', 'superadmin', 'super_admin'].includes(String(u.role).toLowerCase()))?.id || 1003;
                            } else if (showStepAccountant) {
                              finalApproverId = customApprover2?.id || users.find(u => String(u.role).toLowerCase() === 'accountant')?.id || 1003;
                            } else if (showStepManager) {
                              finalApproverId = customApprover1?.id || users.find(u => ['manager', 'admin', 'director'].includes(String(u.role).toLowerCase()))?.id || 1003;
                            } else {
                              finalApproverId = proposerUser?.id || 1003;
                            }

                            if (formType === 'leave') {
                              let leaveReasonStr = leaveReason;
                              if (isRecurring) {
                                leaveReasonStr += ` [Lặp lại định kỳ: ${recurringFrequency} - Hạn: ${recurringEndDate || 'Vô thời hạn'}]`;
                              }
                              await fetchAPI('hrm/leaves', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  leave_type: leaveType,
                                  reason: leaveReasonStr,
                                  from_date: leaveFrom,
                                  to_date: leaveTo,
                                  approver_id: finalApproverId
                                })
                              });
                            } else if (formType === 'advance') {
                              let advReasonStr = leaveReason || 'Tạm ứng';
                              if (isRecurring) {
                                advReasonStr += ` [Lặp lại định kỳ: ${recurringFrequency} - Hạn: ${recurringEndDate || 'Vô thời hạn'}]`;
                              }
                              await fetchAPI('hrm/advances', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                  amount: Number(paymentDetails) || 0,
                                  reason: advReasonStr,
                                  approver_id: finalApproverId
                                })
                              });
                            } else if (formType === 'general') {
                              let generalDesc = `Vị trí: ${jobPosition}\nPhòng ban: ${departmentName}\nNội dung đề xuất: ${paymentDetails}\nLý do: ${leaveReason}`;
                              if (isRecurring) {
                                generalDesc += `\n[Lặp lại định kỳ]: Tần suất ${recurringFrequency} (Kết thúc: ${recurringEndDate || 'Vô thời hạn'})`;
                              }
                              await api.post('/expenses', {
                                title: expenseTitle || selectedWorkflowDef.name,
                                description: generalDesc,
                                notes: generalDesc,
                                amount: 0,
                                status: 'pending',
                                approver_id: finalApproverId
                              });
                            } else {
                              let finalDesc = `Vị trí: ${jobPosition}\nPhòng ban: ${departmentName}\nĐối tượng: ${paymentTarget}\nHình thức: ${paymentMethod}\nThông tin: ${paymentDestination}\nChi tiết: ${paymentDetails}`;
                              if (isPhasedPayment) {
                                const instStr = installments.map(i => `${i.title}: ${Number(i.amount).toLocaleString()}đ (Hạn: ${i.dueDate || 'Chưa chọn'})`).join('; ');
                                finalDesc += `\n[Thanh toán theo đợt]: ${instStr}`;
                              }
                              if (isRecurring) {
                                finalDesc += `\n[Lặp lại định kỳ]: Tần suất ${recurringFrequency} (Kết thúc: ${recurringEndDate || 'Vô thời hạn'})`;
                              }
                              await api.post('/expenses', {
                                title: expenseTitle || selectedWorkflowDef.name,
                                description: finalDesc,
                                notes: finalDesc,
                                amount: expenseItems.reduce((acc, it) => acc + (it.quantity * it.price) * (1 + it.vat / 100), 0),
                                status: 'pending',
                                approver_id: finalApproverId
                              });
                            }
                            toast.success(t('Gửi đề xuất thành công!'));
                            setShowCreateModal(false);
                            setSelectedWorkflowDef(null);
                            loadData();
                          } catch (err: any) {
                            toast.error(err?.message || t('Lỗi gửi đề xuất'));
                          } finally {
                            setSubmitting(false);
                          }
                        }}
                        disabled={submitting}
                        className="btn primary"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          padding: '8px 18px',
                          borderRadius: '8px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          height: '36px',
                          background: 'var(--color-primary)',
                          borderColor: 'var(--color-primary)',
                          color: 'white',
                          cursor: 'pointer',
                          boxShadow: 'var(--shadow-sm)',
                          transition: 'all 0.2s'
                        }}
                      >
                        <Save size={16} />
                        <span>{t('Gửi đề xuất')}</span>
                      </button>

                      <button 
                        onClick={() => {
                          setShowCreateModal(false);
                          setSelectedWorkflowDef(null);
                        }} 
                        className="hover-lift"
                        style={{
                          background: 'var(--color-bg)',
                          border: '1px solid var(--color-border)',
                          padding: '8px',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          color: 'var(--color-text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          height: '36px',
                          width: '36px'
                        }}
                      >
                        <X size={18} />
                      </button>
                    </div>
                  </div>

                  {/* Drawer Content */}
                  <div className="custom-scrollbar" style={{
                    flex: 1,
                    overflowY: 'auto',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: isMobile ? 'column' : 'row',
                    gap: '1.5rem'
                  }}>
                    
                    {/* LEFT COLUMN: Form Elements (70%) */}
                    <div style={{ flex: isMobile ? 'none' : 7, display: 'flex', flexDirection: 'column', gap: '1.25rem', minWidth: 0 }}>
                      
                      {/* Card 1: Người đề xuất */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('Người đề xuất')}
                        </div>
                        <CustomSelect
                          options={users.map(u => ({
                            value: String(u.id),
                            label: `${u.full_name || u.name} (${u.role || 'Nhân sự'})`,
                            avatar: u.avatar || u.avatar_url
                          }))}
                          value={proposerUser ? String(proposerUser.id) : ''}
                          onChange={val => {
                            const selected = users.find(u => String(u.id) === String(val));
                            if (selected) {
                              setProposerUser(selected);
                              if (selected.role) setJobPosition(selected.role);
                            }
                          }}
                          placeholder={t('Tìm kiếm nhân sự đề xuất...')}
                          searchable
                          showAvatars
                          width="100%"
                        />
                      </div>

                      {/* Card 2: Specialized fields details based on workflow type */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
                          {t('Thông tin chi tiết đề xuất')}
                        </div>
                        
                        {formType === 'leave' ? (
                          /* LEAVE FORM FIELDS */
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Loại nghỉ phép')}</label>
                              <CustomSelect
                                value={leaveType}
                                onChange={val => setLeaveType(val)}
                                options={[
                                  { value: 'Nghỉ phép năm', label: t('Nghỉ phép năm') },
                                  { value: 'Nghỉ việc riêng', label: t('Nghỉ việc riêng (không lương)') },
                                  { value: 'Nghỉ ốm / thai sản', label: t('Nghỉ ốm / thai sản') }
                                ]}
                                width="100%"
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Lý do xin nghỉ')}</label>
                              <input
                                type="text"
                                className="form-input"
                                value={leaveReason}
                                onChange={e => setLeaveReason(e.target.value)}
                                placeholder={t('Lý do chi tiết...')}
                                style={{ height: '36px', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Từ ngày')}</label>
                              <input
                                type="datetime-local"
                                className="form-input"
                                value={leaveFrom}
                                onChange={e => setLeaveFrom(e.target.value)}
                                style={{ height: '36px', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Đến ngày')}</label>
                              <input
                                type="datetime-local"
                                className="form-input"
                                value={leaveTo}
                                onChange={e => setLeaveTo(e.target.value)}
                                style={{ height: '36px', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                          </div>
                        ) : formType === 'advance' ? (
                          /* SALARY ADVANCE FORM FIELDS */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Số tiền tạm ứng')}</label>
                                <input
                                  type="number"
                                  className="form-input"
                                  value={paymentDetails}
                                  onChange={e => setPaymentDetails(e.target.value)}
                                  placeholder={t('Ví dụ: 5000000')}
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Loại tiền tệ')}</label>
                                <CustomSelect
                                  value={currencyType}
                                  onChange={val => setCurrencyType(val)}
                                  options={[
                                    { value: 'VND', label: 'VND' },
                                    { value: 'USD', label: 'USD' }
                                  ]}
                                  width="100%"
                                />
                              </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Lý do tạm ứng')}</label>
                              <input
                                type="text"
                                className="form-input"
                                value={leaveReason}
                                onChange={e => setLeaveReason(e.target.value)}
                                placeholder={t('Mục đích tạm ứng chi tiết...')}
                                style={{ height: '36px', fontSize: '0.8rem' }}
                                required
                              />
                            </div>
                          </div>
                        ) : formType === 'general' ? (
                          /* GENERAL / OPERATIONAL FORM FIELDS */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Tiêu đề đề xuất')}</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={expenseTitle}
                                  onChange={e => setExpenseTitle(e.target.value)}
                                  placeholder={t('Ví dụ: Giải trình chấm công ngày 25/07')}
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Bộ phận / Phòng ban')}</label>
                                <CustomSelect
                                  value={departmentName}
                                  onChange={val => setDepartmentName(val)}
                                  options={teams.length > 0 ? teams.map(t => ({
                                    value: t.name,
                                    label: t.name
                                  })) : [
                                    { value: 'Ban Giám đốc', label: t('Ban Giám đốc') },
                                    { value: 'Phòng Kinh doanh', label: t('Phòng Kinh doanh (Sales)') },
                                    { value: 'Phòng Marketing', label: t('Phòng Marketing') },
                                    { value: 'Phòng Kế toán', label: t('Phòng Kế toán - Tài chính') },
                                    { value: 'Phòng Nhân sự', label: t('Phòng Nhân sự (HR)') },
                                    { value: 'Phòng IT', label: t('Phòng IT / Kỹ thuật') },
                                    { value: 'Bộ phận Vận hành', label: t('Bộ phận Vận hành') }
                                  ]}
                                  placeholder={t('Chọn phòng ban / bộ phận...')}
                                  width="100%"
                                />
                              </div>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Nội dung đề xuất / Giải trình chi tiết')}</label>
                              <textarea
                                className="form-input"
                                value={paymentDetails}
                                onChange={e => setPaymentDetails(e.target.value)}
                                placeholder={t('Nhập nội dung giải trình hoặc đề xuất chi tiết...')}
                                style={{ minHeight: '100px', fontSize: '0.8rem', padding: '8px', resize: 'vertical' }}
                                required
                              />
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Lý do & Ý kiến đề xuất')}</label>
                              <input
                                type="text"
                                className="form-input"
                                value={leaveReason}
                                onChange={e => setLeaveReason(e.target.value)}
                                placeholder={t('Lý do đề xuất (nếu có)...')}
                                style={{ height: '36px', fontSize: '0.8rem' }}
                              />
                            </div>
                          </div>
                        ) : (
                          /* EXPENSE AND PAYMENT FORM FIELDS */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Tiêu đề đề xuất')}</label>
                                <input
                                  type="text"
                                  className="form-input"
                                  value={expenseTitle}
                                  onChange={e => setExpenseTitle(e.target.value)}
                                  placeholder={t('Ví dụ: Đề nghị thanh toán tiền điện tháng 07')}
                                  style={{ height: '36px', fontSize: '0.8rem' }}
                                  required
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Bộ phận / Phòng ban')}</label>
                                <CustomSelect
                                  value={departmentName}
                                  onChange={val => setDepartmentName(val)}
                                  options={teams.length > 0 ? teams.map(t => ({
                                    value: t.name,
                                    label: t.name
                                  })) : [
                                    { value: 'Ban Giám đốc', label: t('Ban Giám đốc') },
                                    { value: 'Phòng Kinh doanh', label: t('Phòng Kinh doanh (Sales)') },
                                    { value: 'Phòng Marketing', label: t('Phòng Marketing') },
                                    { value: 'Phòng Kế toán', label: t('Phòng Kế toán - Tài chính') },
                                    { value: 'Phòng Nhân sự', label: t('Phòng Nhân sự (HR)') },
                                    { value: 'Phòng IT', label: t('Phòng IT / Kỹ thuật') },
                                    { value: 'Bộ phận Vận hành', label: t('Bộ phận Vận hành') }
                                  ]}
                                  placeholder={t('Chọn phòng ban / bộ phận...')}
                                  width="100%"
                                />
                              </div>
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Đối tượng thanh toán')}</label>
                                <CustomSelect
                                  value={paymentTarget}
                                  onChange={val => setPaymentTarget(val)}
                                  options={[
                                    { value: 'Nội bộ', label: t('Nội bộ') },
                                    { value: 'Khách hàng', label: t('Khách hàng') },
                                    { value: 'Đối tác', label: t('Đối tác / Vendor') }
                                  ]}
                                  width="100%"
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Hình thức nhận tiền')}</label>
                                <CustomSelect
                                  value={paymentMethod}
                                  onChange={val => setPaymentMethod(val)}
                                  options={[
                                    { value: 'Chuyển khoản', label: t('Chuyển khoản') },
                                    { value: 'Tiền mặt', label: t('Tiền mặt') }
                                  ]}
                                  width="100%"
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Loại tiền tệ')}</label>
                                <CustomSelect
                                  value={currencyType}
                                  onChange={val => setCurrencyType(val)}
                                  options={[
                                    { value: 'VND', label: 'VND' },
                                    { value: 'USD', label: 'USD' }
                                  ]}
                                  width="100%"
                                />
                              </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Mục đích & Nội dung thanh toán')}</label>
                                <textarea
                                  className="form-input"
                                  value={paymentDetails}
                                  onChange={e => setPaymentDetails(e.target.value)}
                                  placeholder={t('Giải trình chi tiết mục đích chi tiêu...')}
                                  style={{ height: '70px', resize: 'none', fontSize: '0.8rem', padding: '8px' }}
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Thông tin người thụ hưởng')}</label>
                                <textarea
                                  className="form-input"
                                  value={paymentDestination}
                                  onChange={e => setPaymentDestination(e.target.value)}
                                  placeholder={t('Số tài khoản, Tên chủ tài khoản, Tên ngân hàng...')}
                                  style={{ height: '70px', resize: 'none', fontSize: '0.8rem', padding: '8px' }}
                                />
                              </div>
                            </div>
                          </div>
                        )}
                        {/* 1. Phased payment settings (only for finance/expense) */}
                        {formType === 'expense' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-border-light)', paddingTop: '12px', marginTop: '12px' }}>
                             <GreenToggle
                               id="isPhasedPayment"
                               checked={isPhasedPayment}
                               onChange={setIsPhasedPayment}
                               label={t('Thanh toán chia nhiều đợt (Installment/Phased Payment)')}
                             />

                            {isPhasedPayment && (
                              <div style={{ marginTop: '8px', border: '1px solid var(--color-border-light)', borderRadius: '12px', padding: '1.25rem', background: 'var(--color-bg-secondary)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {t('Danh sách đợt thanh toán')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => setInstallments([...installments, { id: Date.now(), title: `Đợt ${installments.length + 1}`, amount: 0, dueDate: '' }])}
                                    className="btn secondary"
                                    style={{ height: '26px', padding: '0 8px', fontSize: '0.7rem', color: 'var(--color-primary)' }}
                                  >
                                    + {t('Thêm đợt')}
                                  </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                  {installments.map((inst, index) => (
                                    <div key={inst.id} style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1.5fr 1.5fr 1.5fr auto', gap: '10px', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          value={inst.title}
                                          onChange={e => {
                                            const list = [...installments];
                                            list[index].title = e.target.value;
                                            setInstallments(list);
                                          }}
                                          placeholder={t('Tên đợt (ví dụ: Đợt 1)')}
                                          style={{ height: '32px', fontSize: '0.75rem' }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                          type="number"
                                          className="form-input"
                                          value={inst.amount === 0 ? '' : inst.amount}
                                          onChange={e => {
                                            const list = [...installments];
                                            list[index].amount = Number(e.target.value);
                                            setInstallments(list);
                                          }}
                                          placeholder={t('Số tiền (VND)')}
                                          style={{ height: '32px', fontSize: '0.75rem' }}
                                        />
                                      </div>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <input
                                          type="date"
                                          className="form-input"
                                          value={inst.dueDate}
                                          onChange={e => {
                                            const list = [...installments];
                                            list[index].dueDate = e.target.value;
                                            setInstallments(list);
                                          }}
                                          style={{ height: '32px', fontSize: '0.75rem' }}
                                        />
                                      </div>
                                      {installments.length > 1 && (
                                        <button
                                          type="button"
                                          onClick={() => setInstallments(installments.filter(x => x.id !== inst.id))}
                                          style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem', padding: '4px' }}
                                        >
                                          {t('Xóa')}
                                        </button>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* 2. Recurring settings (for all workflows) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px dashed var(--color-border-light)', paddingTop: '12px', marginTop: '12px' }}>
                           <GreenToggle
                             id="isRecurring"
                             checked={isRecurring}
                             onChange={setIsRecurring}
                             label={t('Thiết lập lặp lại tự động (Recurring Proposal)')}
                           />

                          {isRecurring && (
                            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem', marginTop: '8px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-bg-secondary)' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Tần suất lặp lại')}</label>
                                <CustomSelect
                                  value={recurringFrequency}
                                  onChange={val => setRecurringFrequency(val)}
                                  options={[
                                    { value: 'daily', label: t('Hàng ngày') },
                                    { value: 'weekly', label: t('Hàng tuần') },
                                    { value: 'monthly', label: t('Hàng tháng') },
                                    { value: 'quarterly', label: t('Hàng quý') },
                                    { value: 'yearly', label: t('Hàng năm') }
                                  ]}
                                  width="100%"
                                />
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Ngày kết thúc lặp lại')}</label>
                                <input
                                  type="date"
                                  className="form-input"
                                  value={recurringEndDate}
                                  onChange={e => setRecurringEndDate(e.target.value)}
                                  style={{ height: '32px', fontSize: '0.75rem' }}
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Card 3: Bảng chi tiết thanh toán (only for expense/payment) */}
                      {formType === 'expense' && (
                        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              {t('Bảng chi tiết thanh toán')}
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseItems([
                                  ...expenseItems,
                                  { id: Date.now(), content: '', quantity: 1, price: 0, vat: 10 }
                                ]);
                              }}
                              className="btn secondary"
                              style={{ height: '28px', padding: '0 10px', fontSize: '0.75rem', color: 'var(--color-primary)' }}
                            >
                              + {t('Thêm dòng')}
                            </button>
                          </div>

                          <div style={{ overflowX: 'auto', border: '1px solid var(--color-border)', borderRadius: '8px' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                              <thead>
                                <tr style={{ background: 'var(--color-bg-secondary)', borderBottom: '1px solid var(--color-border)' }}>
                                  <th style={{ padding: '8px', width: '40px', fontWeight: 700 }}>STT</th>
                                  <th style={{ padding: '8px', fontWeight: 700 }}>{t('Nội dung chi')}</th>
                                  <th style={{ padding: '8px', width: '70px', fontWeight: 700 }}>{t('SL')}</th>
                                  <th style={{ padding: '8px', width: '100px', fontWeight: 700 }}>{t('Đơn giá')}</th>
                                  <th style={{ padding: '8px', width: '110px', fontWeight: 700 }}>{t('Thành tiền')}</th>
                                  <th style={{ padding: '8px', width: '90px', fontWeight: 700 }}>VAT (%)</th>
                                  <th style={{ padding: '8px', width: '40px' }} />
                                </tr>
                              </thead>
                              <tbody>
                                {expenseItems.map((item, idx) => {
                                  const lineTotal = item.quantity * item.price;
                                  return (
                                    <tr key={item.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                                      <td style={{ padding: '8px', textAlign: 'center' }}>{idx + 1}</td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="text"
                                          className="form-input"
                                          value={item.content}
                                          onChange={e => {
                                            const updated = [...expenseItems];
                                            updated[idx].content = e.target.value;
                                            setExpenseItems(updated);
                                          }}
                                          placeholder={t('Nội dung chi tiêu')}
                                          style={{ padding: '4px 8px', height: '28px', fontSize: '0.8rem' }}
                                          required
                                        />
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="number"
                                          className="form-input"
                                          value={item.quantity}
                                          onChange={e => {
                                            const updated = [...expenseItems];
                                            updated[idx].quantity = Number(e.target.value);
                                            setExpenseItems(updated);
                                          }}
                                          style={{ padding: '4px 8px', height: '28px', fontSize: '0.8rem' }}
                                          min="1"
                                          required
                                        />
                                      </td>
                                      <td style={{ padding: '8px' }}>
                                        <input
                                          type="number"
                                          className="form-input"
                                          value={item.price}
                                          onChange={e => {
                                            const updated = [...expenseItems];
                                            updated[idx].price = Number(e.target.value);
                                            setExpenseItems(updated);
                                          }}
                                          style={{ padding: '4px 8px', height: '28px', fontSize: '0.8rem' }}
                                          min="0"
                                          required
                                        />
                                      </td>
                                      <td style={{ padding: '8px', fontWeight: 600 }}>{lineTotal.toLocaleString()}đ</td>
                                      <td style={{ padding: '8px' }}>
                                        <CustomSelect
                                          value={item.vat}
                                          onChange={val => {
                                            const updated = [...expenseItems];
                                            updated[idx].vat = Number(val);
                                            setExpenseItems(updated);
                                          }}
                                          options={[
                                            { value: 0, label: '0%' },
                                            { value: 5, label: '5%' },
                                            { value: 8, label: '8%' },
                                            { value: 10, label: '10%' }
                                          ]}
                                          width={85}
                                        />
                                      </td>
                                      <td style={{ padding: '8px', textAlign: 'center' }}>
                                        {expenseItems.length > 1 && (
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setExpenseItems(expenseItems.filter(x => x.id !== item.id));
                                            }}
                                            style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '1.1rem' }}
                                          >
                                            &times;
                                          </button>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>

                          {/* Totals Summary */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignSelf: 'flex-end', width: '260px', marginTop: '4px', fontSize: '0.8rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>{t('Tổng tiền chưa thuế:')}</span>
                              <strong style={{ color: 'var(--color-text)' }}>{itemsTotalBeforeTax.toLocaleString()}đ</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--color-text-muted)' }}>{t('Tiền thuế VAT:')}</span>
                              <strong style={{ color: 'var(--color-text)' }}>{itemsTotalVat.toLocaleString()}đ</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--color-border)', paddingTop: '6px', fontSize: '0.9rem' }}>
                              <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{t('Tổng thanh toán:')}</span>
                              <strong style={{ color: 'var(--color-primary)' }}>{itemsGrandTotal.toLocaleString()}đ</strong>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Card 4: Document Attachments dropzone */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('Tài liệu chứng từ đính kèm')}
                        </div>
                        <div style={{
                          border: '2px dashed var(--color-border)',
                          borderRadius: '12px',
                          padding: '1.5rem',
                          textAlign: 'center',
                          background: 'var(--color-bg-secondary)',
                          cursor: 'pointer'
                        }} onClick={() => {
                          const fileEl = document.getElementById('drawer-file-upload');
                          if (fileEl) fileEl.click();
                        }}>
                          <input
                            id="drawer-file-upload"
                            type="file"
                            multiple
                            style={{ display: 'none' }}
                            onChange={(e) => {
                              const files = Array.from(e.target.files || []);
                              setAttachments([...attachments, ...files.map(f => ({ name: f.name, size: f.size }))]);
                              toast.success(t('Đã thêm tệp đính kèm!'));
                            }}
                          />
                          <Paperclip size={24} style={{ color: 'var(--color-primary)', marginBottom: '8px' }} />
                          <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: '0 0 4px 0', fontWeight: 650 }}>
                            {t('Nhấn để tải tệp lên hoặc kéo thả tệp vào đây')}
                          </p>
                          <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                            {t('Hỗ trợ PDF, PNG, JPG, XLSX kích thước tối đa 25MB')}
                          </span>
                        </div>

                        {/* List of uploaded files */}
                        {attachments.length > 0 && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '4px' }}>
                            {attachments.map((att, index) => (
                              <div key={index} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 12px', background: 'var(--color-bg-secondary)', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                                  <Paperclip size={14} style={{ color: 'var(--color-text-muted)' }} />
                                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {att.name}
                                  </span>
                                  <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                                    ({(att.size / (1024 * 1024)).toFixed(2)} MB)
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => setAttachments(attachments.filter((_, i) => i !== index))}
                                  style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.85rem' }}
                                >
                                  {t('Xóa')}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Card 5: Thảo luận & Hoạt động (Bình luận như bên workspace) */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)', marginTop: '1.25rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('Thảo luận & Hoạt động')}
                        </div>

                        {/* List of comments */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                          {createComments.length === 0 ? (
                            <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                              {t('Chưa có bình luận nào.')}
                            </span>
                          ) : (
                            createComments.map((c: any) => (
                              <div key={c.id} style={{
                                display: 'flex',
                                gap: '12px',
                                padding: '12px 16px',
                                background: 'var(--color-bg)',
                                borderRadius: '14px',
                                border: '1px solid var(--color-border-light)',
                                boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                              }}>
                                <Avatar name={c.author} size={28} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                                    <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 700 }}>{c.author}</strong>
                                    <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>{c.time}</span>
                                  </div>
                                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.45', whiteSpace: 'pre-wrap' }}>{c.text}</p>
                                  
                                  {c.attachments && c.attachments.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                                      {c.attachments.map((att: any, idx: number) => (
                                        <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', padding: '3px 8px', borderRadius: '8px', fontSize: '0.72rem', color: 'var(--color-text)' }}>
                                          <Paperclip size={11} style={{ color: 'var(--color-text-muted)' }} />
                                          <span>{att.name}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>

                        {/* Comment input box */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                          <div style={{ position: 'relative' }}>
                            <MentionInput
                              value={newCreateComment}
                              onChange={e => setNewCreateComment(e.target.value)}
                              placeholder={t('Viết bình luận... Gõ @ để nhắc tên')}
                              style={{ minHeight: '65px', fontSize: '0.8rem', paddingRight: '40px' }}
                              users={users}
                              disabled={createUploadingFile}
                            />
                            <label style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: createUploadingFile ? 'not-allowed' : 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={t('Đính kèm file')}>
                              <input 
                                type="file" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  setCreateUploadingFile(true);
                                  setTimeout(() => {
                                    setCreateCommentAttachments([...createCommentAttachments, { name: file.name, file }]);
                                    setCreateUploadingFile(false);
                                    toast.success(t('Đã đính kèm tệp!'));
                                  }, 500);
                                }} 
                                style={{ display: 'none' }} 
                                disabled={createUploadingFile} 
                              />
                              {createUploadingFile ? <Clock className="spin" size={16} /> : <Paperclip size={16} />}
                            </label>
                          </div>

                          {/* Uploaded comment attachments list */}
                          {createCommentAttachments.length > 0 && (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                              {createCommentAttachments.map((file, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '4px', background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.2)', padding: '3px 8px', borderRadius: '12px', fontSize: '0.72rem', color: 'var(--color-primary)' }}>
                                  <Paperclip size={11} />
                                  <span>{file.name}</span>
                                  <button type="button" onClick={() => setCreateCommentAttachments(createCommentAttachments.filter((_, i) => i !== idx))} style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', paddingLeft: '4px', fontWeight: 700 }}>&times;</button>
                                </div>
                              ))}
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              if (!newCreateComment.trim() && createCommentAttachments.length === 0) return;
                              const commentObj = {
                                id: Date.now(),
                                author: t('Tôi'),
                                time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
                                text: newCreateComment,
                                attachments: createCommentAttachments
                              };
                              setCreateComments([...createComments, commentObj]);
                              setNewCreateComment('');
                              setCreateCommentAttachments([]);
                              toast.success(t('Đã thêm bình luận!'));
                            }}
                            className="btn primary"
                            style={{ alignSelf: 'flex-end', height: '30px', padding: '0 14px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Send size={12} />
                            <span>{t('Gửi')}</span>
                          </button>
                        </div>
                      </div>

                      {/* Spacer at the bottom to prevent sticking to edge */}
                      <div style={{ height: '80px', flexShrink: 0 }} />

                    </div>

                    {/* RIGHT COLUMN: Approval flow steps details (30%) - sticky styled */}
                    <div style={{
                      flex: isMobile ? 'none' : 3,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1.25rem',
                      minWidth: 0,
                      position: isMobile ? 'static' : 'sticky',
                      top: '1.5rem',
                      height: 'fit-content'
                    }}>
                      
                      {/* Card 1: Workflow Steps */}
                      <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {t('Các bước duyệt áp dụng')}
                        </div>

                        {(() => {
                          let currentStepIndex = 1;
                          const stepIndex1 = currentStepIndex++;
                          const stepIndex2 = showStepManager ? currentStepIndex++ : null;
                          const stepIndex3 = showStepAccountant ? currentStepIndex++ : null;
                          const stepIndex4 = showStepDirector ? currentStepIndex++ : null;

                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '12px', position: 'relative', paddingLeft: '30px' }}>
                              <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: 'var(--color-border-light)' }} />
                              
                              {/* Step 1: Submitter */}
                              <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                <div style={{
                                  position: 'absolute',
                                  left: '-30px',
                                  top: '0px',
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  background: 'var(--color-primary)',
                                  color: '#ffffff',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  zIndex: 2
                                }}>
                                  {stepIndex1}
                                </div>
                                <div>
                                  <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)', display: 'block' }}>{t('Lập đề xuất & gửi')}</strong>
                                  <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                                    {proposerUser?.full_name || t('Người lập')}
                                  </span>
                                </div>
                              </div>

                              {/* Step 2: Department Manager */}
                              {showStepManager && (
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: '-30px',
                                    top: '0px',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: app1User ? 'var(--color-primary)' : 'var(--color-surface)',
                                    border: `2px solid ${app1User ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    color: app1User ? '#ffffff' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    zIndex: 2
                                  }}>
                                    {stepIndex2}
                                  </div>
                                  <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <strong style={{ fontSize: '0.8rem', color: app1User ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t('Trưởng phòng phê duyệt')}</strong>
                                      <button
                                        type="button"
                                        onClick={() => setShowStepManager(false)}
                                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                                        title={t('Xóa bước')}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                      <CustomSelect
                                        options={users.map(u => ({
                                          value: String(u.id),
                                          label: `${u.full_name || u.name} (${u.role || 'Trưởng phòng'})`,
                                          avatar: u.avatar || u.avatar_url
                                        }))}
                                        value={app1User ? String(app1User.id) : ''}
                                        onChange={val => {
                                          const u = users.find(x => String(x.id) === String(val));
                                          if (u) setCustomApprover1(u);
                                        }}
                                        placeholder={t('Chọn trưởng phòng...')}
                                        searchable
                                        showAvatars
                                        width="100%"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Step 3: Accountant */}
                              {showStepAccountant && (
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: '-30px',
                                    top: '0px',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: accountantUser ? 'var(--color-primary)' : 'var(--color-surface)',
                                    border: `2px solid ${accountantUser ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    color: accountantUser ? '#ffffff' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    zIndex: 2
                                  }}>
                                    {stepIndex3}
                                  </div>
                                  <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <strong style={{ fontSize: '0.8rem', color: accountantUser ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t('Kế toán kiểm tra')}</strong>
                                      <button
                                        type="button"
                                        onClick={() => setShowStepAccountant(false)}
                                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                                        title={t('Xóa bước')}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                      <CustomSelect
                                        options={users.map(u => ({
                                          value: String(u.id),
                                          label: `${u.full_name || u.name} (${u.role || 'Kế toán'})`,
                                          avatar: u.avatar || u.avatar_url
                                        }))}
                                        value={accountantUser ? String(accountantUser.id) : ''}
                                        onChange={val => {
                                          const u = users.find(x => String(x.id) === String(val));
                                          if (u) setCustomApprover2(u);
                                        }}
                                        placeholder={t('Chọn kế toán...')}
                                        searchable
                                        showAvatars
                                        width="100%"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}

                              {/* Step 4: Director */}
                              {showStepDirector && (
                                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                                  <div style={{
                                    position: 'absolute',
                                    left: '-30px',
                                    top: '0px',
                                    width: '22px',
                                    height: '22px',
                                    borderRadius: '50%',
                                    background: directorUser ? 'var(--color-primary)' : 'var(--color-surface)',
                                    border: `2px solid ${directorUser ? 'var(--color-primary)' : 'var(--color-border)'}`,
                                    color: directorUser ? '#ffffff' : 'var(--color-text-muted)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    zIndex: 2
                                  }}>
                                    {stepIndex4}
                                  </div>
                                  <div style={{ width: '100%' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                                      <strong style={{ fontSize: '0.8rem', color: directorUser ? 'var(--color-text)' : 'var(--color-text-muted)' }}>{t('Ban giám đốc phê duyệt')}</strong>
                                      <button
                                        type="button"
                                        onClick={() => setShowStepDirector(false)}
                                        style={{ border: 'none', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '0.75rem', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                                        title={t('Xóa bước')}
                                      >
                                        <X size={14} />
                                      </button>
                                    </div>
                                    <div style={{ marginTop: '4px' }}>
                                      <CustomSelect
                                        options={users.map(u => ({
                                          value: String(u.id),
                                          label: `${u.full_name || u.name} (${u.role || 'Giám đốc'})`,
                                          avatar: u.avatar || u.avatar_url
                                        }))}
                                        value={directorUser ? String(directorUser.id) : ''}
                                        onChange={val => {
                                          const u = users.find(x => String(x.id) === String(val));
                                          if (u) setCustomApprover3(u);
                                        }}
                                        placeholder={t('Chọn ban giám đốc...')}
                                        searchable
                                        showAvatars
                                        width="100%"
                                      />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <div style={{
                          marginTop: '0.75rem',
                          padding: '10px',
                          background: 'rgba(245, 158, 11, 0.06)',
                          border: '1px solid rgba(245, 158, 11, 0.15)',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          color: 'var(--color-warning-dark)',
                          lineHeight: '1.4'
                        }}>
                          <strong>Lưu ý:</strong> Quy trình phê duyệt được hệ thống tự động xác định dựa trên tính chất và giá trị đề xuất. Bạn có thể thay đổi người phụ trách ở mỗi bước.
                        </div>
                      </div>

                    </div>

                  </div>

                </motion.div>
              </>
            )}
          </>
        );
      })(), document.body)}
    </div>
  );
}

// Side-Drawer Component detailing step-by-step progress
function ApprovalDetailDrawer({ item, onClose, users, t, onApprove, onReject, isAdmin, onDuplicate }: {
  item: ApprovalItem;
  onClose: () => void;
  users: any[];
  t: any;
  onApprove: (item: ApprovalItem) => Promise<void>;
  onReject: (item: ApprovalItem) => void;
  isAdmin: boolean;
  onDuplicate?: (item: ApprovalItem) => void;
}) {
  const [detail, setDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isMobile = window.innerWidth < 768;

  const [reminderTargetUser, setReminderTargetUser] = useState<any>(null);
  const [reminderMessage, setReminderMessage] = useState('');

  // Reminders states
  const [editingReminderStepIdx, setEditingReminderStepIdx] = useState<number | null>(null);
  const [reminderDateTime, setReminderDateTime] = useState('');
  const [stepReminders, setStepReminders] = useState<Record<number, string>>({});

  const [localComments, setLocalComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentAttachments, setCommentAttachments] = useState<any[]>([]);
  const [uploadingFile, setUploadingFile] = useState(false);

  const handleCommentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    setTimeout(() => {
      setCommentAttachments([...commentAttachments, { name: file.name, file }]);
      setUploadingFile(false);
      toast.success(t('Đã đính kèm tệp!'));
    }, 500);
  };

  const handleAddComment = () => {
    if (!newComment.trim() && commentAttachments.length === 0) return;
    const commentObj = {
      id: Date.now(),
      author: t('Tôi'),
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      text: newComment,
      attachments: commentAttachments
    };
    setLocalComments([...localComments, commentObj]);
    setNewComment('');
    setCommentAttachments([]);
    toast.success(t('Đăng bình luận thành công!'));
  };

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

  useEffect(() => {
    if (detail || item) {
      const createdAtVal = detail?.created_at || item.created_at;
      const initialComments = [
        { 
          id: 1, 
          author: t('Hệ thống quy trình IDEAS'), 
          time: new Date(createdAtVal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }), 
          text: `${t('Đã tiếp nhận yêu cầu phê duyệt và bắt đầu quy trình lúc')} ${new Date(createdAtVal).toLocaleString('vi-VN')}.`, 
          attachments: [] 
        }
      ];

      const overall = (item.status || detail?.status || 'pending').toLowerCase();
      if (overall === 'approved') {
        const approvedAtVal = detail?.approved_at || detail?.updated_at || (item as any).updated_at || new Date().toISOString();
        initialComments.push({
          id: 2,
          author: t('Hệ thống quy trình IDEAS'),
          time: new Date(approvedAtVal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `✅ ${t('Yêu cầu đã được phê duyệt thành công lúc')} ${new Date(approvedAtVal).toLocaleString('vi-VN')}.`,
          attachments: []
        });
      } else if (overall === 'rejected') {
        const rejectedAtVal = detail?.updated_at || (item as any).updated_at || new Date().toISOString();
        const reasonStr = detail?.reason || detail?.reject_reason || '';
        initialComments.push({
          id: 2,
          author: t('Hệ thống quy trình IDEAS'),
          time: new Date(rejectedAtVal).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
          text: `❌ ${t('Yêu cầu bị từ chối lúc')} ${new Date(rejectedAtVal).toLocaleString('vi-VN')}.${reasonStr ? ` Lý do: ${reasonStr}` : ''}`,
          attachments: []
        });
      }

      setLocalComments(initialComments);
    }
  }, [detail, item]);

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
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner sm" style={{ margin: '0 auto 10px auto' }}></div>
          {t('Đang tải tiến trình...')}
        </div>
      );
    }

    const creatorUser = users.find(u => String(u.full_name) === String(getEmployeeName()) || String(u.name) === String(getEmployeeName()) || String(u.id) === String(detail?.user_id || detail?.created_by));

    let currentStepIndex = 1;
    const stepIndex1 = currentStepIndex++;
    
    const isMultiLevel = item.type === 'leave' || item.type === 'advance';
    const stepIndex2 = isMultiLevel ? currentStepIndex++ : null;
    const stepIndex3 = isMultiLevel ? currentStepIndex++ : null;
    const stepIndex4 = isMultiLevel ? currentStepIndex++ : null;

    const isSingleLevel = !isMultiLevel;
    const singleStepIndex = isSingleLevel ? currentStepIndex++ : null;

    const managerUser = users.find(u => String(u.id) === String(detail?.approver_id)) || users.find(u => ['manager', 'director', 'admin'].includes(String(u.role).toLowerCase()));
    const accountantUser = users.find(u => String(u.id) === String(detail?.approver_id_2)) || users.find(u => String(u.role).toLowerCase() === 'accountant');
    const directorUser = users.find(u => String(u.id) === String(detail?.director_id || '1001')) || users.find(u => ['director', 'admin', 'superadmin'].includes(String(u.role).toLowerCase()));

    const singleApproverUser = users.find(u => String(u.id) === String(detail?.approver_id)) || users.find(u => ['accountant', 'manager', 'director', 'admin'].includes(String(u.role).toLowerCase()));

    // Helper to get step status and details
    const getStepDetails = (stepKey: 'step1' | 'step2' | 'step3' | 'step4' | 'single', stepNum: number) => {
      const overall = (item.status || 'pending').toLowerCase();
      const s1 = (detail?.status_level_1 || 'pending').toLowerCase();
      const s2 = (detail?.status_level_2 || 'pending').toLowerCase();

      let status: 'approved' | 'rejected' | 'pending' | 'not_reached' = 'pending';

      if (stepKey === 'step1') {
        status = 'approved';
      } else if (stepKey === 'single') {
        if (overall === 'approved') status = 'approved';
        else if (overall === 'rejected') status = 'rejected';
        else status = 'pending';
      } else if (stepKey === 'step2') {
        if (s1 === 'approved' || overall === 'approved') status = 'approved';
        else if (s1 === 'rejected' || overall === 'rejected') status = 'rejected';
        else status = 'pending';
      } else if (stepKey === 'step3') {
        if (s2 === 'approved' || overall === 'approved') status = 'approved';
        else if (s1 !== 'approved' && overall !== 'approved') status = 'not_reached';
        else if (s2 === 'rejected' || overall === 'rejected') status = 'rejected';
        else status = 'pending';
      } else if (stepKey === 'step4') {
        if (overall === 'approved') status = 'approved';
        else if (s2 !== 'approved' && overall !== 'approved') status = 'not_reached';
        else if (overall === 'rejected') status = 'rejected';
        else status = 'pending';
      }

      // Styles based on status
      let bg = 'var(--color-primary)';
      let textCol = '#ffffff';
      let iconContent: React.ReactNode = String(stepNum);
      let showBell = false;

      if (status === 'approved') {
        bg = '#10b981'; // Green
        iconContent = '✓';
      } else if (status === 'rejected') {
        bg = '#ef4444'; // Red
        iconContent = '✗';
      } else if (status === 'not_reached') {
        bg = 'var(--color-border-light)';
        textCol = 'var(--color-text-muted)';
      } else if (status === 'pending') {
        bg = 'var(--color-primary)';
        showBell = true;
      }

      return { bg, textCol, iconContent, showBell };
    };

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', marginTop: '12px', position: 'relative', paddingLeft: '30px', textAlign: 'left' }}>
        <div style={{ position: 'absolute', left: '10px', top: '10px', bottom: '10px', width: '2px', background: 'var(--color-border-light)' }} />
        
        {/* Step 1: Submitter */}
        {(() => {
          const sDetails = getStepDetails('step1', 1);
          return (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                position: 'absolute',
                left: '-30px',
                top: '0px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: sDetails.bg,
                color: sDetails.textCol,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                zIndex: 2
              }}>
                {sDetails.iconContent}
              </div>
              <div style={{ width: '100%' }}>
                <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)', display: 'block', marginBottom: '6px' }}>{t('Lập đề xuất & gửi')}</strong>
                <CustomSelect
                  options={users.map(u => ({
                    value: String(u.id),
                    label: `${u.full_name || u.name} (${u.role || 'Nhân sự'})`,
                    avatar: u.avatar || u.avatar_url
                  }))}
                  value={creatorUser ? String(creatorUser.id) : ''}
                  onChange={() => {}}
                  disabled
                  showAvatars
                  width="100%"
                />
                <span style={{ fontSize: '0.725rem', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                  {t('Đã gửi lúc')} {new Date(detail?.created_at || item.created_at).toLocaleString('vi-VN')}
                </span>
              </div>
            </div>
          );
        })()}

        {/* Multi-level steps */}
        {isMultiLevel && (
          <>
            {/* Step 2: Manager */}
            {(() => {
              const sDetails = getStepDetails('step2', 2);
              return (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '0px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: sDetails.bg,
                    color: sDetails.textCol,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    zIndex: 2
                  }}>
                    {sDetails.iconContent}
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{t('Trưởng phòng phê duyệt')}</strong>
                      {sDetails.showBell && (
                        <button 
                          onClick={() => { setReminderTargetUser(managerUser); setReminderMessage(''); }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                          title={t('Gửi nhắc nhở')}
                        >
                          <Bell size={18} fill="#ef4444" />
                        </button>
                      )}
                    </div>
                    <CustomSelect
                      options={users.map(u => ({
                        value: String(u.id),
                        label: `${u.full_name || u.name} (${u.role || 'Trưởng phòng'})`,
                        avatar: u.avatar || u.avatar_url
                      }))}
                      value={managerUser ? String(managerUser.id) : ''}
                      onChange={() => {}}
                      disabled
                      showAvatars
                      width="100%"
                    />
                    {sDetails.bg === '#10b981' && (
                      <span style={{ fontSize: '0.725rem', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ✓ {t('Đã duyệt lúc')} {new Date(detail?.approved_at || detail?.updated_at || (item as any).updated_at).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Step 3: Accountant */}
            {(() => {
              const sDetails = getStepDetails('step3', 3);
              return (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '0px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: sDetails.bg,
                    color: sDetails.textCol,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    zIndex: 2
                  }}>
                    {sDetails.iconContent}
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{t('Kế toán kiểm tra')}</strong>
                      {sDetails.showBell && (
                        <button 
                          onClick={() => { setReminderTargetUser(accountantUser); setReminderMessage(''); }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                          title={t('Gửi nhắc nhở')}
                        >
                          <Bell size={18} fill="#ef4444" />
                        </button>
                      )}
                    </div>
                    <CustomSelect
                      options={users.map(u => ({
                        value: String(u.id),
                        label: `${u.full_name || u.name} (${u.role || 'Kế toán'})`,
                        avatar: u.avatar || u.avatar_url
                      }))}
                      value={accountantUser ? String(accountantUser.id) : ''}
                      onChange={() => {}}
                      disabled
                      showAvatars
                      width="100%"
                    />
                    {sDetails.bg === '#10b981' && (
                      <span style={{ fontSize: '0.725rem', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ✓ {t('Đã duyệt lúc')} {new Date(detail?.approved_at || detail?.updated_at || (item as any).updated_at).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Step 4: Director */}
            {(() => {
              const sDetails = getStepDetails('step4', 4);
              return (
                <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    position: 'absolute',
                    left: '-30px',
                    top: '0px',
                    width: '22px',
                    height: '22px',
                    borderRadius: '50%',
                    background: sDetails.bg,
                    color: sDetails.textCol,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.72rem',
                    fontWeight: 800,
                    zIndex: 2
                  }}>
                    {sDetails.iconContent}
                  </div>
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>{t('Ban giám đốc phê duyệt')}</strong>
                      {sDetails.showBell && (
                        <button 
                          onClick={() => { setReminderTargetUser(directorUser); setReminderMessage(''); }}
                          style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                          title={t('Gửi nhắc nhở')}
                        >
                          <Bell size={18} fill="#ef4444" />
                        </button>
                      )}
                    </div>
                    <CustomSelect
                      options={users.map(u => ({
                        value: String(u.id),
                        label: `${u.full_name || u.name} (${u.role || 'Ban giám đốc'})`,
                        avatar: u.avatar || u.avatar_url
                      }))}
                      value={directorUser ? String(directorUser.id) : ''}
                      onChange={() => {}}
                      disabled
                      showAvatars
                      width="100%"
                    />
                    {sDetails.bg === '#10b981' && (
                      <span style={{ fontSize: '0.725rem', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                        ✓ {t('Đã duyệt lúc')} {new Date(detail?.approved_at || detail?.updated_at || (item as any).updated_at).toLocaleString('vi-VN')}
                      </span>
                    )}
                  </div>
                </div>
              );
            })()}
          </>
        )}

        {/* Single level steps */}
        {isSingleLevel && (() => {
          const sDetails = getStepDetails('single', 2);
          return (
            <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                position: 'absolute',
                left: '-30px',
                top: '0px',
                width: '22px',
                height: '22px',
                borderRadius: '50%',
                background: sDetails.bg,
                color: sDetails.textCol,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.72rem',
                fontWeight: 800,
                zIndex: 2
              }}>
                {sDetails.iconContent}
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)' }}>
                    {item.type === 'expense' ? t('Phê duyệt đề xuất chi phí') : t('Phê duyệt giải trình chấm công')}
                  </strong>
                  {sDetails.showBell && (
                    <button 
                      onClick={() => { setReminderTargetUser(singleApproverUser); setReminderMessage(''); }}
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: '2px' }}
                      title={t('Gửi nhắc nhở')}
                    >
                      <Bell size={18} fill="#ef4444" />
                    </button>
                  )}
                </div>
                <CustomSelect
                  options={users.map(u => ({
                    value: String(u.id),
                    label: `${u.full_name || u.name} (${u.role || 'Người phê duyệt'})`,
                    avatar: u.avatar || u.avatar_url
                  }))}
                  value={singleApproverUser ? String(singleApproverUser.id) : ''}
                  onChange={() => {}}
                  disabled
                  showAvatars
                  width="100%"
                />
                {sDetails.bg === '#10b981' && (
                  <span style={{ fontSize: '0.725rem', color: '#10b981', marginTop: '4px', display: 'block', fontWeight: 600 }}>
                    ✓ {t('Đã duyệt lúc')} {new Date(detail?.approved_at || detail?.updated_at || (item as any).updated_at).toLocaleString('vi-VN')}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderDetailFields = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
          <div className="spinner sm" style={{ margin: '0 auto 10px auto' }}></div>
          {t('Đang tải chi tiết đề xuất...')}
        </div>
      );
    }

    const creatorUser = users.find(u => String(u.full_name) === String(getEmployeeName()) || String(u.name) === String(getEmployeeName()) || String(u.id) === String(detail?.user_id || detail?.created_by));

    const rawDesc = detail?.notes || detail?.description || item.description || '';
    const hasInstallments = rawDesc.includes('[Thanh toán theo đợt]');
    const hasRecurring = rawDesc.includes('[Lặp lại định kỳ]');

    let installmentText = '';
    if (hasInstallments) {
      const match = rawDesc.match(/\[Thanh toán theo đợt\]:\s*(.*)/);
      if (match) installmentText = match[1];
    }

    let recurringText = '';
    if (hasRecurring) {
      const match = rawDesc.match(/\[Lặp lại định kỳ\]:\s*(.*)/);
      if (match) recurringText = match[1];
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
        
        {/* Proposal Title Header */}
        <div style={{ padding: '0.5rem 0.25rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: 0, color: 'var(--color-text)', lineHeight: 1.3 }}>
            {item.title}
          </h2>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center', fontSize: '0.8rem', color: 'var(--color-text-muted)', flexWrap: 'wrap' }}>
            <span>
              {t('Ngày lập đề xuất')}: <strong style={{ color: 'var(--color-text)' }}>{new Date(detail?.created_at || item.created_at).toLocaleString('vi-VN')}</strong>
            </span>
            <span style={{ color: 'var(--color-border-light)' }}>|</span>
            <span>
              {t('Mã')}: <strong style={{ color: 'var(--color-text)' }}>#{item.id}</strong>
            </span>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>
            {t('Thông tin chi tiết đề xuất')}
          </div>

          {item.type === 'leave' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Loại nghỉ phép')}</label>
                <CustomSelect
                  value={detail?.leave_type || 'annual'}
                  onChange={() => {}}
                  disabled
                  options={[
                    { value: 'annual', label: t('Nghỉ phép năm') },
                    { value: 'sick', label: t('Nghỉ ốm / thai sản') },
                    { value: 'compensatory', label: t('Nghỉ bù') },
                    { value: 'late_early', label: t('Đi trễ/Về sớm') },
                    { value: 'unpaid', label: t('Nghỉ việc riêng (không lương)') }
                  ]}
                  width="100%"
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Số ngày nghỉ')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${detail?.total_days || 1} ngày`}
                  disabled
                  style={{ width: '100%' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Thời gian nghỉ')}</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={detail?.start_date ? new Date(detail.start_date).toLocaleDateString('vi-VN') : ''}
                    disabled
                    style={{ flex: 1 }}
                  />
                  <span style={{ color: 'var(--color-text-muted)' }}>➔</span>
                  <input
                    type="text"
                    className="form-input"
                    value={detail?.end_date ? new Date(detail.end_date).toLocaleDateString('vi-VN') : ''}
                    disabled
                    style={{ flex: 1 }}
                  />
                </div>
              </div>
            </div>
          )}

          {item.type === 'advance' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Số tiền tạm ứng')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={Number(detail?.amount || 0).toLocaleString('vi-VN') + ' đ'}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Ngày đề nghị')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={detail?.request_date ? new Date(detail.request_date).toLocaleDateString('vi-VN') : ''}
                  disabled
                />
              </div>
            </div>
          )}

          {item.type === 'expense' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Số tiền đề xuất')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={Number(detail?.amount || 0).toLocaleString('vi-VN') + ' đ'}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Danh mục chi')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={detail?.category || 'Vận hành'}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Ngày chứng từ')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={detail?.date ? new Date(detail.date).toLocaleDateString('vi-VN') : new Date(detail?.created_at || item.created_at).toLocaleDateString('vi-VN')}
                  disabled
                />
              </div>
            </div>
          )}

          {item.type === 'checkin' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Ngày giải trình')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={detail?.check_in_date || ''}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Giờ ghi nhận')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={detail?.check_in_time || ''}
                  disabled
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', gridColumn: 'span 2' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>{t('Thời gian đi trễ (phút)')}</label>
                <input
                  type="text"
                  className="form-input"
                  value={`${detail?.late_minutes || 0} phút`}
                  disabled
                />
              </div>
            </div>
          )}
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '12px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('Lý do / Mô tả chi tiết')}
          </div>
          <textarea
            rows={3}
            value={detail?.reason || detail?.notes || item.description || ''}
            disabled
            style={{
              width: '100%',
              background: '#fffbeb',
              color: '#713f12',
              border: '1px solid #fef08a',
              borderLeft: '4px solid #eab308',
              borderRadius: 0,
              fontStyle: 'italic',
              padding: '10px 12px',
              fontSize: '0.8rem',
              lineHeight: 1.45,
              resize: 'none'
            }}
          />
        </div>

        {/* Card 4: Cấu hình nâng cao (Chỉ hiện khi có thiết lập được bật) */}
        {((item.type === 'expense' && hasInstallments) || hasRecurring) && (
          <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('Cấu hình nâng cao')}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {item.type === 'expense' && hasInstallments && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <GreenToggle
                    id="view_isPhasedPayment"
                    checked={true}
                    disabled
                    label={t('Thanh toán chia nhiều đợt (Installment/Phased Payment)')}
                  />
                  {installmentText && (
                    <div style={{ marginTop: '8px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-bg-secondary)', fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                      {installmentText}
                    </div>
                  )}
                </div>
              )}

              {hasRecurring && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <GreenToggle
                    id="view_isRecurring"
                    checked={true}
                    disabled
                    label={t('Thiết lập lặp lại tự động (Recurring Proposal)')}
                  />
                  {recurringText && (
                    <div style={{ marginTop: '8px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-bg-secondary)', fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                      {recurringText}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    );
  };

  return createPortal(
    <>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>

      {reminderTargetUser && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 20000,
          padding: '1rem'
        }} onClick={() => setReminderTargetUser(null)}>
          <div style={{
            background: 'var(--color-surface)',
            borderRadius: '16px',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-lg)',
            width: '100%',
            maxWidth: '420px',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            textAlign: 'left'
          }} onClick={e => e.stopPropagation()}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Bell size={18} style={{ color: 'var(--color-primary)' }} />
                {t('Gửi nhắc nhở phê duyệt')}
              </h3>
              <button 
                onClick={() => setReminderTargetUser(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', background: 'var(--color-bg-secondary)', borderRadius: '10px' }}>
              <Avatar src={reminderTargetUser.avatar || reminderTargetUser.avatar_url} name={reminderTargetUser.full_name || reminderTargetUser.name} size={28} />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{reminderTargetUser.full_name || reminderTargetUser.name}</span>
                <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>{reminderTargetUser.role || t('Người duyệt')}</span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>
                {t('Nội dung nhắc nhở')}
              </label>
              <textarea
                className="form-input"
                rows={4}
                value={reminderMessage}
                onChange={e => setReminderMessage(e.target.value)}
                placeholder={t('Nhập lời nhắn nhắc nhở người duyệt... Ví dụ: Đề xuất này đang cần gấp, duyệt hộ mình với nhé!')}
                style={{ width: '100%', resize: 'none', padding: '10px', fontSize: '0.8rem' }}
                autoFocus
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '4px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setReminderTargetUser(null)}
                style={{ padding: '6px 14px', fontSize: '0.8rem' }}
              >
                {t('Hủy')}
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={() => {
                  const targetName = reminderTargetUser.full_name || reminderTargetUser.name || '';
                  toast.success(`${t('Đã gửi nhắc nhở thành công đến')} ${targetName}!`);
                  setReminderTargetUser(null);
                  setReminderMessage('');
                }}
                style={{ padding: '6px 16px', fontSize: '0.8rem', background: '#10b981', borderColor: '#10b981', color: 'white' }}
              >
                {t('Gửi đi')}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Backdrop overlay utilizing the CSS-based backdrop classes */}
      <div 
        className="drawer-backdrop" 
        onClick={onClose}
        style={{ zIndex: 10500 }}
      />

      {/* Drawer Sheet Container */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: isMobile ? 0 : 'var(--sidebar-width, 220px)',
        right: 0,
        bottom: 0,
        background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-border-light) 100%)',
        boxShadow: '-10px 0 30px rgba(0,0,0,0.15)',
        display: 'flex',
        flexDirection: 'column',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        boxSizing: 'border-box',
        zIndex: 10600,
        overflow: 'hidden'
      }} onClick={e => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--color-border-light)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--color-surface)',
          zIndex: 100,
          position: 'sticky',
          top: 0,
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img 
              src="/LOGO.jpg" 
              alt="IDEAS LOGO" 
              style={{ 
                height: '32px', 
                width: '32px', 
                borderRadius: '8px', 
                border: '1px solid var(--color-border-light)',
                objectFit: 'cover'
              }} 
            />
            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text)' }}>
              IDEAS - {t('Quy trình')} #{item.id}
            </h3>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {isAdmin && (item.status === 'pending' || !item.status) && (
              <>
                <button
                  onClick={() => onReject(item)}
                  className="btn secondary"
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    color: '#ef4444',
                    borderColor: '#ef4444'
                  }}
                >
                  <XCircle size={14} />
                  {t('Từ chối')}
                </button>
                <button
                  onClick={async () => {
                    await onApprove(item);
                    onClose();
                  }}
                  className="btn primary"
                  style={{
                    height: '36px',
                    padding: '0 12px',
                    fontSize: '0.8rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    borderRadius: '8px',
                    background: '#10b981',
                    borderColor: '#10b981',
                    color: '#ffffff'
                  }}
                >
                  <CheckCircle2 size={14} />
                  {t('Phê duyệt')}
                </button>
              </>
            )}

            {onDuplicate && (
              <button
                onClick={() => {
                  onDuplicate(item);
                }}
                className="btn secondary hover-lift"
                style={{
                  height: '36px',
                  width: '36px',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '8px'
                }}
                title={t('Nhân bản đề xuất')}
              >
                <Copy size={16} />
              </button>
            )}
            <button 
              onClick={onClose} 
              className="hover-lift"
              style={{
                background: 'var(--color-bg)',
                border: '1px solid var(--color-border)',
                padding: '8px',
                borderRadius: '8px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '36px',
                width: '36px'
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Body (Split layout) */}
        <div className="custom-scrollbar" style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.5rem',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.1fr 0.9fr',
          gap: '1.5rem',
          background: 'var(--color-bg-light, #f8fafc)'
        }}>
          {/* Left Column: Detailed Proposal Fields */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem'
          }}>
            {renderDetailFields()}
          </div>

          {/* Right Column: Timeline & Comments */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            background: 'var(--color-surface)',
            padding: '1.25rem',
            borderRadius: '16px',
            border: '1px solid var(--color-border-light)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                {t('CÁC BƯỚC THỰC HIỆN')}
              </h3>
              {renderTimeline()}
            </div>

            {/* Discussion / Comments Section */}
            <div style={{ marginTop: '0.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--color-border-light)' }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '0.8125rem', fontWeight: 800, textTransform: 'uppercase', color: 'var(--color-text-muted)', letterSpacing: '0.05em' }}>
                {t('THẢO LUẬN & HOẠT ĐỘNG')}
              </h3>

              {/* List of comments */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '1.25rem' }}>
                {localComments.length === 0 ? (
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                    {t('Chưa có bình luận nào.')}
                  </span>
                ) : (
                  localComments.map((c: any) => (
                    <div key={c.id} style={{
                      display: 'flex',
                      gap: '12px',
                      padding: '12px 16px',
                      background: 'var(--color-bg)',
                      borderRadius: '14px',
                      border: '1px solid var(--color-border-light)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.01)'
                    }}>
                      <Avatar name={c.author} size={28} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '4px' }}>
                          <strong style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 700 }}>{c.author}</strong>
                          <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>{c.time}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: '1.45', whiteSpace: 'pre-wrap', textAlign: 'left' }}>{c.text}</p>
                        
                        {/* Attached files chips list for comments */}
                        {c.attachments && c.attachments.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                            {c.attachments.map((file: any, index: number) => (
                              <div key={index} style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border)',
                                borderRadius: '6px',
                                padding: '4px 8px',
                                fontSize: '0.72rem',
                                color: 'var(--color-text-light)'
                              }}>
                                <span>📄</span>
                                <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Add Comment Input Field Area */}
              <div style={{ background: 'rgba(0, 0, 0, 0.015)', border: '1px solid var(--color-border-light)', padding: '12px', borderRadius: '14px', display: 'flex', flexDirection: 'column', gap: '10px', boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.01)' }}>
                <div style={{ position: 'relative' }}>
                  <MentionInput
                    value={newComment}
                    onChange={e => setNewComment(e.target.value)}
                    placeholder={t('Viết bình luận... Gõ @ để nhắc tên')}
                    style={{ minHeight: '65px', fontSize: '0.85rem', paddingRight: '40px' }}
                  />
                  <label style={{ position: 'absolute', right: '10px', bottom: '10px', cursor: 'pointer', color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }} title={t('Đính kèm file')}>
                    <input type="file" onChange={handleCommentFileChange} style={{ display: 'none' }} />
                    <Paperclip size={18} />
                  </label>
                </div>

                {commentAttachments.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', paddingTop: '2px' }}>
                    {commentAttachments.map((file, index) => (
                      <div key={index} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '5px',
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border-light)',
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '0.72rem',
                        color: 'var(--color-text)'
                      }}>
                        <span>📄</span>
                        <span style={{ maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 600 }}>
                          {file.name}
                        </span>
                        <button
                          onClick={() => setCommentAttachments(commentAttachments.filter((_, i) => i !== index))}
                          style={{ border: 'none', background: 'transparent', color: 'var(--color-danger)', cursor: 'pointer', fontSize: '0.8rem', padding: '0 2px', lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '4px' }}>
                  <button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() && commentAttachments.length === 0}
                    className="btn primary sm"
                    style={{ padding: '6px 18px', fontSize: '0.78rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '5px', background: 'var(--color-primary)', borderColor: 'var(--color-primary)', color: '#fff' }}
                  >
                    <Send size={13} />
                    <span>{t('Gửi')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>


      </div>
    </>,
    document.body
  );
}
