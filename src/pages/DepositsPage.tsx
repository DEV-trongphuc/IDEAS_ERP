import React, { useEffect, useState, lazy, Suspense, useRef } from 'react';
import { createPortal } from 'react-dom';
import { fetchAPI } from '../utils/api';
import { compressToWebP } from '../utils/imageCompress';
import { useAuth } from '../contexts/AuthContext';
import { useUIStore } from '../store/uiStore';
import { CustomModal } from '../components/ui/CustomModal';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CreditCard, Plus, Check, X, Upload, AlertCircle, Trash2, Calendar, FileText, Ban, ChevronLeft, ChevronRight, Info, Eye, Edit, Loader2, Search, MessageSquare, Clock, Send, Bell, DollarSign, TrendingUp, Award } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLanguage } from '../contexts/LanguageContext';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';
import { TableSkeleton } from '../components/ui/Skeleton';
const CustomerProfileDrawer = lazy(() => import('./CustomerProfileDrawer').then(module => ({ default: module.CustomerProfileDrawer })));
import { CurrencyInput } from '../components/ui/CurrencyInput';
import { MentionInput } from '../components/ui/MentionInput';
import {
  XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ComposedChart,
  PieChart, Pie, Cell, BarChart, Bar, Line, Legend, Area
} from 'recharts';

const formatNumberWithCommas = (val: any) => {
  if (val === undefined || val === null || val === '') return '';
  const cleanVal = String(val).replace(/[^0-9]/g, '');
  if (!cleanVal) return '';
  return cleanVal.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

interface Deposit {
  id: number;
  contact_id: number;
  project_id: number;
  unit_code: string;
  price: number;
  expected_commission: number;
  status: string;
  cancelled_reason: string | null;
  created_at: string;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  avatar_url?: string;
  project_name: string;
  creator_name: string;
  creator_avatar?: string;
  milestones: Milestone[];
  created_by?: number;
  contact_owner_id?: number;
  auto_remind?: number;
  remind_days_before?: number;
  remind_at_hour?: number;
  remind_target?: number;
  currency?: string;
}

interface Milestone {
  id: number;
  deposit_id: number;
  milestone_name: string;
  expected_amount: number;
  unc_file_path: string | null;
  status: 'pending' | 'paid' | 'approved' | 'failed';
  approval_date: string | null;
  expected_pay_date?: string | null;
  last_reminded_at?: string | null;
}

interface Contact {
  id: number;
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
  expected_revenue?: number | string;
}

interface Project {
  id: number;
  name: string;
  code: string;
}

const formatMoney = (val: string | number, currency: string = 'VND') => {
  const num = Number(val);
  if (isNaN(num)) return '0 đ';
  const normCurrency = currency === 'EURO' ? 'EUR' : currency;
  if (normCurrency === 'VND') {
    return num.toLocaleString('vi-VN') + ' đ';
  }
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: normCurrency
  }).format(num);
};

export default function DepositsPage() {
  const { user } = useAuth();
  const isViewer = user?.role === 'viewer';
  const { showConfirm, addToast } = useUIStore();
  const { t } = useLanguage();
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  const [activeViewTab, setActiveViewTab] = useState<'list' | 'stats'>('list');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (document.documentElement.getAttribute('data-theme') as 'light' | 'dark') || 'light';
  });
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 8;

  const [searchQuery, setSearchQuery] = useState('');
  const [filterProjectId, setFilterProjectId] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredDepositsList = React.useMemo(() => {
    let list = deposits;
    if (user?.role === 'sale') {
      list = deposits.filter((d: any) => 
        String(d.created_by) === String(user.id) || 
        String(d.owner_id) === String(user.id) || 
        (d.contact_owner_id && String(d.contact_owner_id) === String(user.id)) ||
        (d.shareholders && Array.isArray(d.shareholders) && d.shareholders.some((sh: any) => String(sh.user_id) === String(user.id)))
      );
    }

    return list.filter((d: any) => {
      const clientName = `${d.last_name || ''} ${d.first_name || ''}`.toLowerCase();
      const matchesSearch = !searchQuery.trim() ? true : 
        clientName.includes(searchQuery.toLowerCase()) || 
        (d.phone && d.phone.includes(searchQuery)) || 
        (d.unit_code && d.unit_code.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesProject = !filterProjectId ? true : String(d.project_id) === filterProjectId;
      const matchesStatus = !filterStatus ? true : d.status === filterStatus;

      return matchesSearch && matchesProject && matchesStatus;
    });
  }, [deposits, user, searchQuery, filterProjectId, filterStatus]);

  const paginatedDeposits = React.useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredDepositsList.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredDepositsList, currentPage]);

  const totalPages = Math.ceil(filteredDepositsList.length / ITEMS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(1);
  }, [filteredDepositsList.length]);

  // Creation State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [autoRemind, setAutoRemind] = useState(true);
  const [remindDaysBefore, setRemindDaysBefore] = useState(3);
  const [remindAtHour, setRemindAtHour] = useState(8);
  const [remindTarget, setRemindTarget] = useState(1);

  const [autoRemindManage, setAutoRemindManage] = useState(true);
  const [remindDaysBeforeManage, setRemindDaysBeforeManage] = useState(3);
  const [remindAtHourManage, setRemindAtHourManage] = useState(8);
  const [remindTargetManage, setRemindTargetManage] = useState(1);
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [unitCode, setUnitCode] = useState('');
  const [price, setPrice] = useState('');
  const [expectedCommission, setExpectedCommission] = useState('');
  const [notes, setNotes] = useState('');
  const [currency, setCurrency] = useState('VND');
  const [milestonesInput, setMilestonesInput] = useState<{ name: string; amount: string; expected_pay_date: string }[]>([
    { name: 'Đợt 1 - Thanh toán cọc', amount: '', expected_pay_date: '' }
  ]);

  const [depositAccountantId, setDepositAccountantId] = useState('');
  const [depositUncFile, setDepositUncFile] = useState<File | null>(null);

  // Co-op and Sales Method Selection States
  const [coopSlips, setCoopSlips] = useState<any[]>([]);
  const [usersList, setUsersList] = useState<any[]>([]);
  const [hasExistingCoop, setHasExistingCoop] = useState(false);
  const [existingCoopShares, setExistingCoopShares] = useState<any[]>([]);
  const [isCooperation, setIsCooperation] = useState(false);
  const [allowedCollaborators, setAllowedCollaborators] = useState<{ id: string; name: string; isOwner: boolean }[]>([]);
  const [collaboratorShares, setCollaboratorShares] = useState<Record<string, number>>({});

  // Manage Milestones State
  const [showManageModal, setShowManageModal] = useState(false);
  const [selectedDepForManage, setSelectedDepForManage] = useState<Deposit | null>(null);
  const [tempMilestones, setTempMilestones] = useState<any[]>([]);
  const [isSavingMilestones, setIsSavingMilestones] = useState(false);
  const [actioningMilestoneId, setActioningMilestoneId] = useState<any>(null);
  const [actioningType, setActioningType] = useState<'approve' | 'reject' | null>(null);
  const [sendingReminderId, setSendingReminderId] = useState<number | null>(null);
  const [previewReminderMilestone, setPreviewReminderMilestone] = useState<any | null>(null);

  const [activeDrawerTab, setActiveDrawerTab] = useState<'comments' | 'history'>('history');
  const [comments, setComments] = useState<any[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [loadingComments, setLoadingComments] = useState(false);
  const commentEndRef = useRef<HTMLDivElement>(null);

  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [selectedContact, setSelectedContact] = useState<any>(null);
  const [sharesData, setSharesData] = useState<any[]>([]);

  const [tempExpectedCommission, setTempExpectedCommission] = useState<number>(0);
  const [tempSharesData, setTempSharesData] = useState<any[]>([]);
  const [isEditingCommission, setIsEditingCommission] = useState(false);

  const handleTempSharePercentChange = (sIdx: number, val: string) => {
    const updated = [...tempSharesData];
    updated[sIdx].percentage = parseInt(val) || 0;
    setTempSharesData(updated);
  };

  // Load selected deposit additional info
  const fetchCustomerEmail = async (contactId: number) => {
    try {
      const res = await fetchAPI(`contacts/${contactId}`);
      if (selectedDepForManage && selectedDepForManage.contact_id === contactId) {
        setSelectedDepForManage({
          ...selectedDepForManage,
          email: res.email || ''
        });
      }
    } catch (err) {
      addToast('Không thể tải thông tin khách hàng', 'error');
    }
  };

  const handleOpenContactDrawer = async (contactId: number) => {
    try {
      const res = await fetchAPI(`contacts/${contactId}`);
      const c = res.data || res;
      if (c) {
        setSelectedContact(c);
        setShowContactDrawer(true);
      }
    } catch (err) {
      addToast('Không thể tải thông tin khách hàng', 'error');
    }
  };

  useEffect(() => {
    if (selectedDepForManage) {
      setSharesData([]);
      setTempExpectedCommission(Number(selectedDepForManage.expected_commission) || 0);
      setTempSharesData([]);
      setIsEditingCommission(false);
      setAutoRemindManage(selectedDepForManage.auto_remind !== 0);
      setRemindDaysBeforeManage(Number(selectedDepForManage.remind_days_before) || 3);
      setRemindAtHourManage(Number(selectedDepForManage.remind_at_hour) || 8);
      setRemindTargetManage(Number(selectedDepForManage.remind_target) || 1);
      fetchAPI(`cooperation-slips?contact_id=${selectedDepForManage.contact_id}`)
        .then(res => {
          const slips = res.data || res || [];
          if (slips.length > 0) {
            const matchedSlip = slips.find((s: any) => Number(s.deposit_slip_id) === Number(selectedDepForManage.id)) || slips[0];
            if (matchedSlip && matchedSlip.shareholders) {
              setSharesData(matchedSlip.shareholders);
              setTempSharesData(matchedSlip.shareholders.map((sh: any) => ({ ...sh })));
            }
          }
        })
        .catch(err => console.error("Error loading cooperation shares:", err));
    }
  }, [selectedDepForManage]);

  // Cancel Deposit State
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelDepositId, setCancelDepositId] = useState<number | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const isAdmin = user && ['admin', 'superadmin', 'super_admin', 'assistant', 'manager', 'director', 'accountant'].includes(user.role);
  const canEditMilestones = isAdmin || (selectedDepForManage && (
    String(selectedDepForManage.created_by) === String(user?.id) ||
    String(selectedDepForManage.contact_owner_id) === String(user?.id)
  ));

  const loadData = async () => {
    setLoading(true);
    try {
      const [resDep, resCont, resProj, resCoop, resUsr, resPO, resExp] = await Promise.all([
        fetchAPI('deposits'),
        fetchAPI('contacts?limit=1000'),
        fetchAPI('projects?bypass_roster=1'),
        fetchAPI('cooperation-slips').catch(() => ({ success: false, data: [] })),
        fetchAPI('users?all=1').catch(() => ({ success: false, data: [] })),
        fetchAPI('purchase-orders').catch(() => ({ success: false, data: [] })),
        fetchAPI('expenses?limit=5000').catch(() => ({ success: false, data: [] }))
      ]);

      if (resDep.success) setDeposits(resDep.data || []);
      if (resCont.success) {
        const allContacts = resCont.data?.items || resCont.data || [];
        const filteredContacts = (user?.role === 'sale') 
          ? allContacts.filter((c: any) => String(c.owner_id) === String(user.id))
          : allContacts;
        setContacts(filteredContacts);
      }
      if (resProj.success) {
        setProjects(resProj.data || []);
      }
      if (resCoop.success) {
        setCoopSlips(resCoop.data || []);
      }
      if (resUsr.success) {
        setUsersList(resUsr.data || []);
      }
      if (resPO) {
        const poData = resPO.data?.items || resPO.data || resPO;
        setPurchaseOrders(Array.isArray(poData) ? poData : []);
      }
      if (resExp) {
        const expData = resExp.data?.items || resExp.data || resExp;
        setExpenses(Array.isArray(expData) ? expData : []);
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadComments = async () => {
    if (!selectedDepForManage?.id) return;
    setLoadingComments(true);
    try {
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/comments`);
      if (res.success) {
        setComments(res.data || []);
        setTimeout(() => commentEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    } catch (err) {
      console.error("Error loading comments:", err);
    } finally {
      setLoadingComments(false);
    }
  };

  const loadHistory = async () => {
    if (!selectedDepForManage?.id) return;
    setLoadingHistory(true);
    try {
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/history`);
      if (res.success) {
        setHistoryLogs(res.data || []);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (showManageModal && selectedDepForManage?.id) {
      loadComments();
      loadHistory();
    }
  }, [showManageModal, selectedDepForManage?.id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanText = newCommentText.replace(/<[^>]*>/g, '').trim();
    if (!cleanText || !selectedDepForManage?.id || isSubmittingComment) return;
    setIsSubmittingComment(true);
    try {
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/comments`, {
        method: 'POST',
        body: JSON.stringify({ body: newCommentText })
      });
      if (res.success) {
        setNewCommentText('');
        addToast('Gửi bình luận thành công!', 'success');
        await Promise.all([loadComments(), loadHistory()]);
      } else {
        addToast(res.message || 'Lỗi gửi bình luận', 'error');
      }
    } catch (err: any) {
      addToast(err.message || 'Lỗi kết nối', 'error');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Check for pre-existing cooperation slip and load collaborators when selectedContactId changes
  useEffect(() => {
    if (!selectedContactId) {
      setHasExistingCoop(false);
      setExistingCoopShares([]);
      setAllowedCollaborators([]);
      setCollaboratorShares({});
      setIsCooperation(false);
      return;
    }

    const cid = Number(selectedContactId);
    
    // Auto-fill price (expected revenue) from contact details if available
    const matchedContact = contacts.find((c: any) => Number(c.id) === cid);
    if (matchedContact) {
      const defaultRevenue = matchedContact.expected_revenue || '';
      setPrice(String(defaultRevenue));
    }

    // 1. Load Collaborators strictly from quyen_truy_cap (Luật 4.5)
    fetchAPI(`contacts/${cid}/collaborators`)
      .then((res: any) => {
        if (res.success && res.data) {
          const owner = res.data.owner;
          const helpers = res.data.helpers || [];

          const colList: any[] = [];
          if (owner) {
            colList.push({
              id: String(owner.id),
              name: `${owner.full_name || owner.name || owner.username} (Chủ sở hữu)`,
              isOwner: true
            });
          }

          helpers.forEach((h: any) => {
            colList.push({
              id: String(h.user_id),
              name: h.full_name || h.name || h.username || `TVV ID: ${h.user_id}`,
              isOwner: false
            });
          });

          setAllowedCollaborators(colList);

          // Default initial shares: Owner gets 100%, others get 0%
          const initialShares: Record<string, number> = {};
          colList.forEach(c => {
            initialShares[c.id] = c.isOwner ? 100 : 0;
          });
          setCollaboratorShares(initialShares);
          setIsCooperation(false);
        }
      })
      .catch(() => {
        setAllowedCollaborators([]);
        setCollaboratorShares({});
      });

    // 2. Check for pre-existing cooperation slip
    const existing = coopSlips.find((s: any) => Number(s.contact_id) === cid);
    if (existing) {
      setHasExistingCoop(true);
      
      let parsedShares: Record<string, number> = {};
      try {
        parsedShares = typeof existing.shares_json === 'string' 
          ? JSON.parse(existing.shares_json) 
          : (existing.shares_json || {});
      } catch {
        parsedShares = {};
      }

      const sharesList = Object.entries(parsedShares).map(([uid, pct]) => {
        const u = usersList.find((x: any) => String(x.id) === String(uid));
        return {
          user_id: uid,
          name: u?.full_name || u?.name || u?.username || `ID: ${uid}`,
          percentage: pct
        };
      });

      setExistingCoopShares(sharesList);
    } else {
      setHasExistingCoop(false);
      setExistingCoopShares([]);
    }
  }, [selectedContactId, coopSlips, usersList]);

  const handleAddMilestoneInput = () => {
    setMilestonesInput(prev => [...prev, { name: `Đợt ${prev.length + 1}`, amount: '', expected_pay_date: '' }]);
  };

  const handleRemoveMilestoneInput = (index: number) => {
    setMilestonesInput(prev => prev.filter((_, i) => i !== index));
  };

  const handleCreateDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || !selectedProjectId || !price) {
      addToast('Vui lòng điền đầy đủ thông tin khách hàng, chương trình, giá bán', 'error');
      return;
    }

    if (!depositAccountantId) {
      addToast('Vui lòng chọn người duyệt', 'error');
      return;
    }

    if (!depositUncFile) {
      addToast('Vui lòng tải lên minh chứng chuyển khoản (UNC) Đợt 1 để tạo đơn hàng.', 'error');
      return;
    }

    // Verify milestones total sum
    const totalM = milestonesInput.reduce((acc, m) => acc + (parseFloat(m.amount) || 0), 0);
    if (totalM > parseFloat(price)) {
      addToast(`Tổng tiền các đợt thanh toán (${totalM.toLocaleString()} VND) không được lớn hơn Tổng doanh thu dự kiến (${parseFloat(price).toLocaleString()} VND)`, 'error');
      return;
    }

    // Verify cooperation shares sum
    if (!hasExistingCoop && isCooperation) {
      const sum = Object.values(collaboratorShares).reduce((acc, c) => acc + (c || 0), 0);
      if (sum !== 100) {
        addToast(`Tổng tỷ lệ chia sẻ hoa hồng phải bằng đúng 100% (Hiện tại là ${sum}%)`, 'error');
        return;
      }
    }

    if (isSaving) return;

    try {
      setIsSaving(true);
      const res = await fetchAPI('deposits', {
        method: 'POST',
        body: JSON.stringify({
          contact_id: selectedContactId,
          project_id: selectedProjectId,
          unit_code: unitCode || '—',
          price: parseFloat(price),
          expected_commission: parseFloat(expectedCommission) || 0,
          currency: currency,
          milestones: milestonesInput,
          is_cooperation: isCooperation,
          collaborators: isCooperation
            ? Object.entries(collaboratorShares).map(([uid, pct]) => ({
                user_id: uid,
                percentage: pct
              }))
            : [],
          auto_remind: autoRemind ? 1 : 0,
          remind_days_before: remindDaysBefore,
          remind_at_hour: remindAtHour,
          remind_target: remindTarget,
          notes: notes,
          accountant_id: Number(depositAccountantId)
        })
      });

      if (res.success) {
        const responseData = res.data || {};
        const createdDepositId = responseData.id;
        const createdMilestones = responseData.milestones || [];
        
        if (createdDepositId && createdMilestones.length > 0 && depositUncFile) {
          try {
            const compressedFile = await compressToWebP(depositUncFile);
            const formDataUpload = new FormData();
            formDataUpload.append('file', compressedFile);
            const token = localStorage.getItem('access_token') || localStorage.getItem('Ideas_token') || '';
            const uploadUrl = `${import.meta.env.VITE_API_URL || '/backend'}/api.php?action=deposits/${createdDepositId}/milestones/${createdMilestones[0].id}/unc&token=${token}`;
            
            const uploadRes = await fetch(uploadUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'X-Auth-Token': token
              },
              body: formDataUpload
            });
            
            const uploadJson = await uploadRes.json();
            if (!uploadJson.success) {
              addToast('Tạo đơn hàng thành công nhưng tải UNC thất bại: ' + uploadJson.message, 'warning');
            }
          } catch (uploadErr: any) {
            console.error('Error uploading UNC:', uploadErr);
          }
        }

        addToast('Tạo đơn đặt hàng và lịch thanh toán thành công!', 'success');
        setIsCreateOpen(false);
        // Reset Form
        setSelectedContactId('');
        setSelectedProjectId('');
        setUnitCode('');
        setPrice('');
        setExpectedCommission('');
        setNotes('');
        setCurrency('VND');
        setMilestonesInput([{ name: 'Đợt 1 - Thanh toán cọc', amount: '', expected_pay_date: '' }]);
        setIsCooperation(false);
        setAllowedCollaborators([]);
        setCollaboratorShares({});
        setAutoRemind(true);
        setRemindDaysBefore(3);
        setRemindAtHour(8);
        setRemindTarget(1);
        setDepositAccountantId('');
        setDepositUncFile(null);
        loadData();
      } else {
        addToast(res.message || 'Lỗi tạo đơn đặt hàng', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUploadUnc = async (e: React.ChangeEvent<HTMLInputElement>, depositId: number, milestoneId: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const compressedFile = await compressToWebP(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const token = localStorage.getItem('access_token') || localStorage.getItem('Ideas_token') || '';
      const url = `${import.meta.env.VITE_API_URL || '/backend'}/api.php?action=deposits/${depositId}/milestones/${milestoneId}/unc&token=${token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token
        },
        body: formData
      });

      const res = await response.json();
      if (res.success) {
        addToast('Tải ảnh UNC thành công, vui lòng chờ Admin duyệt', 'success');
        loadData();
      } else {
        addToast(res.message || 'Lỗi tải UNC', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    }
  };

  const handleApproveMilestone = async (depositId: number, milestoneId: number) => {
    try {
      const res = await fetchAPI(`deposits/${depositId}/milestones/${milestoneId}/approve`, { method: 'POST' });
      if (res.success) {
        addToast('Phê duyệt đợt tiền thành công!', 'success');
        loadData();
      } else {
        addToast(res.message || 'Lỗi phê duyệt', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    }
  };

  const handleRejectMilestone = (depositId: number, milestoneId: number) => {
    showConfirm({
      title: 'Từ chối UNC',
      message: 'Vui lòng nhập lý do từ chối bản xác nhận thanh toán này:',
      confirmText: 'Từ chối UNC',
      cancelText: 'Hủy',
      isDanger: true,
      requirePromptInput: true,
      promptPlaceholder: 'Nhập lý do từ chối (bắt buộc)...',
      onConfirm: async (reason) => {
        try {
          const res = await fetchAPI(`deposits/${depositId}/milestones/${milestoneId}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason || 'UNC không hợp lệ' })
          });
          if (res.success) {
            addToast('Đã từ chối UNC thành công', 'success');
            loadData();
          } else {
            addToast(res.message || 'Lỗi xử lý', 'error');
          }
        } catch (e: any) {
          addToast(e.message || 'Lỗi kết nối', 'error');
        }
      }
    });
  };

  const handleOpenCancel = (depositId: number) => {
    setCancelDepositId(depositId);
    setCancelReason('');
    setIsCancelOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelDepositId || !cancelReason || isSaving) return;

    try {
      setIsSaving(true);
      const res = await fetchAPI(`deposits/${cancelDepositId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });

      if (res.success) {
        addToast('Đã hủy giao dịch thành công', 'success');
        setIsCancelOpen(false);
        setShowManageModal(false);
        loadData();
      } else {
        addToast(res.message || 'Lỗi báo hủy', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenManageMilestones = (dep: Deposit) => {
    setSelectedDepForManage(dep);
    setTempMilestones((dep.milestones || []).map(m => ({ ...m })));
    setShowManageModal(true);
  };

  const handleAddMilestoneRow = () => {
    setTempMilestones([
      ...tempMilestones,
      {
        tempId: Date.now() + Math.random(),
        milestone_name: `Đợt ${tempMilestones.length + 1}`,
        expected_amount: 0,
        status: 'pending'
      }
    ]);
  };

  const handleUpdateMilestoneField = (index: number, field: string, value: any) => {
    const updated = [...tempMilestones];
    updated[index] = { ...updated[index], [field]: value };
    setTempMilestones(updated);
  };

  const handleRemoveMilestoneRow = (index: number) => {
    showConfirm({
      title: 'Xóa đợt thanh toán',
      message: 'Bạn có chắc chắn muốn xóa đợt thanh toán này?',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      isDanger: true,
      onConfirm: () => {
        const updated = [...tempMilestones];
        updated.splice(index, 1);
        setTempMilestones(updated);
        return Promise.resolve();
      }
    });
  };

  const handleUploadUncFromModal = async (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      const compressedFile = await compressToWebP(file);
      const formData = new FormData();
      formData.append('file', compressedFile);
      const token = localStorage.getItem('access_token') || localStorage.getItem('Ideas_token') || '';
      const url = `${import.meta.env.VITE_API_URL || '/backend'}/api.php?action=upload&token=${token}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'X-Auth-Token': token
        },
        body: formData
      });

      const res = await response.json();
      if (res.success && res.data?.url) {
        addToast('Tải ảnh UNC thành công! Hãy nhấn "Lưu lịch trình" để hoàn tất lưu.', 'success');
        const updated = [...tempMilestones];
        updated[index] = { ...updated[index], status: 'paid', unc_file_path: res.data.url };
        setTempMilestones(updated);
      } else {
        addToast(res.message || 'Lỗi tải UNC', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    }
  };

  const handleApproveFromModal = async (index: number) => {
    const m = tempMilestones[index];
    if (!selectedDepForManage || !m.id) return;
    if (actioningMilestoneId !== null) return;
    setActioningMilestoneId(m.id);
    setActioningType('approve');
    try {
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/milestones/${m.id}/approve`, { method: 'POST' });
      if (res.success) {
        addToast('Phê duyệt đợt tiền thành công!', 'success');
        const updated = [...tempMilestones];
        updated[index] = { ...updated[index], status: 'approved' };
        setTempMilestones(updated);
        loadData();
      } else {
        addToast(res.message || 'Lỗi phê duyệt', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setActioningMilestoneId(null);
      setActioningType(null);
    }
  };

  const handleRejectFromModal = async (index: number) => {
    const m = tempMilestones[index];
    if (!selectedDepForManage || !m.id) return;
    if (actioningMilestoneId !== null) return;
    showConfirm({
      title: 'Từ chối UNC',
      message: 'Vui lòng nhập lý do từ chối bản xác nhận thanh toán này:',
      confirmText: 'Từ chối UNC',
      cancelText: 'Hủy',
      isDanger: true,
      requirePromptInput: true,
      promptPlaceholder: 'Nhập lý do từ chối (bắt buộc)...',
      onConfirm: async (reason) => {
        setActioningMilestoneId(m.id);
        setActioningType('reject');
        try {
          const res = await fetchAPI(`deposits/${selectedDepForManage.id}/milestones/${m.id}/reject`, {
            method: 'POST',
            body: JSON.stringify({ reason: reason || 'UNC không hợp lệ' })
          });
          if (res.success) {
            addToast('Đã từ chối UNC thành công', 'success');
            const updated = [...tempMilestones];
            updated[index] = { ...updated[index], status: 'failed' };
            setTempMilestones(updated);
            loadData();
          } else {
            addToast(res.message || 'Lỗi xử lý', 'error');
          }
        } catch (e: any) {
          addToast(e.message || 'Lỗi kết nối', 'error');
        } finally {
          setActioningMilestoneId(null);
          setActioningType(null);
        }
      }
    });
  };

  const handleSaveMilestones = async () => {
    if (!selectedDepForManage) return;
    for (let m of tempMilestones) {
      if (!m.milestone_name.trim()) {
        addToast('Tên đợt không được để trống.', 'error');
        return;
      }
    }

    const totalM = tempMilestones.reduce((acc, m) => acc + (parseFloat(String(m.expected_amount)) || 0), 0);
    if (totalM > parseFloat(String(selectedDepForManage.price))) {
      addToast(`Tổng tiền các đợt thanh toán (${totalM.toLocaleString()} VND) không được lớn hơn Tổng doanh thu dự kiến (${parseFloat(String(selectedDepForManage.price)).toLocaleString()} VND)`, 'error');
      return;
    }

    const hasProof = tempMilestones.some(m => m.unc_file_path && m.unc_file_path.trim() !== '');
    if (!hasProof) {
      addToast('Lịch trình thanh toán bắt buộc phải có ít nhất 1 minh chứng.', 'error');
      return;
    }

    for (let m of tempMilestones) {
      if ((m.status === 'paid' || m.status === 'approved') && (!m.unc_file_path || !m.unc_file_path.trim())) {
        addToast(`Đợt thanh toán "${m.milestone_name}" ở trạng thái đã đóng/đã duyệt bắt buộc phải có file minh chứng đính kèm.`, 'error');
        return;
      }
    }

    if (isAdmin && tempSharesData && tempSharesData.length > 0) {
      const totalPct = tempSharesData.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
      if (totalPct !== 100) {
        addToast('Tổng tỷ lệ chia sẻ hoa hồng phải bằng 100%.', 'error');
        return;
      }
    }

    try {
      setIsSavingMilestones(true);
      const payload: any = {
        milestones: tempMilestones,
        auto_remind: autoRemindManage ? 1 : 0,
        remind_days_before: remindDaysBeforeManage,
        remind_at_hour: remindAtHourManage,
        remind_target: remindTargetManage
      };
      if (isAdmin) {
        payload.expected_commission = tempExpectedCommission;
        payload.shares = tempSharesData.map(sh => ({
          user_id: sh.user_id,
          percentage: sh.percentage
        }));
      }
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/milestones`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });
      if (res.success) {
        addToast('Cập nhật lịch trình thanh toán thành công!', 'success');
        setShowManageModal(false);
        loadData();
      } else {
        addToast(res.message || 'Lỗi khi lưu lịch trình', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setIsSavingMilestones(false);
    }
  };

  const handleSendManualReminder = async (milestoneId: number) => {
    if (!selectedDepForManage || sendingReminderId !== null) return;
    try {
      setSendingReminderId(milestoneId);
      const res = await fetchAPI(`deposits/${selectedDepForManage.id}/milestones/${milestoneId}/remind`, {
        method: 'POST'
      });
      if (res.success) {
        addToast(res.message || 'Đã gửi email nhắc thanh toán thành công!', 'success');
      } else {
        addToast(res.message || 'Lỗi gửi nhắc nhở thanh toán', 'error');
      }
    } catch (e: any) {
      addToast(e.message || 'Lỗi kết nối', 'error');
    } finally {
      setSendingReminderId(null);
    }
  };

  const projectedReceivables = React.useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const map: Record<string, { date: string; totalAmount: number; milestones: any[] }> = {};

    deposits.forEach(d => {
      if (d.milestones && d.milestones.length > 0) {
        d.milestones.forEach(m => {
          if (m.status !== 'approved' && m.expected_pay_date) {
            const dateStr = m.expected_pay_date.substring(0, 10);
            if (dateStr >= todayStr) {
              if (!map[dateStr]) {
                map[dateStr] = {
                  date: dateStr,
                  totalAmount: 0,
                  milestones: []
                };
              }
              map[dateStr].totalAmount += Number(m.expected_amount) || 0;
              map[dateStr].milestones.push({
                ...m,
                customerName: `${d.last_name} ${d.first_name}`,
                phone: d.phone,
                unitCode: d.unit_code,
                projectName: d.project_name
              });
            }
          }
        });
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [deposits]);

  const projectedExpenditures = React.useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    const map: Record<string, { date: string; totalAmount: number; items: any[] }> = {};

    const expList = Array.isArray(expenses) ? expenses : [];
    const poList = Array.isArray(purchaseOrders) ? purchaseOrders : [];

    // 1. Add pending expenses
    expList.forEach(e => {
      if (e.status === 'pending' && e.date) {
        const dateStr = e.date.substring(0, 10);
        if (dateStr >= todayStr) {
          if (!map[dateStr]) {
            map[dateStr] = { date: dateStr, totalAmount: 0, items: [] };
          }
          map[dateStr].totalAmount += Number(e.amount) || 0;
          map[dateStr].items.push({
            type: 'Expense',
            title: e.title,
            category: e.category,
            amount: Number(e.amount) || 0,
            vendor: e.vendor_name || 'Khác'
          });
        }
      }
    });

    // 2. Add unpaid/partial POs
    poList.forEach(po => {
      if (po.payment_status !== 'paid' && po.order_date) {
        const dateStr = po.order_date.substring(0, 10);
        if (dateStr >= todayStr) {
          const unpaid = (Number(po.total) || 0) - (Number(po.paid_amount) || 0);
          if (unpaid > 0) {
            if (!map[dateStr]) {
              map[dateStr] = { date: dateStr, totalAmount: 0, items: [] };
            }
            map[dateStr].totalAmount += unpaid;
            map[dateStr].items.push({
              type: 'PO',
              title: `Đơn mua hàng: ${po.po_number}`,
              category: 'Mua hàng',
              amount: unpaid,
              vendor: po.supplier_name || 'Nhà cung cấp'
            });
          }
        }
      }
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [expenses, purchaseOrders]);

  const projectedRec7Days = React.useMemo(() => {
    return projectedReceivables.filter(r => {
      const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    }).reduce((sum, r) => sum + r.totalAmount, 0);
  }, [projectedReceivables]);

  const projectedRec30Days = React.useMemo(() => {
    return projectedReceivables.filter(r => {
      const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff <= 30;
    }).reduce((sum, r) => sum + r.totalAmount, 0);
  }, [projectedReceivables]);

  const projectedExp7Days = React.useMemo(() => {
    return projectedExpenditures.filter(r => {
      const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff <= 7;
    }).reduce((sum, r) => sum + r.totalAmount, 0);
  }, [projectedExpenditures]);

  const projectedExp30Days = React.useMemo(() => {
    return projectedExpenditures.filter(r => {
      const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
      return diff <= 30;
    }).reduce((sum, r) => sum + r.totalAmount, 0);
  }, [projectedExpenditures]);

  const forecastChartData = React.useMemo(() => {
    const data: any[] = [];
    const today = new Date();
    
    for (let i = 0; i < 30; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const dateStr = d.toISOString().substring(0, 10);
      
      const rec = projectedReceivables.find(r => r.date === dateStr);
      const recAmount = rec ? rec.totalAmount : 0;
      
      const exp = projectedExpenditures.find(e => e.date === dateStr);
      const expAmount = exp ? exp.totalAmount : 0;
      
      const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      
      data.push({
        date: dateStr,
        label,
        'Dự thu': recAmount,
        'Dự chi': expAmount,
        'Dòng tiền ròng': recAmount - expAmount
      });
    }
    
    return data;
  }, [projectedReceivables, projectedExpenditures]);

  const cumulativeChartData = React.useMemo(() => {
    let acc = 0;
    return forecastChartData.map(d => {
      acc += d['Dòng tiền ròng'];
      return { ...d, 'Tích lũy': acc };
    });
  }, [forecastChartData]);

  const unifiedTimeline = React.useMemo(() => {
    const map: Record<string, { date: string; receiptTotal: number; expenditureTotal: number; items: any[] }> = {};

    projectedReceivables.forEach(r => {
      if (!map[r.date]) {
        map[r.date] = { date: r.date, receiptTotal: 0, expenditureTotal: 0, items: [] };
      }
      map[r.date].receiptTotal += r.totalAmount;
      r.milestones.forEach((m: any) => {
        map[r.date].items.push({
          type: 'receipt',
          title: `Dự thu: ${m.customerName} (${m.unitCode || 'Không có mã căn'})`,
          desc: `${m.projectName || 'Dự án'} - Đợt thanh toán: ${m.milestone_name}`,
          amount: Number(m.expected_amount) || 0
        });
      });
    });

    projectedExpenditures.forEach(e => {
      if (!map[e.date]) {
        map[e.date] = { date: e.date, receiptTotal: 0, expenditureTotal: 0, items: [] };
      }
      map[e.date].expenditureTotal += e.totalAmount;
      e.items.forEach((item: any) => {
        map[e.date].items.push({
          type: 'expenditure',
          title: item.title,
          desc: `${item.category} - ${item.vendor}`,
          amount: Number(item.amount) || 0
        });
      });
    });

    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  }, [projectedReceivables, projectedExpenditures]);

  return (
    <div className="anim-fade-up" style={{ color: 'var(--color-text)', display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Notifications */}

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {t("Quản lý thanh toán")}
            <button
              onClick={() => setShowInfoModal(true)}
              style={{
                background: 'rgba(0, 0, 0, 0.02)',
                border: '1px solid var(--color-border)',
                padding: '3px 8px',
                borderRadius: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                cursor: 'pointer',
                color: 'var(--color-text-muted)',
                transition: 'all 0.2s',
                height: '24px'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = 'var(--color-primary)';
                e.currentTarget.style.borderColor = 'var(--color-primary-light)';
                e.currentTarget.style.background = 'var(--color-primary-light)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = 'var(--color-text-muted)';
                e.currentTarget.style.borderColor = 'var(--color-border)';
                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.02)';
              }}
              title={t("Xem hướng dẫn quy tắc đặt hàng & đổi sản phẩm")}
            >
              <Info size={12} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{t("Giải thích cơ chế")}</span>
            </button>
          </h1>
          <p className="page-subtitle">{t("Theo dõi đơn hàng, tiến độ thanh toán và duyệt UNC")}</p>
        </div>
        {!isViewer && (
          <button
            onClick={() => setIsCreateOpen(true)}
            className="btn primary"
            style={{ height: '38px' }}
          >
            <Plus size={16} />
            Tạo đơn hàng mới
          </button>
        )}
      </div>

      {/* Tab Switcher */}
      {isAdmin && (
        <div style={{ 
          display: 'flex',
          background: 'var(--color-border-light)',
          border: '1px solid var(--color-border)',
          padding: '2px',
          borderRadius: '8px',
          gap: '2px',
          width: 'fit-content',
          position: 'relative',
          marginBottom: '1.5rem'
        }}>
          <button
            onClick={() => setActiveViewTab('list')}
            style={{
              padding: '6px 16px',
              height: '34px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeViewTab === 'list' ? 'var(--color-surface)' : 'transparent',
              color: activeViewTab === 'list' ? 'var(--color-text)' : 'var(--color-text-light)',
              boxShadow: activeViewTab === 'list' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Danh sách thanh toán
          </button>
          <button
            onClick={() => setActiveViewTab('stats')}
            style={{
              padding: '6px 16px',
              height: '34px',
              borderRadius: '6px',
              border: 'none',
              fontSize: '0.85rem',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeViewTab === 'stats' ? 'var(--color-surface)' : 'transparent',
              color: activeViewTab === 'stats' ? 'var(--color-text)' : 'var(--color-text-light)',
              boxShadow: activeViewTab === 'stats' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}
          >
            Dự báo dòng tiền
          </button>
        </div>
      )}

      {activeViewTab === 'list' ? (
        <>
          {/* Search & Filter Bar */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '12px', 
            marginBottom: '1.25rem', 
            alignItems: 'center',
            background: 'var(--color-surface)',
            padding: '12px',
            borderRadius: '12px',
            border: '1px solid var(--color-border-light)'
          }}>
            <div style={{ position: 'relative', flex: '1', minWidth: '240px' }}>
              <input
                type="text"
                placeholder={t("Tìm kiếm theo khách hàng, số điện thoại...")}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input"
                style={{ width: '100%', paddingRight: '2.5rem', paddingLeft: '12px', height: '38px', borderRadius: '10px', margin: 0 }}
              />
              <Search style={{ position: 'absolute', right: '12px', top: '11px', color: 'var(--color-text-muted)' }} size={16} />
            </div>

            {/* Project Filter */}
            <div style={{ width: '200px' }}>
              <select
                value={filterProjectId}
                onChange={(e) => setFilterProjectId(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '38px', borderRadius: '10px', margin: 0, padding: '0 10px' }}
              >
                <option value="">{t("Tất cả chương trình")}</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div style={{ width: '180px' }}>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="form-input"
                style={{ width: '100%', height: '38px', borderRadius: '10px', margin: 0, padding: '0 10px' }}
              >
                <option value="">{t("Tất cả trạng thái")}</option>
                <option value="pending_admin">{t("Đang giao dịch")}</option>
                <option value="approved">{t("Hoàn tất")}</option>
                <option value="cancelled">{t("Đã hủy")}</option>
              </select>
            </div>
          </div>

          {/* List */}
          {loading ? (
            <TableSkeleton rows={5} cols={5} />
          ) : filteredDepositsList.length === 0 ? (
            <EmptyCard
              icon={<CreditCard />}
              title="Chưa có phiếu thanh toán nào"
              description="Theo dõi đơn hàng, tiến độ thanh toán và duyệt Ủy nhiệm chi (UNC)."
              actionText={isViewer ? undefined : "Tạo đơn hàng mới"}
              onAction={isViewer ? undefined : () => setIsCreateOpen(true)}
            />
          ) : (
            <>
            <div className="card" style={{ padding: 0, borderRadius: '16px', border: '1px solid var(--color-border-light)', overflow: 'hidden', background: 'var(--color-surface)', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
              <div className="table-wrap" style={{ maxHeight: '480px', overflowY: 'auto', overflowX: 'auto' }}>
                <table className="w-full text-left" style={{ borderCollapse: 'collapse', minWidth: 900 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '240px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Khách hàng / Chương trình</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '240px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Sale / Ngày tạo</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '160px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Giá trị</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '140px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Thanh toán gần nhất</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '130px', textAlign: 'center', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Trạng thái</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Tiến độ</th>
                      <th style={{ padding: '1rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.5px', width: '100px', textAlign: 'right', position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-bg)', borderBottom: '1px solid var(--color-border)' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                {paginatedDeposits.map(dep => {
                  let statusText = 'Đang giao dịch';
                  let statusBg = 'rgba(245, 158, 11, 0.08)';
                  let statusColor = '#d97706';

                  if (dep.status === 'approved') {
                    statusText = 'Hoàn tất';
                    statusBg = 'rgba(16, 185, 129, 0.08)';
                    statusColor = '#059669';
                  } else if (dep.status === 'cancelled') {
                    statusText = 'Đã hủy';
                    statusBg = 'rgba(239, 68, 68, 0.08)';
                    statusColor = '#dc2626';
                  }

                  return (
                    <tr 
                      key={dep.id} 
                      style={{ borderBottom: '1px solid var(--color-border)', transition: 'background 0.2s', cursor: 'pointer' }}
                      className="table-row-hover"
                      onClick={() => handleOpenManageMilestones(dep)}
                    >
                      {/* Client / Program */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar src={dep.avatar_url} name={`${dep.last_name || ''} ${dep.first_name || ''}`} size="sm" style={{ width: 24, height: 24, fontSize: 10 }} />
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            {dep.last_name} {dep.first_name}
                          </span>
                        </div>
                        <div style={{ fontWeight: 600, color: 'var(--color-text-light)', fontSize: '0.75rem', marginTop: '4px', paddingLeft: '32px' }}>
                          <span>{dep.project_name}</span>
                        </div>
                      </td>

                      {/* Sale / Date Created */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar src={dep.creator_avatar} name={dep.creator_name || 'Sale'} size="sm" style={{ width: 24, height: 24, fontSize: 10 }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text)' }}>
                            {dep.creator_name || '—'}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', marginTop: '4px', paddingLeft: '32px' }}>
                          {new Date(dep.created_at).toLocaleDateString('vi-VN')} {new Date(dep.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Value */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        <div style={{ fontWeight: 600, color: 'var(--color-text)', fontSize: '0.875rem' }}>
                          {formatMoney(dep.price, dep.currency)}
                        </div>
                      </td>

                      {/* Nearest Payment Date */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        {(() => {
                          const ms = dep.milestones || [];
                          if (ms.length === 0) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>;

                          const allApproved = ms.every((m: any) => m.status === 'approved');
                          if (allApproved) {
                            const dates = ms.map((m: any) => m.paid_at || m.updated_at || m.expected_pay_date).filter(Boolean);
                            const latestDate = dates.length > 0 ? new Date(Math.max(...dates.map(d => new Date(d).getTime()))) : null;
                            const latestDateStr = latestDate ? latestDate.toLocaleDateString('vi-VN') : '—';
                            return (
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#10b981', display: 'block' }}>Ngày {latestDateStr}</span>
                                <span style={{ fontSize: '0.725rem', color: '#10b981', display: 'block', marginTop: '2px', fontWeight: 700 }}>Đã thu hết</span>
                              </div>
                            );
                          }

                          const unpaid = ms.filter((m: any) => m.status !== 'approved');
                          const validUnpaid = unpaid.filter((m: any) => m.expected_pay_date);
                          if (validUnpaid.length === 0) return <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem' }}>—</span>;

                          const sortedUnpaid = [...validUnpaid].sort((a, b) => new Date(a.expected_pay_date).getTime() - new Date(b.expected_pay_date).getTime());
                          const nearestM = sortedUnpaid[0];

                          const payDate = new Date(nearestM.expected_pay_date);
                          payDate.setHours(0, 0, 0, 0);
                          const today = new Date();
                          today.setHours(0, 0, 0, 0);
                          const diffTime = payDate.getTime() - today.getTime();
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                          const payDateStr = payDate.toLocaleDateString('vi-VN');

                          if (diffDays > 0) {
                            return (
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)', display: 'block' }}>{payDateStr}</span>
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', display: 'block', marginTop: '2px' }}>Còn {diffDays} ngày nữa</span>
                              </div>
                            );
                          } else if (diffDays === 0) {
                            return (
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#d97706', display: 'block' }}>{payDateStr}</span>
                                <span style={{ fontSize: '0.725rem', color: '#d97706', display: 'block', marginTop: '2px', fontWeight: 600 }}>Hạn hôm nay</span>
                              </div>
                            );
                          } else {
                            return (
                              <div>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#dc2626', display: 'block' }}>{payDateStr}</span>
                                <span style={{ fontSize: '0.725rem', color: '#dc2626', display: 'block', marginTop: '2px', fontWeight: 700 }}>Trễ {Math.abs(diffDays)} ngày</span>
                              </div>
                            );
                          }
                        })()}
                      </td>

                      {/* Status */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'center' }}>
                        <span
                          style={{
                            background: statusBg,
                            color: statusColor,
                            border: `1px solid ${statusColor}18`,
                            padding: '4px 10px',
                            borderRadius: '9999px',
                            fontSize: '0.725rem',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                        >
                          {statusText}
                        </span>
                      </td>

                      {/* Milestones steps formatted as approved/total (mấy trên mấy) */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle' }}>
                        {(() => {
                          const approvedCount = dep.milestones.filter(m => m.status === 'approved').length;
                          const totalCount = dep.milestones.length;
                          const isFullyApproved = approvedCount === totalCount;
                          const pillColor = isFullyApproved ? '#10b981' : '#2563eb';
                          return (
                            <span style={{
                              background: `${pillColor}08`,
                              color: pillColor,
                              border: `1px solid ${pillColor}15`,
                              padding: '4px 10px',
                              borderRadius: '8px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px'
                            }}>
                              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: pillColor }} />
                              {approvedCount} / {totalCount}
                            </span>
                          );
                        })()}
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '1rem', verticalAlign: 'middle', textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'inline-flex', gap: '8px', alignItems: 'center', justifyContent: 'flex-end' }}>
                          {/* Update Button */}
                          {dep.status !== 'cancelled' && (() => {
                            const isCreator = String(dep.created_by) === String(user?.id);
                            const isOwner = String(dep.contact_owner_id) === String(user?.id);
                            const isStaff = user && ['admin', 'superadmin', 'super_admin', 'assistant', 'manager', 'director', 'accountant'].includes(user.role);
                            
                            if (isStaff || isCreator || isOwner) {
                              return (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenManageMilestones(dep);
                                  }}
                                  style={{
                                    padding: '6px',
                                    height: '32px',
                                    width: '32px',
                                    background: 'transparent',
                                    border: 'none',
                                    color: '#64748b',
                                    borderRadius: '50%',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                  className="hover-bg-muted"
                                >
                                  <Edit size={16} />
                                </button>
                              );
                            }
                            return null;
                          })()}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              padding: '1rem 1.25rem', 
              borderTop: '1px solid var(--color-border-light)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between', 
              background: 'var(--color-surface)',
              borderBottomLeftRadius: '16px',
              borderBottomRightRadius: '16px'
            }}>
              <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                Hiển thị <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> - <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{Math.min(currentPage * ITEMS_PER_PAGE, filteredDepositsList.length)}</span> trên <span style={{ fontWeight: 700, color: 'var(--color-text)' }}>{filteredDepositsList.length}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} 
                  disabled={currentPage === 1} 
                  className="btn sm outline" 
                  style={{ height: 32, width: 32, padding: 0, minWidth: 32, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronLeft size={16} />
                </button>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(() => {
                    const maxVisible = 5;
                    let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
                    let end = Math.min(totalPages, start + maxVisible - 1);
                    if (end - start + 1 < maxVisible) {
                      start = Math.max(1, end - maxVisible + 1);
                    }
                    const pageNumbers = [];
                    for (let p = start; p <= end; p++) {
                      pageNumbers.push(p);
                    }
                    return pageNumbers.map((pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        style={{
                          width: 32, height: 32, borderRadius: 8, fontSize: '0.8125rem', fontWeight: 700,
                          border: currentPage === pageNum ? 'none' : '1px solid var(--color-border-light)',
                          background: currentPage === pageNum ? 'var(--color-primary)' : 'var(--color-surface)',
                          color: currentPage === pageNum ? 'white' : 'var(--color-text-muted)',
                          cursor: 'pointer',
                          transition: 'all 0.15s'
                        }}
                        className={currentPage === pageNum ? '' : 'hover-lift'}
                      >
                        {pageNum}
                      </button>
                    ));
                  })()}
                </div>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} 
                  disabled={currentPage === totalPages} 
                  className="btn sm outline" 
                  style={{ height: 32, width: 32, padding: 0, minWidth: 32, borderRadius: '8px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
            </>
          )}
        </>
      ) : (
        <div className="animate-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* Summary Cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem' }}>
            {/* Card 1: Dự thu 7 ngày tới */}
            <div className="stat-card hover-lift" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px' }}>
              <div className="decor-svg" style={{ color: '#2563eb', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                <DollarSign size={70} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Dự thu 7 ngày tới</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(37, 99, 235, 0.08)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TrendingUp size={16} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-text)', margin: '4px 0', fontSize: '1.45rem', fontWeight: 800 }}>
                {projectedRec7Days.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '8px', fontWeight: 600 }}>
                Có {projectedReceivables.filter(r => {
                  const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                  return diff <= 7;
                }).reduce((sum, r) => sum + r.milestones.length, 0)} đợt dự kiến thu
              </div>
              <div className="stat-change up" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <span>Dòng tiền dự kiến tăng</span>
              </div>
            </div>

            {/* Card 2: Dự thu 30 ngày tới */}
            <div className="stat-card hover-lift" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px' }}>
              <div className="decor-svg" style={{ color: '#10b981', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                <Calendar size={70} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Dự thu 30 ngày tới</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Calendar size={16} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-text)', margin: '4px 0', fontSize: '1.45rem', fontWeight: 800 }}>
                {projectedRec30Days.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '8px', fontWeight: 600 }}>
                Có {projectedReceivables.filter(r => {
                  const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                  return diff <= 30;
                }).reduce((sum, r) => sum + r.milestones.length, 0)} đợt dự kiến thu
              </div>
              <div className="stat-change up" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-success)', fontWeight: 700 }}>
                <span>Chu kỳ thanh toán 30 ngày</span>
              </div>
            </div>

            {/* Card 3: Dự chi 7 ngày tới */}
            <div className="stat-card hover-lift" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px' }}>
              <div className="decor-svg" style={{ color: '#d97706', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                <CreditCard size={70} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Dự chi 7 ngày tới</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(245, 158, 11, 0.08)', color: '#d97706', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCard size={16} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-text)', margin: '4px 0', fontSize: '1.45rem', fontWeight: 800 }}>
                {projectedExp7Days.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '8px', fontWeight: 600 }}>
                Có {projectedExpenditures.filter(r => {
                  const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                  return diff <= 7;
                }).reduce((sum, r) => sum + r.items.length, 0)} khoản PO/chi phí
              </div>
              <div className="stat-change down" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-warning)', fontWeight: 700 }}>
                <span>Dòng tiền dự kiến chi</span>
              </div>
            </div>

            {/* Card 4: Dự chi 30 ngày tới */}
            <div className="stat-card hover-lift" style={{ minHeight: '140px', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', padding: '1.25rem', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px' }}>
              <div className="decor-svg" style={{ color: '#ef4444', opacity: 0.05, position: 'absolute', right: -10, bottom: -10, pointerEvents: 'none' }}>
                <AlertCircle size={70} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>Dự chi 30 ngày tới</span>
                <div style={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={16} />
                </div>
              </div>
              <div className="stat-value" style={{ color: 'var(--color-text)', margin: '4px 0', fontSize: '1.45rem', fontWeight: 800 }}>
                {projectedExp30Days.toLocaleString('vi-VN')} đ
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '4px', marginBottom: '8px', fontWeight: 600 }}>
                Có {projectedExpenditures.filter(r => {
                  const diff = (new Date(r.date).getTime() - new Date().getTime()) / (1000 * 3600 * 24);
                  return diff <= 30;
                }).reduce((sum, r) => sum + r.items.length, 0)} khoản PO/chi phí
              </div>
              <div className="stat-change down" style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', color: 'var(--color-danger)', fontWeight: 700 }}>
                <span>Cam kết chi tiêu 30 ngày</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.25rem' }}>
            {/* Chart 1: Xu hướng dự thu và dự chi */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border-light)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--color-text)' }}>Xu hướng Dự thu & Dự chi (30 ngày tới)</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Đơn vị: VND</span>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={forecastChartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-text-muted)" />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="var(--color-text-muted)" 
                      tickFormatter={(val) => val >= 1000000 ? `${(val / 1000000).toFixed(0)}M` : val.toLocaleString()} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [Number(value).toLocaleString() + ' đ']} 
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Bar dataKey="Dự thu" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={15} />
                    <Bar dataKey="Dự chi" fill="#f59e0b" radius={[4, 4, 0, 0]} maxBarSize={15} />
                    <Line type="monotone" dataKey="Dòng tiền ròng" stroke="#3b82f6" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Dòng tiền ròng tích lũy */}
            <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border-light)', background: 'var(--color-surface)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 800, fontSize: '1.05rem', margin: 0, color: 'var(--color-text)' }}>Dự báo Dòng tiền ròng Tích lũy</h3>
                <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)' }}>Đơn vị: VND</span>
              </div>
              <div style={{ width: '100%', height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart 
                    data={cumulativeChartData} 
                    margin={{ top: 10, right: 10, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border-light)" />
                    <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} stroke="var(--color-text-muted)" />
                    <YAxis 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      stroke="var(--color-text-muted)" 
                      tickFormatter={(val) => val >= 1000000 || val <= -1000000 ? `${(val / 1000000).toFixed(0)}M` : val.toLocaleString()} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [Number(value).toLocaleString() + ' đ']} 
                      contentStyle={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '11px', color: 'var(--color-text)' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600 }} />
                    <Area type="monotone" dataKey="Tích lũy" fill="rgba(59, 130, 246, 0.05)" stroke="#3b82f6" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* List by date */}
          <div className="card" style={{ padding: '1.5rem', borderRadius: '16px', border: '1px solid var(--color-border-light)', background: 'var(--color-surface)' }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: '1.25rem', color: 'var(--color-text)' }}>Dự báo Dòng tiền chi tiết theo ngày</h3>
            {unifiedTimeline.length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                Không có khoản dự thu hay dự chi nào trong tương lai.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {unifiedTimeline.map(r => (
                  <div key={r.date} style={{ borderBottom: '1px solid var(--color-border-light)', paddingBottom: '1.25rem' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', gap: '8px' }}>
                      <span style={{ fontWeight: 800, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.95rem' }}>
                        <Calendar size={16} style={{ color: 'var(--color-primary)' }} />
                        {new Date(r.date).toLocaleDateString('vi-VN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </span>
                      <div style={{ display: 'flex', gap: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                        {r.receiptTotal > 0 && <span style={{ color: 'var(--color-success)' }}>Thu: +{r.receiptTotal.toLocaleString('vi-VN')} đ</span>}
                        {r.expenditureTotal > 0 && <span style={{ color: 'var(--color-warning)' }}>Chi: -{r.expenditureTotal.toLocaleString('vi-VN')} đ</span>}
                        <span style={{ color: 'var(--color-primary)' }}>Ròng: {(r.receiptTotal - r.expenditureTotal).toLocaleString('vi-VN')} đ</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', paddingLeft: '1.5rem' }}>
                      {r.items.map((item, idx) => (
                        <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-bg)', padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--color-border-light)' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--color-text)' }}>{item.title}</span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>{item.desc}</span>
                          </div>
                          <span style={{ 
                            fontWeight: 800, 
                            fontSize: '0.9rem',
                            color: item.type === 'receipt' ? 'var(--color-success)' : 'var(--color-danger)'
                          }}>
                            {item.type === 'receipt' ? '+' : '-'}{item.amount.toLocaleString('vi-VN')} đ
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {createPortal(
        <AnimatePresence>
          {isCreateOpen && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000090, display: 'flex', justifyContent: 'flex-end' }}>
            {/* Backdrop Overlay */}
            <motion.div
              className="drawer-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.4)',
                backdropFilter: 'blur(4px)',
                zIndex: 1000095
              }}
            />

            {/* Drawer Sheet Panel */}
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
                backgroundColor: 'var(--color-surface)',
                boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 1000100,
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'linear-gradient(to right, var(--color-bg), var(--color-surface))',
                flexShrink: 0
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                  {/* Close Button as "<" ChevronLeft on the Left */}
                  <button 
                    type="button"
                    onClick={() => setIsCreateOpen(false)}
                    style={{
                      padding: '8px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: 'var(--color-text)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0
                    }}
                    className="hover-bg-muted"
                    title="Quay lại"
                  >
                    <ChevronLeft size={20} />
                  </button>

                  <div style={{ minWidth: 0 }}>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem', margin: 0, color: 'var(--color-text)' }}>
                      Tạo phiếu thanh toán mới
                    </h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 4, marginBottom: 0 }}>
                      Thiết lập lộ trình thanh toán chương trình
                    </p>
                  </div>
                </div>

                {/* Header Action Buttons on Top Right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <button
                    type="button"
                    className="btn outline"
                    onClick={() => setIsCreateOpen(false)}
                    disabled={isSaving}
                    style={{ height: '38px', minWidth: '90px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    form="create-deposit-form"
                    className="btn primary"
                    disabled={isSaving}
                    style={{ height: '38px', minWidth: '180px', fontSize: '0.85rem', fontWeight: 700 }}
                  >
                    {isSaving ? 'Đang tạo...' : 'Tạo phiếu Thanh toán'}
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="custom-scrollbar" style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                <form id="create-deposit-form" onSubmit={handleCreateDeposit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: '1.5rem', alignItems: 'stretch' }}>
                    
                    {/* Left Pane: Transaction & Installments */}
                    <div style={{ flex: isMobile ? 'none' : 7, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Card 1: Thông tin chung */}
                      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Thông tin chung</h4>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Khách hàng *</label>
                            <CustomSelect
                              options={contacts.map(c => ({
                                value: String(c.id),
                                label: `${c.last_name} ${c.first_name} (${c.phone})`,
                                avatar: (c as any).avatar_url || (c as any).avatar
                              }))}
                              value={selectedContactId}
                              onChange={val => setSelectedContactId(val.toString())}
                              placeholder="-- Chọn khách hàng --"
                              showAvatars
                              searchable
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Chương trình / Chiến dịch *</label>
                            <CustomSelect
                              options={projects.map(p => ({
                                value: String(p.id),
                                label: p.name
                              }))}
                              value={selectedProjectId}
                              onChange={val => setSelectedProjectId(val.toString())}
                              placeholder="-- Chọn chương trình/chiến dịch --"
                              searchable
                            />
                          </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: '1rem' }}>
                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Loại tiền tệ *</label>
                            <CustomSelect
                              options={[
                                { value: 'VND', label: 'VND' },
                                { value: 'USD', label: 'USD' },
                                { value: 'EURO', label: 'EURO' },
                                { value: 'CHF', label: 'CHF' }
                              ]}
                              value={currency}
                              onChange={val => setCurrency(val)}
                              width="100%"
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Tổng doanh thu ({currency}) *</label>
                            <CurrencyInput
                              value={price}
                              onChange={val => setPrice(String(val))}
                              placeholder="0"
                              showTextHelper={false}
                              currency={currency}
                            />
                          </div>

                          <div className="form-group" style={{ margin: 0 }}>
                            <label className="form-label">Hoa hồng ({currency})</label>
                            <CurrencyInput
                              value={expectedCommission}
                              onChange={val => setExpectedCommission(String(val))}
                              placeholder="0"
                              showTextHelper={false}
                              currency={currency}
                            />
                          </div>
                        </div>

                        {/* Notes input instead of unitCode */}
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label">Ghi chú</label>
                          <textarea
                            placeholder="Nhập ghi chú giao dịch..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                            className="form-input"
                            style={{ height: '70px', padding: '8px 12px', fontSize: '0.85rem', resize: 'none', borderRadius: '8px' }}
                          />
                        </div>
                      </div>

                      {/* Card 2: Lịch trình thanh toán */}
                      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Lịch trình thanh toán</h4>
                          <button
                            type="button"
                            onClick={handleAddMilestoneInput}
                            style={{ fontSize: '0.75rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontWeight: 700 }}
                            className="hover:underline"
                          >
                            <Plus size={14} /> Thêm đợt tiền
                          </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          {milestonesInput.map((m, idx) => (
                            <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <input
                                type="text"
                                required
                                placeholder={`Tên đợt ${idx + 1}`}
                                value={m.name}
                                onChange={e =>
                                  setMilestonesInput(prev =>
                                    prev.map((item, i) => (i === idx ? { ...item, name: e.target.value } : item))
                                  )
                                }
                                className="form-input"
                                style={{ height: '38px', padding: '8px 12px', fontSize: '0.85rem', flex: 1, borderRadius: '8px' }}
                              />
                              <div style={{ width: '150px', flexShrink: 0 }}>
                                <CurrencyInput
                                  value={m.amount}
                                  required
                                  onChange={val =>
                                    setMilestonesInput(prev =>
                                      prev.map((item, i) => (i === idx ? { ...item, amount: String(val) } : item))
                                    )
                                  }
                                  placeholder={`Số tiền (${currency})`}
                                  showTextHelper={false}
                                  currency={currency}
                                />
                              </div>
                              <input
                                type="date"
                                required
                                value={m.expected_pay_date || ''}
                                onChange={e =>
                                  setMilestonesInput(prev =>
                                    prev.map((item, i) => (i === idx ? { ...item, expected_pay_date: e.target.value } : item))
                                  )
                                }
                                className="form-input"
                                style={{ height: '38px', padding: '8px 12px', fontSize: '0.85rem', width: '135px', flexShrink: 0, borderRadius: '8px' }}
                              />
                              {milestonesInput.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => handleRemoveMilestoneInput(idx)}
                                  style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.08)', border: 'none', color: 'var(--color-danger)', cursor: 'pointer', display: 'flex', borderRadius: '8px', alignItems: 'center', justifyContent: 'center' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* Right Pane: Cooperation & Reminders */}
                    <div style={{ flex: isMobile ? 'none' : 3, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                      
                      {/* Phê duyệt & Vận hành */}
                      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                          Phê duyệt & Vận hành
                        </h4>
                        
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Người tạo</label>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 12px',
                            background: 'var(--color-bg)',
                            border: '1px solid var(--color-border-light)',
                            borderRadius: '8px',
                            height: '38px'
                          }}>
                            <Avatar src={(user as any)?.avatar_url || (user as any)?.avatar} name={(user as any)?.full_name || (user as any)?.username} size="sm" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>{(user as any)?.full_name || (user as any)?.username}</span>
                          </div>
                        </div>

                        {/* Arrow/flow link indicator */}
                        <div style={{ display: 'flex', justifyContent: 'center', margin: '-4px 0' }}>
                          <div style={{ width: '2px', height: '16px', background: 'dashed var(--color-primary)', borderLeft: '2px dashed var(--color-border)' }}></div>
                        </div>

                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.85rem' }}>Người duyệt <span style={{ color: 'var(--color-danger)' }}>*</span></label>
                          <CustomSelect
                            options={usersList
                              .filter(u => String(u.role).toLowerCase() === 'accountant')
                              .map(u => ({
                                value: String(u.id),
                                label: u.full_name || u.name || u.username,
                                avatar: u.avatar_url || u.avatar
                              }))}
                            value={depositAccountantId}
                            onChange={val => setDepositAccountantId(val.toString())}
                            placeholder="-- Chọn người duyệt --"
                            showAvatars
                            searchable
                          />
                        </div>
                      </div>

                      {/* Minh chứng thanh toán (UNC) */}
                      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)' }}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                          Minh chứng thanh toán
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'rgba(59, 130, 246, 0.04)', border: '1px solid rgba(59, 130, 246, 0.12)', borderRadius: '10px' }}>
                          <label className="form-label" style={{ fontWeight: 700, margin: 0, fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            Minh chứng Đợt 1 (UNC) <span style={{ color: 'var(--color-danger)' }}>*</span>
                          </label>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                            <label
                              className="btn outline sm"
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: 'pointer', height: '32px', fontSize: '0.75rem', borderRadius: '8px' }}
                            >
                              <Upload size={13} /> {depositUncFile ? 'Chọn lại tệp' : 'Chọn ảnh UNC'}
                              <input
                                type="file"
                                accept="image/*"
                                style={{ display: 'none' }}
                                onChange={e => {
                                  if (e.target.files && e.target.files.length > 0) {
                                    setDepositUncFile(e.target.files[0]);
                                  }
                                }}
                              />
                            </label>
                            {depositUncFile ? (
                              <span style={{ fontSize: '0.75rem', color: '#10b981', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '140px' }} title={depositUncFile.name}>
                                ✓ {depositUncFile.name}
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
                                Yêu cầu bắt buộc 1 UNC
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Card 4: Nhắc lịch tự động */}
                      <div className="card" style={{ padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-surface)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 700, color: 'var(--color-text)' }}>Nhắc lịch thanh toán</h4>
                          
                          <label style={{
                            position: 'relative',
                            display: 'inline-block',
                            width: '40px',
                            height: '22px',
                            cursor: 'pointer'
                          }}>
                            <input
                              type="checkbox"
                              checked={autoRemind}
                              onChange={e => setAutoRemind(e.target.checked)}
                              style={{ opacity: 0, width: 0, height: 0 }}
                            />
                            <span style={{
                              position: 'absolute',
                              inset: 0,
                              backgroundColor: autoRemind ? '#10b981' : '#cbd5e1',
                              borderRadius: '34px',
                              transition: '0.3s'
                            }}>
                              <span style={{
                                position: 'absolute',
                                content: '""',
                                height: '16px',
                                width: '16px',
                                left: autoRemind ? '20px' : '3px',
                                bottom: '3px',
                                backgroundColor: 'white',
                                borderRadius: '50%',
                                transition: '0.3s'
                              }} />
                            </span>
                          </label>
                        </div>

                        {autoRemind && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {selectedContactId && (() => {
                              const selectedContactObj = contacts.find(c => String(c.id) === String(selectedContactId));
                              if (selectedContactObj && !selectedContactObj.email) {
                                return (
                                  <div style={{
                                    padding: '8px 12px',
                                    background: 'rgba(245, 158, 11, 0.08)',
                                    border: '1px solid rgba(245, 158, 11, 0.2)',
                                    borderRadius: '8px',
                                    color: '#d97706',
                                    fontSize: '0.725rem',
                                    fontWeight: 500,
                                    lineHeight: 1.4,
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px'
                                  }}>
                                    <AlertCircle size={14} style={{ flexShrink: 0 }} />
                                    <span>Khách hàng này không có email. Nhắc nhở sẽ chuyển sang Sale chăm sóc.</span>
                                  </div>
                                );
                              }
                              return null;
                            })()}

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                              <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Đối tượng nhận</label>
                              <CustomSelect
                                options={[
                                  { value: '1', label: 'Gửi học viên (Fallback về Sale)' },
                                  { value: '2', label: 'Chỉ gửi nhắc cho Sale chăm sóc' }
                                ]}
                                value={String(remindTarget)}
                                onChange={val => setRemindTarget(Number(val))}
                                placeholder="Chọn đối tượng"
                              />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Nhắc trước (ngày)</label>
                                <input
                                  type="number"
                                  min={1}
                                  max={30}
                                  value={remindDaysBefore}
                                  onChange={e => setRemindDaysBefore(Math.max(1, parseInt(e.target.value) || 3))}
                                  className="form-input"
                                  style={{ height: '38px', fontSize: '0.8rem', padding: '0 8px', borderRadius: '8px', textAlign: 'center', margin: 0 }}
                                />
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Giờ gửi</label>
                                <CustomSelect
                                  options={Array.from({ length: 24 }).map((_, h) => ({
                                    value: String(h),
                                    label: `${h}:00`
                                  }))}
                                  value={String(remindAtHour)}
                                  onChange={val => setRemindAtHour(Number(val))}
                                  placeholder="Chọn giờ"
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {/* Cancel Modal */}
      <CustomModal
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Yêu cầu hủy giao dịch"
        width="400px"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', lineHeight: 1.5 }}>
            <strong>Lưu ý:</strong> Nếu chưa được duyệt bất kỳ đợt thanh toán nào, hệ thống sẽ tự động hạ 1 mức nhiệt của KHTN (decay) và chuyển trạng thái về Booking.
          </p>
          <div>
            <label className="form-label">Lý do hủy giao dịch</label>
            <textarea
              required
              placeholder="Nhập lý do chi tiết..."
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
              className="form-input"
              style={{ height: '96px', resize: 'none' }}
            />
          </div>
          <button
            onClick={handleConfirmCancel}
            disabled={isSaving}
            className="btn primary w-full"
            style={{ height: '38px', backgroundColor: 'var(--color-danger)', border: 'none', opacity: isSaving ? 0.7 : 1, cursor: isSaving ? 'not-allowed' : 'pointer' }}
          >
            {isSaving ? 'Đang xử lý...' : 'Xác nhận hủy giao dịch'}
          </button>
        </div>
      </CustomModal>
      {/* Explanation of Deposit & Unit Switch Modal */}
      <CustomModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        title={t("Quy trình Đặt cọc & Chính sách Bể cọc / Đổi căn")}
        width="760px"
      >
        <div style={{ padding: '0.25rem 0', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 12, 
            padding: '0.875rem 1rem', 
            background: 'var(--color-primary-light)', 
            border: '1px solid rgba(163, 20, 34, 0.15)', 
            borderRadius: 12 
          }}>
            <Info size={24} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', lineHeight: 1.5, margin: 0 }}>
              {t("Hệ thống quản lý đặt cọc căn hộ và kiểm soát doanh thu môi giới. Nhằm bảo vệ quyền lợi của Tư vấn viên (TVV) và tính toàn vẹn của dữ liệu, vui lòng tuân thủ các quy tắc sau:")}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {/* Quy tắc 1 */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              padding: '1rem', 
              background: 'rgba(59, 130, 246, 0.02)', 
              borderLeft: '4px solid #3b82f6', 
              borderTop: '1px solid var(--color-border-light)',
              borderRight: '1px solid var(--color-border-light)',
              borderBottom: '1px solid var(--color-border-light)',
              borderRadius: '0 8px 8px 0'
            }}>
              <CreditCard size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                  {t("1. Đợt thanh toán & Phê duyệt UNC")}
                </h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {t("Mỗi phiếu cọc có thể chia thành nhiều đợt thanh toán (milestones). TVV có nhiệm vụ tải lên hình ảnh UNC (Ủy nhiệm chi). Khi được Kế toán/Admin phê duyệt trạng thái \"Đã đóng\", doanh thu thực tế mới được ghi nhận vào hệ thống.")}
                </p>
              </div>
            </div>

            {/* Quy tắc 2 */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              padding: '1rem', 
              background: 'rgba(239, 68, 68, 0.02)', 
              borderLeft: '4px solid #ef4444', 
              borderTop: '1px solid var(--color-border-light)',
              borderRight: '1px solid var(--color-border-light)',
              borderBottom: '1px solid var(--color-border-light)',
              borderRadius: '0 8px 8px 0'
            }}>
              <Ban size={20} color="#ef4444" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                  {t("2. Quy tắc Bể cọc (Deposit Cancellation)")}
                </h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {t("• Chưa phát sinh doanh thu: Nếu khách hàng hủy đặt cọc trước khi đóng bất kỳ đợt thanh toán nào, trạng thái của KHTN/Person sẽ bị hạ về mức trước đó (Booking/Đã Gặp). Đồng hồ bảo mật của lead kích hoạt trở lại và lead có thể bị tự động giải phóng ra Databank chung nếu hết hạn.")}
                  <br />
                  {t("• Đã phát sinh doanh thu (đã đóng đợt 1): Trạng thái KHTN được giữ nguyên là Đặt Cọc để bảo vệ quyền sở hữu trọn đời của TVV chăm sóc.")}
                </p>
              </div>
            </div>

            {/* Quy tắc 3 */}
            <div style={{ 
              display: 'flex', 
              gap: 12, 
              padding: '1rem', 
              background: 'rgba(245, 158, 11, 0.02)', 
              borderLeft: '4px solid #f59e0b', 
              borderTop: '1px solid var(--color-border-light)',
              borderRight: '1px solid var(--color-border-light)',
              borderBottom: '1px solid var(--color-border-light)',
              borderRadius: '0 8px 8px 0'
            }}>
              <Calendar size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <h5 style={{ fontSize: '0.875rem', fontWeight: 800, margin: '0 0 4px 0', color: 'var(--color-text)' }}>
                  {t("3. Cơ chế Đổi Sản phẩm / Chiến dịch (Product Switching)")}
                </h5>
                <p style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', margin: 0, lineHeight: 1.4 }}>
                  {t("Khi khách hàng muốn đổi sản phẩm hoặc chiến dịch giao dịch khác, bắt buộc thực hiện theo đúng vết kiểm toán (audit trail):")}
                  <br />
                  {t("• Đóng đơn hàng cũ lại (đánh dấu thất bại hoặc đã đổi).")}
                  <br />
                  {t("• Tạo một đơn hàng mới hoàn toàn.")}
                  <br />
                  {t("• Gắn liên kết ghi rõ \"Đổi từ sản phẩm [Mã SKU Cũ]\" ở đơn mới để lưu trọn vẹn lịch sử doanh thu.")}
                </p>
              </div>
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', gap: '0.75rem', borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem' }}>
          <button className="btn primary" onClick={() => setShowInfoModal(false)} style={{ minWidth: 100 }}>{t("Đồng ý")}</button>
        </div>
      </CustomModal>

      {/* Preview Reminder Modal */}
      <CustomModal
        isOpen={previewReminderMilestone !== null}
        onClose={() => setPreviewReminderMilestone(null)}
        title={t("Xem trước Nhắc nhở Thanh toán")}
        width="600px"
      >
        {previewReminderMilestone && selectedDepForManage && (() => {
          const custName = `${selectedDepForManage.first_name || ''} ${selectedDepForManage.last_name || ''}`.trim();
          const customerEmail = selectedDepForManage.email ? selectedDepForManage.email.trim() : '';
          const hasEmail = customerEmail !== '';
          const isTargetSale = remindTargetManage === 2;
          const sendToCaretaker = isTargetSale || !hasEmail;
          const recipientName = sendToCaretaker ? (selectedDepForManage.creator_name || 'Sale chăm sóc') : custName;
          const recipientEmail = sendToCaretaker ? 'Email của Sale chăm sóc' : customerEmail;
          const subject = sendToCaretaker 
            ? (isTargetSale ? `[IDEAS] Nhắc lịch thanh toán của học viên: ${custName}` : `[IDEAS] [Fallback] Nhắc nhở chăm sóc khách hàng thanh toán: ${custName}`) 
            : `[IDEAS] Nhắc nhở thanh toán đợt cọc: ${previewReminderMilestone.milestone_name}`;
          
          const payDateStr = previewReminderMilestone.expected_pay_date 
            ? new Date(previewReminderMilestone.expected_pay_date).toLocaleDateString('vi-VN') 
            : 'Chưa thiết lập';
          const amountStr = formatMoney(previewReminderMilestone.expected_amount, selectedDepForManage.currency);

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '0.25rem 0' }}>
              {!hasEmail && (
                <div style={{ display: 'flex', gap: '8px', padding: '8px 12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.2)', borderRadius: '8px', color: '#d97706', fontSize: '0.75rem', alignItems: 'center' }}>
                  <AlertCircle size={14} style={{ flexShrink: 0 }} />
                  <span>Học viên không có email. Nhắc nhở sẽ tự động chuyển hướng (Fallback) gửi tới Sale chăm sóc.</span>
                </div>
              )}

              <div style={{ background: 'var(--color-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--color-border)', fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '90px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Người nhận:</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>
                    {recipientName} {recipientEmail ? `(${recipientEmail})` : ''}
                  </span>
                </div>
                <div style={{ display: 'flex' }}>
                  <span style={{ width: '90px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Kênh gửi:</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>Email</span>
                </div>
                <div style={{ display: 'flex', borderTop: '1px solid var(--color-border)', paddingTop: '6px', marginTop: '4px' }}>
                  <span style={{ width: '90px', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tiêu đề:</span>
                  <span style={{ color: 'var(--color-text)', fontWeight: 700 }}>{subject}</span>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Nội dung Email</label>
                <div style={{ 
                  background: 'var(--color-surface)', 
                  border: '1px solid var(--color-border)', 
                  borderRadius: '8px', 
                  padding: '16px', 
                  fontSize: '0.85rem', 
                  lineHeight: '1.5',
                  color: 'var(--color-text)',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {sendToCaretaker ? (
                    <div>
                      Chào <strong>{recipientName}</strong>,<br /><br />
                      Hệ thống gửi thông báo nhắc lịch thanh toán của học viên <strong>{custName}</strong> (SĐT: {selectedDepForManage.phone || '—'}).<br /><br />
                      Vui lòng chủ động liên hệ nhắc nhở khách hàng thanh toán đợt: <strong>{previewReminderMilestone.milestone_name}</strong>.<br />
                      Số tiền cần thanh toán: <strong>{amountStr}</strong>.<br />
                      Hạn thanh toán: <strong>{payDateStr}</strong>.<br />
                      Chương trình: <strong>{selectedDepForManage.project_name}</strong> (Căn {selectedDepForManage.unit_code}).
                    </div>
                  ) : (
                    <div>
                      Chào <strong>{custName}</strong>,<br /><br />
                      Đây là thông báo nhắc lịch thanh toán cho đợt: <strong>{previewReminderMilestone.milestone_name}</strong>.<br /><br />
                      Chương trình: <strong>{selectedDepForManage.project_name}</strong> (Căn {selectedDepForManage.unit_code}).<br />
                      Số tiền cần đóng: <strong>{amountStr}</strong>.<br />
                      Hạn thanh toán: <strong>{payDateStr}</strong>.<br /><br />
                      Vui lòng hoàn tất thanh toán và tải hình ảnh Ủy nhiệm chi (UNC) lên hệ thống. Xin cảm ơn!
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button 
                  type="button" 
                  className="btn secondary" 
                  onClick={() => setPreviewReminderMilestone(null)}
                  disabled={sendingReminderId === previewReminderMilestone.id}
                >
                  Hủy
                </button>
                <button 
                  type="button" 
                  className="btn primary" 
                  disabled={sendingReminderId === previewReminderMilestone.id}
                  onClick={async () => {
                    const mid = previewReminderMilestone.id;
                    setPreviewReminderMilestone(null);
                    await handleSendManualReminder(mid);
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  {sendingReminderId === previewReminderMilestone.id && <Loader2 size={14} className="spin" />}
                  Xác nhận gửi
                </button>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* Manage Milestones Drawer (Wide dual-pane layout) */}
      {createPortal(
        <AnimatePresence>
          {showManageModal && selectedDepForManage && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', justifyContent: 'flex-end' }}>
              {/* Overlay */}
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setShowManageModal(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundColor: 'rgba(15, 23, 42, 0.4)',
                  backdropFilter: 'blur(4px)',
                  zIndex: 1000005
                }}
              />
              {/* Drawer panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  position: 'fixed',
                  top: 0,
                  bottom: 0,
                  left: 'var(--sidebar-width, 220px)',
                  right: 0,
                  backgroundColor: 'var(--color-surface)',
                  boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  zIndex: 1000010
                }}
              >
              {/* Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1.25rem 1.5rem',
                borderBottom: '1px solid var(--color-border)',
                background: 'var(--color-surface)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    onClick={() => setShowManageModal(false)}
                    style={{
                      background: 'none',
                      border: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      padding: '4px',
                      borderRadius: '8px',
                      color: 'var(--color-text-muted)',
                      transition: 'background 0.2s, color 0.2s',
                      marginLeft: '-4px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'var(--color-surface-hover)';
                      e.currentTarget.style.color = 'var(--color-primary)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'none';
                      e.currentTarget.style.color = 'var(--color-text-muted)';
                    }}
                    title="Quay lại"
                  >
                    <ChevronLeft size={22} />
                  </button>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                    Chi tiết & Lịch trình thanh toán
                  </h2>
                </div>

                {/* Actions & Close area top right */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {/* Hủy giao dịch button */}
                  {selectedDepForManage.status !== 'cancelled' && (() => {
                    const isCreator = String(selectedDepForManage.created_by) === String(user?.id);
                    const isOwner = String(selectedDepForManage.contact_owner_id) === String(user?.id);
                    const isStaff = user && ['admin', 'superadmin', 'super_admin', 'assistant', 'manager', 'director', 'accountant'].includes(user.role);
                    if (isStaff || isCreator || isOwner) {
                      return (
                        <button
                          onClick={() => handleOpenCancel(selectedDepForManage.id)}
                          style={{
                            padding: '6px 14px',
                            height: '34px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            color: '#ef4444',
                            borderRadius: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)';
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                          }}
                        >
                          <Ban size={14} />
                          <span>Hủy giao dịch</span>
                        </button>
                      );
                    }
                    return null;
                  })()}

                  {/* Lưu lịch trình button */}
                  {canEditMilestones && (
                    <button
                      className="btn primary"
                      onClick={handleSaveMilestones}
                      style={{ height: '34px', minWidth: 100, fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                      disabled={isSavingMilestones}
                    >
                      {isSavingMilestones ? 'Đang lưu...' : 'Lưu lịch trình'}
                    </button>
                  )}

                  {/* Close button X */}
                  <button
                    onClick={() => setShowManageModal(false)}
                    style={{
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                      padding: '8px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'background 0.2s',
                      zIndex: 10
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--color-surface-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                    title="Đóng"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Drawer Body (Dual Pane) */}
              <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                {/* Left Pane (Details & Milestones) */}
                <div style={{ flex: 1.3, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                  {/* Brief Info with Customer Details and Sales Team */}
                  {/* Brief Info with Customer Details and Sales Team */}
                  {(() => {
                    const totalApprovedMilestones = (selectedDepForManage.milestones || [])
                      .filter(m => m.status === 'approved')
                      .reduce((sum, m) => sum + (m.expected_amount || 0), 0);

                    const totalCount = (selectedDepForManage.milestones || []).length;
                    const approvedCount = (selectedDepForManage.milestones || []).filter(m => m.status === 'approved').length;

                    const actualCommission = selectedDepForManage.price > 0
                      ? Math.round((tempExpectedCommission || selectedDepForManage.expected_commission || 0) * (totalApprovedMilestones / selectedDepForManage.price))
                      : 0;

                    return (
                      <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '16px',
                        background: 'var(--color-surface)',
                        padding: '20px',
                        borderRadius: '16px',
                        border: '1px solid var(--color-border-light)',
                        boxShadow: 'var(--shadow-sm)'
                      }}>
                        {/* Top Row: Customer & SKU */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '20px' }}>
                          {/* Left: Customer Info */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                            <div
                              onClick={() => handleOpenContactDrawer(selectedDepForManage.contact_id)}
                              style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
                              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                              <Avatar
                                src={selectedDepForManage.avatar_url}
                                name={`${selectedDepForManage.last_name} ${selectedDepForManage.first_name}`}
                                size="lg"
                                style={{ width: '52px', height: '52px', fontSize: '1.2rem' }}
                              />
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                              <h4
                                onClick={() => handleOpenContactDrawer(selectedDepForManage.contact_id)}
                                style={{
                                  margin: 0,
                                  fontSize: '1.1rem',
                                  fontWeight: 800,
                                  color: 'var(--color-text)',
                                  cursor: 'pointer',
                                  textDecoration: 'underline decoration-dotted',
                                  transition: 'opacity 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.8'}
                                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
                              >
                                {selectedDepForManage.last_name} {selectedDepForManage.first_name}
                              </h4>
                              <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                SĐT: <strong style={{ color: 'var(--color-text)' }}>{selectedDepForManage.phone}</strong>
                              </span>
                              {selectedDepForManage.email && (
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
                                  Email: <strong style={{ color: 'var(--color-text)' }}>{selectedDepForManage.email}</strong>
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Right: Program */}
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '4px', background: 'var(--color-bg-light)', padding: '10px 14px', borderRadius: '12px', border: '1px solid var(--color-border-light)' }}>
                            <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Chương trình</span>
                            <span style={{ fontWeight: 800, fontSize: '0.85rem', color: 'var(--color-text)', wordBreak: 'break-word' }}>
                              {selectedDepForManage.project_name}
                            </span>
                          </div>
                        </div>

                        <div style={{ height: '1px', background: 'var(--color-border-light)' }} />

                        {/* Bottom Row: Caretaker & Financials */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 2fr', gap: '20px', alignItems: 'center' }}>
                          {/* Left: Caretaker info */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                              Nhân sự chăm sóc & hoa hồng
                            </span>
                            {isAdmin && tempSharesData && tempSharesData.length > 0 ? (
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                {tempSharesData.map((sh, sIdx) => (
                                  <div
                                    key={sIdx}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'space-between',
                                      background: 'var(--color-bg-light)',
                                      border: '1px solid var(--color-border-light)',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      width: '100%'
                                    }}
                                  >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                      <Avatar src={sh.avatar} name={sh.name} size="md" style={{ width: '28px', height: '28px' }} />
                                      <span style={{ fontSize: '0.775rem', fontWeight: 600, color: 'var(--color-text)' }}>{sh.name}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={sh.percentage}
                                        onChange={(e) => handleTempSharePercentChange(sIdx, e.target.value)}
                                        className="form-input"
                                        style={{ width: '55px', height: '24px', textAlign: 'center', padding: '2px', fontSize: '0.75rem', margin: 0 }}
                                      />
                                      <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>%</span>
                                    </div>
                                  </div>
                                ))}
                                {(() => {
                                  const totalPct = tempSharesData.reduce((sum, s) => sum + (Number(s.percentage) || 0), 0);
                                  if (totalPct !== 100) {
                                      return (
                                        <span style={{ fontSize: '0.7rem', color: 'var(--color-danger)', fontWeight: 600 }}>
                                          * Tổng tỷ lệ phải bằng 100% (Hiện tại: {totalPct}%)
                                        </span>
                                      );
                                  }
                                  return null;
                                })()}
                              </div>
                            ) : sharesData && sharesData.length > 0 ? (
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
                                {sharesData.map((sh, sIdx) => (
                                  <div
                                    key={sIdx}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <Avatar src={sh.avatar} name={sh.name} size="md" style={{ width: '28px', height: '28px' }} />
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                      <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)' }}>{sh.name}</span>
                                      <span style={{
                                        fontSize: '0.675rem',
                                        fontWeight: 700,
                                        color: '#2563eb'
                                      }}>
                                        Đóng góp: {sh.percentage}%
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              (() => {
                                const ownerUser = usersList.find(x => String(x.id) === String(selectedDepForManage.contact_owner_id))
                                  || usersList.find(x => String(x.id) === String(selectedDepForManage.created_by));
                                const ownerName = ownerUser?.full_name || ownerUser?.name || selectedDepForManage.creator_name || 'Chưa xác định';
                                const ownerAvatar = ownerUser?.avatar_url || selectedDepForManage.creator_avatar;

                                return (
                                  <div
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '8px'
                                    }}
                                  >
                                    <Avatar src={ownerAvatar} name={ownerName} size="md" style={{ width: '28px', height: '28px' }} />
                                    <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--color-text)' }}>{ownerName}</span>
                                  </div>
                                );
                              })()
                            )}
                          </div>

                          {/* Financial Stat Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px', width: '100%' }}>
                            {/* Card 1: Tổng giá trị & Thực thu */}
                            <div className="stat-card hover-lift total-card" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '1rem',
                              minHeight: '120px',
                              borderRadius: '12px',
                              border: '1px solid var(--color-border-light)',
                              position: 'relative',
                              overflow: 'hidden',
                              justifyContent: 'space-between'
                            }}>
                              <div className="decor-svg" style={{ color: '#a31422' }}>
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                  <circle cx="30" cy="50" r="10" stroke="currentColor" strokeWidth="2" />
                                  <circle cx="70" cy="30" r="10" stroke="currentColor" strokeWidth="2" />
                                  <circle cx="70" cy="70" r="10" stroke="currentColor" strokeWidth="2" />
                                  <path d="M40 50 H 55 V 30 H 60 M 55 50 V 70 H 60" stroke="currentColor" strokeWidth="2" />
                                </svg>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                                <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Tổng giá trị
                                </span>
                                <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(163, 20, 34, 0.08)', color: '#a31422', flexShrink: 0 }}>
                                  <CreditCard size={16} />
                                </div>
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--color-text)', lineHeight: 1.1 }}>
                                  {formatMoney(selectedDepForManage.price, selectedDepForManage.currency)}
                                </div>
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#2563eb', display: 'inline-block' }} />
                                    Thực thu: <strong style={{ color: '#2563eb' }}>{formatMoney(totalApprovedMilestones, selectedDepForManage.currency)}</strong> ({approvedCount}/{totalCount} đợt)
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Card 2: Hoa hồng dự kiến & Thực tế */}
                            <div className="stat-card hover-lift distributed-card" style={{
                              display: 'flex',
                              flexDirection: 'column',
                              padding: '1rem',
                              minHeight: '120px',
                              borderRadius: '12px',
                              border: '1px solid var(--color-border-light)',
                              position: 'relative',
                              overflow: 'hidden',
                              justifyContent: 'space-between'
                            }}>
                              <div className="decor-svg" style={{ color: '#10b981' }}>
                                <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                                  <circle cx="45" cy="35" r="15" stroke="currentColor" strokeWidth="2" />
                                  <path d="M20 75 C 20 60, 31 50, 45 50 C 59 50, 70 60, 70 75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                  <path d="M75 35 H 89 M 82 28 V 42" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                                </svg>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                                <span className="stat-label" style={{ fontSize: '0.6875rem', fontWeight: 800, color: 'var(--color-text-light)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  Hoa hồng dự kiến
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  {isAdmin && !isEditingCommission && (
                                    <button
                                      onClick={() => setIsEditingCommission(true)}
                                      style={{
                                        border: 'none',
                                        background: 'none',
                                        padding: '2px',
                                        cursor: 'pointer',
                                        color: '#059669',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        borderRadius: '4px',
                                        transition: 'background 0.2s',
                                        position: 'relative',
                                        zIndex: 3
                                      }}
                                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                      onMouseLeave={(e) => e.currentTarget.style.background = 'none'}
                                      title="Sửa hoa hồng"
                                    >
                                      <Edit size={12} />
                                    </button>
                                  )}
                                  <div className="stat-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(16, 185, 129, 0.08)', color: '#10b981', flexShrink: 0 }}>
                                    <DollarSign size={16} />
                                  </div>
                                </div>
                              </div>
                              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', position: 'relative', zIndex: 2 }}>
                                {isAdmin && isEditingCommission ? (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <CurrencyInput
                                      value={tempExpectedCommission}
                                      onChange={(val) => setTempExpectedCommission(val || 0)}
                                      className="form-input"
                                      style={{
                                        height: '28px',
                                        fontSize: '0.95rem',
                                        fontWeight: 800,
                                        color: '#059669',
                                        flex: 1,
                                        margin: 0,
                                        padding: '0 6px',
                                        borderRadius: '6px',
                                        background: 'var(--color-surface)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)'
                                      }}
                                    />
                                    <button
                                      onClick={() => setIsEditingCommission(false)}
                                      style={{
                                        border: 'none',
                                        background: '#10b981',
                                        color: 'white',
                                        padding: '4px',
                                        cursor: 'pointer',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '28px',
                                        height: '28px',
                                        boxShadow: 'var(--shadow-sm)'
                                      }}
                                      title="Xong"
                                    >
                                      <Check size={14} />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="stat-value" style={{ fontSize: '1.15rem', fontWeight: 800, color: '#059669', lineHeight: 1.1 }}>
                                    {formatMoney(tempExpectedCommission !== undefined ? tempExpectedCommission : selectedDepForManage.expected_commission, selectedDepForManage.currency)}
                                  </div>
                                )}
                                <div style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: 4, fontWeight: 500 }}>
                                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                                    Thực tế: <strong style={{ color: 'var(--color-text)' }}>{formatMoney(actualCommission, selectedDepForManage.currency)}</strong>
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Automated Reminders Config in Drawer */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    padding: '16px',
                    background: 'var(--color-surface-hover)',
                    borderRadius: '12px',
                    border: '1px solid var(--color-border-light)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Clock size={16} style={{ color: 'var(--color-primary)' }} />
                        Cài đặt nhắc lịch thanh toán tự động
                      </span>
                      <label style={{
                        position: 'relative',
                        display: 'inline-block',
                        width: '40px',
                        height: '22px',
                        cursor: canEditMilestones ? 'pointer' : 'not-allowed'
                      }}>
                        <input
                          type="checkbox"
                          disabled={!canEditMilestones}
                          checked={autoRemindManage}
                          onChange={e => setAutoRemindManage(e.target.checked)}
                          style={{ opacity: 0, width: 0, height: 0 }}
                        />
                        <span style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundColor: autoRemindManage ? '#10b981' : '#cbd5e1',
                          borderRadius: '34px',
                          transition: '0.3s'
                        }}>
                          <span style={{
                            position: 'absolute',
                            content: '""',
                            height: '16px',
                            width: '16px',
                            left: autoRemindManage ? '20px' : '3px',
                            bottom: '3px',
                            backgroundColor: 'white',
                            borderRadius: '50%',
                            transition: '0.3s'
                          }} />
                        </span>
                      </label>
                    </div>

                    {autoRemindManage && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '4px' }}>
                        {/* Warning if customer has no email */}
                        {selectedDepForManage && !selectedDepForManage.email && (
                          <div style={{
                            padding: '8px 12px',
                            background: 'rgba(245, 158, 11, 0.08)',
                            border: '1px solid rgba(245, 158, 11, 0.2)',
                            borderRadius: '8px',
                            color: '#d97706',
                            fontSize: '0.75rem',
                            fontWeight: 500,
                            lineHeight: 1.4,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}>
                            <AlertCircle size={14} style={{ flexShrink: 0 }} />
                            <span>⚠️ Khách hàng này không có email. Email nhắc thanh toán sẽ được gửi cho Sale chăm sóc thay thế.</span>
                          </div>
                        )}

                        <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)' }}>Đối tượng nhận nhắc nhở</label>
                            <CustomSelect
                              disabled={!canEditMilestones}
                              options={[
                                { value: '1', label: 'Gửi học viên (Fallback về Sale)' },
                                { value: '2', label: 'Chỉ gửi nhắc cho Sale chăm sóc' }
                              ]}
                              value={String(remindTargetManage)}
                              onChange={val => setRemindTargetManage(Number(val))}
                              placeholder="Chọn đối tượng"
                            />
                          </div>

                          <div style={{ width: '130px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Nhắc trước (ngày)</label>
                            <input
                              disabled={!canEditMilestones}
                              type="number"
                              min={1}
                              max={30}
                              value={remindDaysBeforeManage}
                              onChange={e => setRemindDaysBeforeManage(Math.max(1, parseInt(e.target.value) || 3))}
                              className="form-input"
                              style={{ height: '38px', fontSize: '0.8rem', padding: '0 8px', borderRadius: '8px', textAlign: 'center', margin: 0 }}
                            />
                          </div>

                          <div style={{ width: '125px', display: 'flex', flexDirection: 'column', gap: '4px', flexShrink: 0 }}>
                            <label style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>Giờ gửi nhắc</label>
                            <CustomSelect
                              disabled={!canEditMilestones}
                              options={Array.from({ length: 24 }).map((_, h) => ({
                                value: String(h),
                                label: `${h}:00`
                              }))}
                              value={String(remindAtHourManage)}
                              onChange={val => setRemindAtHourManage(Number(val))}
                              placeholder="Chọn giờ"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Milestones List */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <h4 style={{ margin: 0, fontWeight: 700, fontSize: '0.875rem' }}>Các đợt thanh toán</h4>
                      {canEditMilestones && (
                        <button
                          className="btn sm"
                          onClick={handleAddMilestoneRow}
                          style={{
                            padding: '4px 10px',
                            fontSize: '0.75rem',
                            background: 'rgba(16, 185, 129, 0.08)',
                            color: '#10b981',
                            border: '1px solid rgba(16, 185, 129, 0.2)',
                            fontWeight: 700,
                            borderRadius: '6px',
                            cursor: 'pointer'
                          }}
                        >
                          + Thêm đợt
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {/* Table Header */}
                      <div style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1.2fr 1.8fr',
                        gap: '12px',
                        alignItems: 'center',
                        padding: '8px 12px',
                        background: 'var(--color-surface-hover)',
                        borderBottom: '2px solid var(--color-border)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: 'var(--color-text-muted)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.5px'
                      }}>
                        <div>Tên đợt thanh toán</div>
                        <div>Hạn thanh toán</div>
                        <div>Số tiền ({selectedDepForManage?.currency || 'VND'})</div>
                        <div style={{ textAlign: 'center' }}>Trạng thái</div>
                        <div style={{ textAlign: 'center' }}>Minh chứng</div>
                        <div style={{ textAlign: 'right' }}>Thao tác</div>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '420px', overflowY: 'auto', paddingRight: 4 }}>
                        {tempMilestones.map((m, idx) => {
                          const isLocked = m.status === 'approved' || m.status === 'paid';
                          return (
                            <div
                              key={m.tempId || m.id}
                              style={{
                                display: 'grid',
                                gridTemplateColumns: '2fr 1.2fr 1.2fr 1fr 1.2fr 1.8fr',
                                gap: '12px',
                                alignItems: 'center',
                                padding: '10px 12px',
                                background: 'var(--color-surface)',
                                border: '1px solid var(--color-border-light)',
                                borderRadius: '8px',
                                transition: 'all 0.2s',
                                boxShadow: '0 1px 2px rgba(0,0,0,0.02)'
                              }}
                            >
                              {/* Name input */}
                              <div>
                                <input
                                  type="text"
                                  placeholder="Tên đợt (ví dụ: Đợt 1 - Cọc giữ chỗ)"
                                  value={m.milestone_name}
                                  disabled={!canEditMilestones}
                                  onChange={e => handleUpdateMilestoneField(idx, 'milestone_name', e.target.value)}
                                  className="form-input"
                                  style={{ width: '100%', height: '34px', fontSize: '0.775rem', padding: '0 10px', borderRadius: '6px' }}
                                />
                              </div>

                              {/* Expected Pay Date */}
                              <div>
                                <input
                                  type="date"
                                  value={m.expected_pay_date ? m.expected_pay_date.substring(0, 10) : ''}
                                  disabled={isLocked || !canEditMilestones}
                                  onChange={e => handleUpdateMilestoneField(idx, 'expected_pay_date', e.target.value)}
                                  className="form-input"
                                  style={{ width: '100%', height: '34px', fontSize: '0.725rem', padding: '0 8px', borderRadius: '6px' }}
                                />
                              </div>

                              {/* Amount input */}
                              <div>
                                <input
                                  type="text"
                                  placeholder="Số tiền"
                                  value={formatNumberWithCommas(m.expected_amount)}
                                  disabled={isLocked || !canEditMilestones}
                                  onChange={e => {
                                    const rawVal = e.target.value.replace(/[^0-9]/g, '');
                                    handleUpdateMilestoneField(idx, 'expected_amount', rawVal ? parseInt(rawVal, 10) : 0);
                                  }}
                                  className="form-input"
                                  style={{ width: '100%', height: '34px', fontSize: '0.775rem', padding: '0 10px', borderRadius: '6px' }}
                                />
                              </div>

                              {/* Status + dates + Remind Bell */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                                  <span style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 700,
                                    padding: '4px 8px',
                                    borderRadius: '9999px',
                                    background: m.status === 'approved' ? 'rgba(16, 185, 129, 0.12)' : m.status === 'paid' ? 'rgba(37, 99, 235, 0.12)' : m.status === 'failed' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(107, 114, 128, 0.12)',
                                    color: m.status === 'approved' ? '#10b981' : m.status === 'paid' ? '#2563eb' : m.status === 'failed' ? '#ef4444' : '#6b7280',
                                    textAlign: 'center',
                                    display: 'inline-block',
                                    whiteSpace: 'nowrap'
                                  }}>
                                    {m.status === 'approved' ? 'Đã duyệt' : m.status === 'paid' ? 'Chờ duyệt' : m.status === 'failed' ? 'Từ chối' : 'Chờ nộp'}
                                  </span>
                                  {m.approval_date && m.status === 'approved' && (
                                    <span style={{ fontSize: '0.65rem', color: '#10b981', fontWeight: 500, textAlign: 'center', whiteSpace: 'nowrap' }}>
                                      {new Date(m.approval_date).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }).replace(',', '')}
                                    </span>
                                  )}
                                </div>
                                {m.id && m.status !== 'approved' && (
                                  <button
                                    onClick={() => setPreviewReminderMilestone(m)}
                                    disabled={sendingReminderId === m.id}
                                    style={{
                                      background: 'rgba(245, 158, 11, 0.08)',
                                      border: '1px solid rgba(245, 158, 11, 0.2)',
                                      color: '#d97706',
                                      padding: '5px',
                                      borderRadius: '6px',
                                      cursor: sendingReminderId === m.id ? 'not-allowed' : 'pointer',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      transition: 'all 0.15s ease'
                                    }}
                                    onMouseEnter={e => { if (sendingReminderId !== m.id) e.currentTarget.style.background = 'rgba(245, 158, 11, 0.15)'; }}
                                    onMouseLeave={e => { if (sendingReminderId !== m.id) e.currentTarget.style.background = 'rgba(245, 158, 11, 0.08)'; }}
                                    title="Gửi nhắc nhở thanh toán ngay"
                                  >
                                    {sendingReminderId === m.id ? (
                                      <Loader2 size={13} className="animate-spin" />
                                    ) : (
                                      <Bell size={13} />
                                    )}
                                  </button>
                                )}
                              </div>

                              {/* UNC proof */}
                              <div style={{ display: 'flex', justifyContent: 'center', gap: '4px' }}>
                                {!m.unc_file_path && m.status !== 'approved' && canEditMilestones && (
                                  <label
                                    className="btn sm"
                                    style={{
                                      padding: '0 8px',
                                      height: '30px',
                                      cursor: actioningMilestoneId !== null ? 'not-allowed' : 'pointer',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      borderRadius: '6px',
                                      border: '1px solid var(--color-border)',
                                      background: 'var(--color-surface)',
                                      color: 'var(--color-text-muted)',
                                      opacity: actioningMilestoneId !== null ? 0.5 : 1,
                                      pointerEvents: actioningMilestoneId !== null ? 'none' : 'auto',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Tải ảnh chuyển khoản (UNC)"
                                  >
                                    <Upload size={13} />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      disabled={actioningMilestoneId !== null}
                                      onChange={e => handleUploadUncFromModal(e, idx)}
                                    />
                                  </label>
                                )}

                                {m.unc_file_path && (() => {
                                  const downloadUrl = m.unc_file_path.startsWith('uploads/') ? `${import.meta.env.VITE_API_URL || '/backend'}/${m.unc_file_path}` : `${import.meta.env.VITE_API_URL || '/backend'}/uploads/${m.unc_file_path}`;
                                  const isPdf = m.unc_file_path.toLowerCase().endsWith('.pdf');
                                  return (
                                    <a
                                      href={downloadUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      style={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: '32px',
                                        height: '32px',
                                        borderRadius: '6px',
                                        overflow: 'hidden',
                                        border: '1px solid var(--color-border-light)',
                                        background: '#ffffff',
                                        boxShadow: 'var(--shadow-sm)',
                                        transition: 'transform 0.15s'
                                      }}
                                      className="hover-scale"
                                      title="Bấm để xem chi tiết minh chứng"
                                    >
                                      {isPdf ? (
                                        <FileText size={16} color="var(--color-primary)" />
                                      ) : (
                                        <img 
                                          src={downloadUrl} 
                                          alt="Minh chứng" 
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                                        />
                                      )}
                                    </a>
                                  );
                                })()}
                              </div>

                              {/* Actions (Approve/Reject or Delete) */}
                              <div style={{ display: 'flex', gap: '4px', alignItems: 'center', justifyContent: 'flex-end' }}>
                                {isAdmin && m.status === 'paid' && m.unc_file_path && m.unc_file_path.trim() !== '' && (
                                  <>
                                    <button
                                      onClick={() => handleApproveFromModal(idx)}
                                      disabled={actioningMilestoneId !== null}
                                      style={{
                                        padding: '0 8px',
                                        height: '30px',
                                        background: '#10b981',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: actioningMilestoneId !== null ? 'not-allowed' : 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        opacity: actioningMilestoneId !== null ? 0.6 : 1
                                      }}
                                      title="Phê duyệt đợt tiền này"
                                    >
                                      {actioningMilestoneId === m.id && actioningType === 'approve' && (
                                        <Loader2 size={13} className="animate-spin" style={{ marginRight: 4 }} />
                                      )}
                                      Duyệt
                                    </button>
                                    <button
                                      onClick={() => handleRejectFromModal(idx)}
                                      disabled={actioningMilestoneId !== null}
                                      style={{
                                        padding: '0 8px',
                                        height: '30px',
                                        background: '#ef4444',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '6px',
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: actioningMilestoneId !== null ? 'not-allowed' : 'pointer',
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        opacity: actioningMilestoneId !== null ? 0.6 : 1
                                      }}
                                      title="Từ chối minh chứng"
                                    >
                                      {actioningMilestoneId === m.id && actioningType === 'reject' && (
                                        <Loader2 size={13} className="animate-spin" style={{ marginRight: 4 }} />
                                      )}
                                      Từ chối
                                    </button>
                                  </>
                                )}

                                {!isLocked && canEditMilestones && (
                                  <button
                                    onClick={() => handleRemoveMilestoneRow(idx)}
                                    style={{
                                      padding: '0 8px',
                                      height: '30px',
                                      color: '#ef4444',
                                      border: '1px solid rgba(239, 68, 68, 0.2)',
                                      background: 'transparent',
                                      borderRadius: '6px',
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s'
                                    }}
                                    title="Xóa đợt thanh toán"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Pane (Thảo luận & Lịch sử) */}
                <div style={{ flex: '0 0 420px', display: 'flex', flexDirection: 'column', height: '100%', borderLeft: '1px solid var(--color-border)' }}>
                  {/* Tabs */}
                  <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-light)', padding: '0 8px' }}>
                    <button
                      onClick={() => setActiveDrawerTab('history')}
                      style={{
                        flex: 1,
                        padding: '14px 10px',
                        border: 'none',
                        background: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: activeDrawerTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeDrawerTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <Clock size={14} />
                      Lịch sử ({historyLogs.length})
                    </button>
                    <button
                      onClick={() => setActiveDrawerTab('comments')}
                      style={{
                        flex: 1,
                        padding: '14px 10px',
                        border: 'none',
                        background: 'none',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        color: activeDrawerTab === 'comments' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                        borderBottom: activeDrawerTab === 'comments' ? '2px solid var(--color-primary)' : '2px solid transparent',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      <MessageSquare size={14} />
                      Thảo luận ({comments.length})
                    </button>
                  </div>

                  {/* Tab contents */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'var(--color-bg-light)' }}>
                    {activeDrawerTab === 'comments' ? (
                      <>
                        {loadingComments ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                            <Loader2 size={20} className="animate-spin" />
                          </div>
                        ) : comments.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', gap: '8px' }}>
                            <MessageSquare size={28} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Chưa có thảo luận nào cho giao dịch này</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {comments.map((c) => (
                              <div key={c.id} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                                <Avatar src={c.avatar_url} name={c.user_name} size="sm" />
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>{c.user_name}</span>
                                    <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                                      {new Date(c.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                                    </span>
                                  </div>
                                  <div style={{
                                    padding: '8px 12px',
                                    borderRadius: '0 8px 8px 8px',
                                    background: 'var(--color-surface)',
                                    border: '1px solid var(--color-border-light)',
                                    fontSize: '0.8125rem',
                                    color: 'var(--color-text)',
                                    lineHeight: 1.4
                                  }}>
                                    {c.body && /<[a-z][\s\S]*>/i.test(c.body) ? (
                                      <div 
                                        className="rich-comment-content text-left"
                                        dangerouslySetInnerHTML={{ __html: c.body }}
                                        style={{ fontSize: '0.8125rem', color: 'var(--color-text)', lineHeight: '1.4', textAlign: 'left' }}
                                      />
                                    ) : (
                                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text)', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap', textAlign: 'left', wordBreak: 'break-word' }}>{c.body}</p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                            <div ref={commentEndRef} />
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        {loadingHistory ? (
                          <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0', color: 'var(--color-text-muted)' }}>
                            <Loader2 size={20} className="animate-spin" />
                          </div>
                        ) : historyLogs.length === 0 ? (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', gap: '8px' }}>
                            <Clock size={28} style={{ opacity: 0.4 }} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>Chưa ghi nhận lịch sử chỉnh sửa nào</span>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '16px' }}>
                            {/* Timeline Line */}
                            <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '4px', width: '2px', background: 'var(--color-border-light)' }} />
                            
                            {historyLogs.map((log) => {
                              let actionLabel = log.action;
                              let actionColor = 'var(--color-primary)';
                              if (log.action === 'CREATE_DEPOSIT') {
                                actionLabel = 'Khởi tạo quy trình thanh toán';
                                actionColor = '#2563eb';
                              } else if (log.action === 'APPROVE_DEPOSIT_MILESTONE') {
                                actionLabel = 'Duyệt đợt tiền';
                                actionColor = '#10b981';
                              } else if (log.action === 'REJECT_DEPOSIT_MILESTONE') {
                                actionLabel = 'Từ chối UNC';
                                actionColor = '#ef4444';
                              } else if (log.action === 'CANCEL_DEPOSIT') {
                                actionLabel = 'Báo bể cọc (Hủy giao dịch)';
                                actionColor = '#ef4444';
                              } else if (log.action === 'UPDATE_COMMISSION') {
                                actionLabel = 'Cập nhật hoa hồng dự kiến';
                                actionColor = '#f59e0b';
                              } else if (log.action === 'UPDATE_SHARES' || log.action === 'ADMIN_UPDATE_COOP_SHARES') {
                                actionLabel = 'Cập nhật hoa hồng co-op';
                                actionColor = '#10b981';
                              } else if (log.action === 'UPDATE_MILESTONES') {
                                actionLabel = 'Cập nhật các đợt cọc';
                                actionColor = '#6366f1';
                              } else if (log.action === 'UPLOAD_DEPOSIT_UNC') {
                                actionLabel = 'Tải lên minh chứng (UNC)';
                                actionColor = '#3b82f6';
                              }
                              
                              return (
                                <div key={log.id} style={{ position: 'relative', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                  {/* Timeline Dot */}
                                  <div style={{
                                    position: 'absolute',
                                    top: '5px',
                                    left: '-16px',
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: actionColor,
                                    border: '2px solid var(--color-surface)',
                                    boxShadow: 'var(--shadow-sm)'
                                  }} />
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text)' }}>
                                      {log.user_name || 'Hệ thống'}
                                    </span>
                                    <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                                      {new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)', lineHeight: 1.4 }}>
                                    <strong style={{ color: actionColor }}>{actionLabel}</strong>: {log.new_data}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Send Comment Input */}
                  {activeDrawerTab === 'comments' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid var(--color-border)', padding: '12px', background: 'var(--color-surface)' }}>
                      <MentionInput
                        value={newCommentText}
                        onChange={(e: any) => setNewCommentText(e.target.value)}
                        placeholder="Nhập nội dung trao đổi... (Gõ @ để nhắc tên đồng nghiệp)"
                        style={{ 
                          width: '100%', 
                          minHeight: '60px', 
                          border: '1px solid var(--color-border)', 
                          borderRadius: '8px', 
                          outline: 'none', 
                          background: 'var(--color-bg)', 
                          color: 'var(--color-text)', 
                          boxSizing: 'border-box'
                        }}
                        disabled={isSubmittingComment}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                          type="button"
                          disabled={isSubmittingComment || !newCommentText || !newCommentText.replace(/<[^>]*>/g, '').trim()}
                          onClick={handleAddComment}
                          className="btn primary"
                          style={{
                            height: '32px',
                            padding: '0 16px',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            borderRadius: '8px',
                            cursor: (newCommentText && newCommentText.replace(/<[^>]*>/g, '').trim()) ? 'pointer' : 'not-allowed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            opacity: (newCommentText && newCommentText.replace(/<[^>]*>/g, '').trim()) ? 1 : 0.6
                          }}
                        >
                          {isSubmittingComment ? (
                            <>
                              <Loader2 size={12} className="spin animate-spin" /> Đang gửi...
                            </>
                          ) : (
                            <>
                              <Send size={12} /> Gửi
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>


            </motion.div>
          </div>
        )}
      </AnimatePresence>,
      document.body
    )}

      {showContactDrawer && selectedContact && (
        <Suspense fallback={null}>
          <CustomerProfileDrawer
            isOpen={showContactDrawer}
            onClose={() => setShowContactDrawer(false)}
            contact={selectedContact}
            onUpdate={() => {
              loadData();
            }}
          />
        </Suspense>
      )}
    </div>
  );
}
