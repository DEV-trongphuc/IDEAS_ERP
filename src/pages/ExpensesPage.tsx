import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  DollarSign, Plus, Search, Download, Truck, Coffee, Home,
  Briefcase, CreditCard, Tag, Eye, Pencil, Trash2, Loader2,
  CheckCircle2, Clock, TrendingDown, X, ArrowUpRight, ArrowDownRight, ChevronDown, Building2, Wallet, User,
  Upload, Paperclip, XCircle, Send, MessageSquare
} from 'lucide-react';
import { compressToWebP } from '../utils/imageCompress';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar } from '../components/ui/Avatar';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUIStore } from '../store/uiStore';
import { PeriodFilter, getDateRange } from '../components/ui/PeriodFilter';
import type { Period, DateRange } from '../components/ui/PeriodFilter';
import { Pagination } from '../components/ui/Pagination';
import { numberToVietnameseText } from '../utils/numberToText';
import { CustomSelect } from '../components/ui/CustomSelect';
import { CustomCheckbox } from '../components/ui/CustomCheckbox';
import api from '../api/axios';
import { Tooltip } from '../components/ui/Tooltip';
import { useAuth } from '../contexts/AuthContext';
import { MentionInput } from '../components/ui/MentionInput';

const PAGE_SIZE = 10;


const CATEGORIES = [
  { label: 'Di chuyển', icon: Truck, color: '#3b82f6' },
  { label: 'Ăn uống', icon: Coffee, color: '#f59e0b' },
  { label: 'Vận hành', icon: Home, color: '#10b981' },
  { label: 'Marketing', icon: Briefcase, color: '#ef4444' },
  { label: 'Công cụ', icon: CreditCard, color: '#BD1D2D' },
  { label: 'Nhân sự', icon: Tag, color: '#06b6d4' },
];

const FMT = (n: number, currency: string = 'VND') => {
  const normCurrency = currency === 'EURO' ? 'EUR' : currency;
  return new Intl.NumberFormat(normCurrency === 'VND' ? 'vi-VN' : 'en-US', {
    style: 'currency',
    currency: normCurrency,
    minimumFractionDigits: normCurrency === 'VND' ? 0 : 2,
    maximumFractionDigits: normCurrency === 'VND' ? 0 : 2
  }).format(n);
};
const fmtShort = (n: number) => {
  if (n >= 1e9) return (n / 1e9).toFixed(1) + 'T';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(0) + 'K';
  return n.toLocaleString('vi-VN');
};

const EMPTY_FORM = {
  title: '',
  category: 'Khác',
  amount: '',
  currency: 'VND',
  vat_amount: '',
  date: new Date().toISOString().split('T')[0],
  notes: '',
  approver_id: null as number | null,
  related_user_ids: [] as number[],
  vendor_name: '',
  has_vat_invoice: false,
  is_vat_inclusive: false,
  entities: [] as any[],
  image_url: '',
  request_bank_transfer: false,
  bank_name: '',
  bank_account_number: '',
  bank_account_name: ''
};

export const ExpensesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast, showConfirm } = useUIStore();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>(location.state?.period || 'this_month');
  const [dateRange, setDateRange] = useState<DateRange>(location.state?.dateRange || getDateRange('this_month'));
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [uploadingImg, setUploadingImg] = useState(false);
  // Unified delete confirmation under showConfirm store state
  const [viewItem, setViewItem] = useState<any>(null);
  const [rejectingItem, setRejectingItem] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [submittingReject, setSubmittingReject] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [catOpen, setCatOpen] = useState(false);
  const [users, setUsers] = useState<any[]>([]); // for approver dropdown
  const [contacts, setContacts] = useState<any[]>([]); // for splitting bill
  const [suppliers, setSuppliers] = useState<any[]>([]); // for vendor autocomplete
  const [vendorSearch, setVendorSearch] = useState('');
  const [showVendorDropdown, setShowVendorDropdown] = useState(false);
  const vendorRef = React.useRef<HTMLDivElement>(null);

  const { user } = useAuth();
  const [isRefunding, setIsRefunding] = useState(false);
  const [refundImgUrl, setRefundImgUrl] = useState('');
  const [uploadingRefund, setUploadingRefund] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('history');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchComments = useCallback(async (expenseId: number) => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/expenses/${expenseId}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const fetchHistory = useCallback(async (expenseId: number) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/expenses/${expenseId}/history`);
      setHistoryLogs(res.data.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  const handleAddComment = async () => {
    if (!commentText.trim() || !viewItem) return;
    setSubmittingComment(true);
    try {
      await api.post(`/expenses/${viewItem.id}/comments`, {
        body: commentText.trim()
      });
      setCommentText('');
      addToast('Thêm bình luận thành công', 'success');
      fetchComments(viewItem.id);
    } catch (err) {
      console.error('Error adding comment:', err);
      addToast('Lỗi khi thêm bình luận', 'error');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!viewItem) return;
    try {
      await api.delete(`/expenses/comments/${commentId}`);
      addToast('Đã xóa bình luận', 'success');
      fetchComments(viewItem.id);
    } catch (err) {
      console.error('Error deleting comment:', err);
      addToast('Không thể xóa bình luận', 'error');
    }
  };

  useEffect(() => {
    setIsRefunding(false);
    setRefundImgUrl('');
    setUploadingRefund(false);
    setSubmittingRefund(false);
    if (viewItem) {
      setActiveTab('comments');
      fetchComments(viewItem.id);
      fetchHistory(viewItem.id);
    }
  }, [viewItem, fetchComments, fetchHistory]);

  const [summary, setSummary] = useState<any>({ total: 0, approved: 0 });

  const fetchExpenses = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = { 
        page, 
        limit: PAGE_SIZE, 
        from: dateRange.from, 
        to: dateRange.to, 
        status: statusFilter,
        category: catFilter,
        search: search
      };
      const r = await api.get('/expenses', { params });
      const data = r.data.data;
      setItems(data.items || []);
      setTotal(data.total || 0);
      setSummary(data.summary || { total: 0, approved: 0 });
    } catch (e: any) {
      setItems([]);
      setTotal(0);
      addToast('Không thể tải danh sách chi phí', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, dateRange, statusFilter, catFilter, search]);

  // Fetch users & contacts for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorRef.current && !vendorRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    api.get('/users').then(r => { const d = r.data.data; setUsers(Array.isArray(d) ? d : (d?.items || [])); }).catch(() => {});
    api.get('/contacts?limit=1000').then(r => setContacts(r.data.data?.items || r.data.data || [])).catch(() => {});
    api.get('/suppliers').then(r => { const d = r.data.data; setSuppliers(Array.isArray(d) ? d : (d?.items || [])); }).catch(() => {});
  }, []);

  useEffect(() => { fetchExpenses(); }, [fetchExpenses]);

  useEffect(() => {
    if (location.state?.openCreate) {
      setEditItem(null);
      setVendorSearch('');
      const defaultEntities = location.state.defaultContact 
        ? [{ 
            entity_type: 'contact', 
            entity_id: location.state.defaultContact.id, 
            name: location.state.defaultContact.name, 
            avatar_url: location.state.defaultContact.avatar_url || ''
          }]
        : [];
      setForm({
        ...EMPTY_FORM,
        entities: defaultEntities
      });
      setShowModal(true);
      
      // Clear navigation state
      navigate(location.pathname, { replace: true });
    }
  }, [location.state, navigate]);

  // KPIs from server-side summary
  const totalAmt = Number(summary.total || 0);
  const approvedAmt = Number(summary.approved || 0);
  const pendingAmt = Number(summary.pending || 0);
  const prevTotal = Number(summary.prev_total || 0);
  const prevApproved = Number(summary.prev_approved || 0);
  const prevPending = Number(summary.prev_pending || 0);

  const getChangePercent = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return Math.round(((curr - prev) / prev) * 100);
  };

  const getPeriodCompareText = (p: string) => {
    switch (p) {
      case 'this_month': return 'so với tháng trước';
      case 'last_month': return 'so với tháng trước nữa';
      case 'today': return 'so với hôm qua';
      case 'this_week': return 'so với tuần trước';
      case 'last_30_days': return 'so với 30 ngày trước';
      default: return 'so với kỳ trước';
    }
  };

  const catBreakdown = CATEGORIES.map(c => ({
    ...c,
    total: items.filter(e => e.category === c.label).reduce((s, e) => s + Number(e.amount), 0),
  })).sort((a, b) => b.total - a.total).filter(c => c.total > 0);

  const openCreate = () => { 
    setEditItem(null); 
    const accountant = users.find((u: any) => u.role === 'accountant' || String(u.role).toLowerCase().includes('acc') || String(u.role).toLowerCase().includes('kế toán'));
    setForm({
      ...EMPTY_FORM,
      approver_id: accountant ? accountant.id : (users[0]?.id || null)
    });
    setVendorSearch(''); 
    setShowModal(true); 
  };
  const openEdit = (item: any) => { 
    setEditItem(item); 
    setVendorSearch(item.vendor_name || '');

    // Parse bank details from notes if any
    const bankRegex = /\[Thông tin chuyển khoản\]:\s*([^\-]+)\s*-\s*STK:\s*([^\-]+)\s*-\s*Chủ TK:\s*([^\n]+)/;
    const match = item.notes?.match(bankRegex);
    let request_bank_transfer = false;
    let bank_name = '';
    let bank_account_number = '';
    let bank_account_name = '';
    let cleanNotes = item.notes || '';
    if (match) {
      request_bank_transfer = true;
      bank_name = match[1].trim();
      bank_account_number = match[2].trim();
      bank_account_name = match[3].trim();
      cleanNotes = item.notes.replace(bankRegex, '').trim();
    }

    setForm({ 
      title: item.title || '',
      category: item.category || 'Khác',
      amount: String(item.amount || 0),
      currency: item.currency || 'VND',
      date: item.date || new Date().toISOString().split('T')[0],
      approver_id: item.approver_id ? Number(item.approver_id) : null,
      related_user_ids: Array.isArray(item.related_user_ids) 
        ? item.related_user_ids.map(Number) 
        : (typeof item.related_user_ids === 'string' && item.related_user_ids 
            ? item.related_user_ids.split(',').map(Number) 
            : []),
      vendor_name: item.vendor_name || '',
      has_vat_invoice: Boolean(item.has_vat_invoice),
      is_vat_inclusive: Boolean(item.is_vat_inclusive),
      notes: cleanNotes,
      entities: item.entities || [],
      image_url: item.image_url || '',
      request_bank_transfer,
      bank_name,
      bank_account_number,
      bank_account_name
    });
    setShowModal(true); 
  };

  const handleSave = async () => {
    if (!form.title || !form.amount) { addToast('Điền đầy đủ nội dung và số tiền', 'error'); return; }
    if (form.approver_id === null) { addToast('Vui lòng chọn người duyệt', 'error'); return; }
    setSaving(true);
    try {
      let payloadEntities = form.entities;
      if (form.entities.length > 0) {
        const splitAmt = Number(form.amount) / form.entities.length;
        payloadEntities = form.entities.map((e: any) => ({ ...e, amount: splitAmt }));
      }

      let finalNotes = form.notes || '';
      if (form.request_bank_transfer && form.bank_name && form.bank_account_number && form.bank_account_name) {
        finalNotes = `${form.notes || ''}\n[Thông tin chuyển khoản]: ${form.bank_name} - STK: ${form.bank_account_number} - Chủ TK: ${form.bank_account_name}`.trim();
      }

      if (editItem) {
        await api.put(`/expenses/${editItem.id}`, { ...form, notes: finalNotes, amount: Number(form.amount), entities: payloadEntities });
        addToast('Đã cập nhật chi phí', 'success');
      } else {
        await api.post('/expenses', { ...form, notes: finalNotes, amount: Number(form.amount), status: 'pending', entities: payloadEntities });
        addToast('Đã nhập chi phí mới – chờ phê duyệt', 'success');
      }
      setShowModal(false);
      fetchExpenses();
    } catch (e: any) {
      addToast(e.response?.data?.message || 'Lỗi khi lưu chi phí', 'error');
    } finally {
      setSaving(false);
    }
  };



  const toggleSelect = (id: number) => setSelected(prev => {
    const ns = new Set(prev);
    if (ns.has(id)) ns.delete(id);
    else ns.add(id);
    return ns;
  });

  const getCatInfo = (label: string) => CATEGORIES.find(c => c.label === label) || { color: '#6b7280', icon: Tag };

  return (
    <div>
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Chi phí Vận hành</h1>
          <p className="page-subtitle">Quản lý và theo dõi các khoản chi phí doanh nghiệp</p>
        </div>
        <div className="flex gap-2">
          <PeriodFilter
            value={period}
            onChange={(p, r) => { setPeriod(p); setDateRange(r); setPage(1); }}
          />
          <button className="btn secondary" onClick={() => addToast('Đang xuất bảng kê...', 'info')} title="Xuất dữ liệu">
            <Download size={16} />
            <span className="hide-on-mobile"> Xuất</span>
          </button>
          <button className="btn primary" onClick={openCreate} title="Nhập chi phí">
            <Plus size={16} />
            <span className="hide-on-mobile"> Nhập chi phí</span>
          </button>
        </div>
      </div>

      {/* KPI Cards — styled premium like the data distribution dashboard */}
      <div className="responsive-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          {
            label: 'Tổng chi phí kỳ này',
            value: FMT(totalAmt),
            icon: TrendingDown,
            color: '#ef4444',
            bg: 'rgba(239, 68, 68, 0.08)',
            sub: `${summary.total_count || 0} khoản`,
            change: getChangePercent(totalAmt, prevTotal),
            badWhenUp: true,
            decor: (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <path d="M10 20 L40 50 L60 40 L90 80" stroke="currentColor" strokeWidth="2" strokeDasharray="3 3" />
                <path d="M70 80 L90 80 L90 60" stroke="currentColor" strokeWidth="2" />
                <circle cx="10" cy="20" r="4" fill="currentColor" />
                <circle cx="40" cy="50" r="4" fill="currentColor" />
                <circle cx="60" cy="40" r="4" fill="currentColor" />
                <circle cx="90" cy="80" r="6" fill="currentColor" />
              </svg>
            )
          },
          {
            label: 'Đã phê duyệt',
            value: FMT(approvedAmt),
            icon: CheckCircle2,
            color: '#10b981',
            bg: 'rgba(16, 185, 129, 0.08)',
            sub: `${summary.approved_count || 0} khoản đã duyệt`,
            change: getChangePercent(approvedAmt, prevApproved),
            badWhenUp: false,
            decor: (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M35 50 L45 60 L65 40" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          },
          {
            label: 'Chờ phê duyệt',
            value: FMT(pendingAmt),
            icon: Clock,
            color: '#f59e0b',
            bg: 'rgba(245, 158, 11, 0.08)',
            sub: `${summary.pending_count || 0} khoản đang chờ`,
            change: getChangePercent(pendingAmt, prevPending),
            badWhenUp: true,
            decor: (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <path d="M50 20 L50 50 L70 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )
          },
          {
            label: 'Chi phí lớn nhất',
            value: summary.max_amount ? FMT(summary.max_amount) : '—',
            icon: DollarSign,
            color: '#a31422',
            bg: 'rgba(163, 20, 34, 0.08)',
            sub: summary.max_title ? summary.max_title : 'Chưa có dữ liệu',
            change: 0,
            badWhenUp: true,
            decor: (
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth="2" strokeDasharray="4 4" />
                <text x="35" y="68" fill="currentColor" fontSize="50" fontWeight="bold">$</text>
              </svg>
            )
          },
        ].map((k, i) => {
          const isDecrease = k.change < 0;
          const isZero = k.change === 0;
          const trendColor = isZero ? 'var(--color-text-muted)' : ((isDecrease !== k.badWhenUp) ? 'var(--color-success)' : 'var(--color-danger)');
          const TrendIcon = isZero ? null : (isDecrease ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />);
          const Icon = k.icon;
          
          return (
            <motion.div 
              key={i} 
              className="stat-card hover-lift" 
              initial={{ opacity: 0, y: 16 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ delay: i * 0.06 }} 
              style={{ 
                display: 'flex', 
                flexDirection: 'column', 
                minHeight: '135px',
                padding: '1.25rem',
                position: 'relative',
                overflow: 'hidden'
              }}
            >
              {/* Decorative Background SVG */}
              <div className="decor-svg" style={{ color: k.color }}>
                {k.decor}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', position: 'relative', zIndex: 2 }}>
                <span className="stat-label" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 800, fontSize: '0.7rem', color: 'var(--color-text-light)' }}>{k.label}</span>
                <div className="stat-icon" style={{
                  background: k.bg,
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: k.color,
                  flexShrink: 0
                }}>
                  <Icon size={18} />
                </div>
              </div>

              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative', zIndex: 2 }}>
                {loading ? (
                  <div className="skeleton" style={{ height: 28, width: '80%', borderRadius: 6, marginBottom: 8 }} />
                ) : (
                  <div className="stat-value" style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '1.5rem', lineHeight: 1.2 }}>{k.value}</div>
                )}
                <div className="stat-desc" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '100%', fontWeight: 500 }} title={k.sub}>{k.sub}</div>
                
                {!isZero && (
                  <div className="stat-change" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.75rem', fontWeight: 700, color: trendColor, marginTop: 'auto' }}>
                    {TrendIcon}
                    <span>{isDecrease ? '' : '+'}{k.change}%</span>
                    <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>{getPeriodCompareText(period)}</span>
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Category breakdown mini-bar */}
      {catBreakdown.length > 0 && (
        <div className="card" style={{ padding: '1rem 1.5rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Theo danh mục:</span>
          {catBreakdown.map(c => {
            const Icon = c.icon;
            return (
              <button key={c.label} onClick={() => { setCatFilter(catFilter === c.label ? '' : c.label); setPage(1); }}
                style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '4px 12px', borderRadius: 'var(--radius-full)', border: `1.5px solid ${catFilter === c.label ? c.color : 'var(--color-border)'}`, background: catFilter === c.label ? `${c.color}15` : 'transparent', cursor: 'pointer', transition: 'all 0.18s', fontSize: '0.8125rem' }}>
                <Icon size={13} color={c.color} />
                <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>{c.label}</span>
                <span style={{ color: 'var(--color-text-muted)' }}>{fmtShort(c.total)}</span>
              </button>
            );
          })}
          {catFilter && <button onClick={() => { setCatFilter(''); setPage(1); }} style={{ color: 'var(--color-text-muted)', background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}><X size={13} /> Bỏ lọc</button>}
        </div>
      )}

      {/* Filter bar */}
      <div className="card" style={{ padding: '0.875rem 1.25rem', marginBottom: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
        <div className="filter-search" style={{ flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ color: 'var(--color-text-muted)' }} />
          <input placeholder="Tìm theo nội dung, người nhập..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          {search && <button onClick={() => setSearch('')}><X size={13} /></button>}
        </div>

        <div style={{ width: 180 }}>
          <CustomSelect 
            options={[
              { value: '', label: 'Tất cả trạng thái' },
              { value: 'approved', label: 'Đã duyệt' },
              { value: 'pending', label: 'Chờ duyệt' }
            ]} 
            value={statusFilter} 
            onChange={val => { setStatusFilter(val.toString()); setPage(1); }} 
          />
        </div>

        {selected.size > 0 && (
          <button className="btn danger sm" onClick={() => { setItems(prev => prev.filter((e: any) => !selected.has(e.id))); setSelected(new Set()); addToast(`Đã xóa ${selected.size} khoản`, 'success'); }}>
            <Trash2 size={14} /> Xóa {selected.size} đã chọn
          </button>
        )}
      </div>

      {/* Main table */}
      <div className="card" style={{ overflow: 'visible' }}>
        <div className="table-wrap" style={{ maxHeight: 'calc(100vh - 340px)', overflowY: 'auto', overflowX: 'auto' }}>
          <table style={{ minWidth: 850 }}>
            <thead>
              <tr>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>Tên hóa đơn</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>Người tạo</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>Số tiền</th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>Người duyệt <Tooltip content="Thành viên chịu trách nhiệm phê duyệt khoản chi phí này." /></th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)' }}>Trạng thái <Tooltip content="Quy trình duyệt: Chờ duyệt (đang kiểm tra chứng từ), Đã duyệt (chấp thuận thanh toán và ghi nhận chi phí)." /></th>
                <th style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--color-surface)', textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading && Array.from({ length: 6 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j}><div className="skeleton" style={{ height: 20, borderRadius: 4, width: j === 1 ? '80%' : j === 2 ? '60%' : '70%' }} /></td>
                  ))}
                </tr>
              ))}
              <AnimatePresence>
                {!loading && items.map(exp => {
                    const catInfo = getCatInfo(exp.category);
                    const CatIcon = catInfo.icon;
                    const approver = users.find((u: any) => u.id === Number(exp.approver_id));
                  return (
                    <motion.tr 
                      key={exp.id} 
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                      onClick={() => setViewItem(exp)}
                      style={{ cursor: 'pointer' }}
                      className="hover-bg transition-colors"
                    >
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-text)' }}>{exp.title}</div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '2px 8px', borderRadius: 'var(--radius-full)', background: `${catInfo.color}12`, fontSize: '0.75rem', fontWeight: 600, color: catInfo.color }}>
                              <CatIcon size={10} color={catInfo.color} /> {exp.category}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Avatar src={exp.creator_avatar} name={exp.creator_name} size={24} style={{ border: '1px solid var(--color-border-light)' }} />
                          <div style={{ display: 'flex', flexDirection: 'column' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{exp.creator_name}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-text)' }}>{FMT(exp.amount, exp.currency)}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                            {exp.date && !isNaN(Date.parse(exp.date)) ? new Date(exp.date).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {exp.approver_id ? (
                            <>
                              <Avatar src={exp.approver_avatar} name={exp.approver_name || 'Admin'} size={24} style={{ border: '1px solid var(--color-border-light)' }} />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-text)' }}>{exp.approver_name || 'Admin'}</span>
                              </div>
                            </>
                          ) : (
                            <>
                              <div style={{ 
                                width: '24px', 
                                height: '24px', 
                                borderRadius: '50%', 
                                background: 'rgba(245, 158, 11, 0.08)', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                color: '#f59e0b', 
                                fontSize: '0.65rem',
                                fontWeight: 800,
                                border: '1px dashed rgba(245, 158, 11, 0.3)'
                              }}>
                                ?
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#f59e0b', fontStyle: 'italic' }}>Chờ duyệt</span>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className={`badge ${exp.status === 'approved' ? 'success' : 'warning'}`}>
                          {exp.status === 'approved' ? <><CheckCircle2 size={11} /> Đã duyệt</> : <><Clock size={11} /> Chờ duyệt</>}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1" style={{ justifyContent: 'flex-end' }}>
                          {exp.status !== 'approved' && (
                            <>
                              <button className="btn-icon sm" title="Sửa" onClick={(e) => { e.stopPropagation(); openEdit(exp); }}><Pencil size={13} /></button>
                              <button className="btn-icon sm text-danger" title="Xóa" onClick={(e) => {
                                e.stopPropagation();
                                showConfirm({
                                  title: 'Xóa khoản chi phí?',
                                  message: `Khoản chi "${exp.title}" sẽ bị xóa vĩnh viễn khỏi hệ thống. Thao tác này không thể hoàn tác.`,
                                  confirmText: 'Xóa ngay',
                                  cancelText: 'Hủy',
                                  isDanger: true,
                                  onConfirm: async () => {
                                    try {
                                      await api.delete(`/expenses/${exp.id}`);
                                      setItems(prev => prev.filter(item => item.id !== exp.id));
                                      addToast('Đã xóa chi phí', 'success');
                                    } catch (error: any) {
                                      addToast(error.response?.data?.message || 'Lỗi khi xóa chi phí', 'error');
                                    }
                                  }
                                });
                              }}><Trash2 size={13} /></button>
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {!loading && total === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
                  Không có khoản chi phí nào trong kỳ này
                </td></tr>
              )}
            </tbody>
          </table>
        </div>
        <Pagination total={total} page={page} pageSize={PAGE_SIZE} onChange={setPage} showSizeChanger onPageSizeChange={() => setPage(1)} />
      </div>

      {/* Add/Edit Drawer */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {showModal && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', justifyContent: 'flex-end' }}>
              {/* Backdrop Overlay */}
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => !saving && setShowModal(false)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1000005
                }}
              />

              {/* Drawer Sheet Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
                style={{
                  position: 'fixed',
                  top: 0,
                  bottom: 0,
                  left: isMobile ? 0 : 'var(--sidebar-width, 220px)',
                  right: 0,
                  background: 'linear-gradient(180deg, var(--color-bg) 0%, var(--color-border-light) 100%)',
                  boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  flexDirection: 'column',
                  boxSizing: 'border-box',
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                  overflow: 'hidden',
                  zIndex: 1000010
                }}
              >
                
                <div className="modal-header" style={{ padding: '1.25rem 1.5rem', background: 'linear-gradient(to right, var(--color-bg), var(--color-surface))', borderBottom: '1px solid var(--color-border)', flexShrink: 0, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ fontWeight: 800, fontSize: '1.25rem' }}>{editItem ? 'Cập nhật khoản chi' : 'Nhập chi phí mới'}</h3>
                    <p style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: 4 }}>Vui lòng điền thông tin chi tiết và người phê duyệt.</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="btn-icon-bare" disabled={saving}><X size={20} /></button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Nội dung chi *</label>
                  <input className="form-input" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="VD: Thuê văn phòng tháng 6..." />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Đơn vị thụ hưởng <span style={{ color: 'var(--color-text-muted)', fontSize: '0.8rem', fontWeight: 400 }}>(Thanh toán cho ai?)</span></label>
                  <div style={{ position: 'relative' }} ref={vendorRef}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '0 1rem', height: '44px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-lg)', background: 'var(--color-surface)' }}>
                      <input
                        style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontSize: '0.875rem', color: 'var(--color-text)' }}
                        placeholder="Tìm NCC hoặc nhập tự do..."
                        value={vendorSearch}
                        onChange={e => { setVendorSearch(e.target.value); setForm({ ...form, vendor_name: e.target.value }); setShowVendorDropdown(true); }}
                        onFocus={() => setShowVendorDropdown(true)}
                      />
                      {vendorSearch && <button type="button" onClick={() => { setVendorSearch(''); setForm({ ...form, vendor_name: '' }); }} style={{ color: 'var(--color-text-muted)', display: 'flex' }}><X size={14} /></button>}
                      <Building2 size={15} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                      <ChevronDown size={13} style={{ color: 'var(--color-text-muted)', flexShrink: 0 }} />
                    </div>

                    {showVendorDropdown && (
                      <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, background: 'var(--color-surface)', borderRadius: '14px', border: '1px solid var(--color-border-light)', boxShadow: '0 16px 32px -8px rgba(0,0,0,0.12)', zIndex: 200, overflow: 'hidden' }}>
                        {(Array.isArray(suppliers) ? suppliers : []).filter(s => (s.name || s.company_name || '').toLowerCase().includes(vendorSearch.toLowerCase())).slice(0, 6).map(s => (
                          <div
                            key={s.id}
                            onMouseDown={() => { const n = s.name || s.company_name || ''; setVendorSearch(n); setForm({ ...form, vendor_name: n }); setShowVendorDropdown(false); }}
                            style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 14px', cursor: 'pointer', transition: 'background 0.15s' }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-primary-light)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ width: 30, height: 30, borderRadius: '8px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.8rem', flexShrink: 0 }}>{(s.name || s.company_name || '?')[0]}</div>
                            <div>
                              <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>{s.name || s.company_name}</p>
                              {s.phone && <p style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)' }}>{s.phone}</p>}
                            </div>
                          </div>
                        ))}
                        {vendorSearch && !suppliers.find(s => (s.name || s.company_name) === vendorSearch) && (
                          <div
                            onMouseDown={() => { setForm({ ...form, vendor_name: vendorSearch }); setShowVendorDropdown(false); }}
                            style={{ padding: '9px 14px', cursor: 'pointer', borderTop: '1px solid var(--color-border-light)', fontSize: '0.8125rem', color: 'var(--color-primary)', fontWeight: 700 }}
                          >
                            + Dùng "{vendorSearch}" (nhập tự do)
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.7fr 0.8fr', gap: '1rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Số tiền ({form.currency || 'VND'}) *</label>
                    <div style={{ position: 'relative' }}>
                      <input className="form-input" type="number" min="0" style={{ paddingRight: '2.5rem', fontWeight: 800, color: 'var(--color-danger)', fontSize: '1.1rem' }} value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" />
                      <Wallet size={16} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
                    </div>
                    {form.amount && Number(form.amount) > 0 && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
                        style={{ fontSize: '0.75rem', color: 'var(--color-primary)', fontWeight: 700, marginTop: '6px', fontStyle: 'italic', paddingLeft: '4px' }}
                      >
                        Bằng chữ: {numberToVietnameseText(form.amount, form.currency || 'VND')}
                      </motion.div>
                    )}
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Loại tiền tệ</label>
                    <CustomSelect
                      options={[
                        { value: 'VND', label: 'VND' },
                        { value: 'USD', label: 'USD' },
                        { value: 'EURO', label: 'EURO' },
                        { value: 'CHF', label: 'CHF' }
                      ]}
                      value={form.currency || 'VND'}
                      onChange={val => setForm({ ...form, currency: val })}
                      width="100%"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Ngày chi</label>
                    <input className="form-input" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                  </div>
                </div>

                {/* VAT Settings Panel */}
                <div style={{ background: 'var(--color-bg)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <CustomCheckbox 
                        checked={form.has_vat_invoice} 
                        onChange={() => setForm({ ...form, has_vat_invoice: !form.has_vat_invoice })} 
                        label="Có hóa đơn VAT"
                      />
                      <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '2rem' }}>Chứng từ thuế</p>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <CustomCheckbox 
                        checked={form.is_vat_inclusive} 
                        onChange={() => setForm({ ...form, is_vat_inclusive: !form.is_vat_inclusive })} 
                        label="Bao gồm VAT"
                      />
                      <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '2rem' }}>Giá sau thuế</p>
                    </div>
                  </div>

                  {form.has_vat_invoice && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem', display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1rem' }}>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Thuế %</label>
                        <CustomSelect 
                          options={[
                            { value: '0', label: '0%' },
                            { value: '5', label: '5%' },
                            { value: '8', label: '8%' },
                            { value: '10', label: '10%' }
                          ]} 
                          value={form.amount ? Math.round((Number(form.vat_amount) / Number(form.amount)) * 100).toString() : '10'}
                          onChange={val => {
                            const pct = Number(val);
                            const amt = Math.round(Number(form.amount) * (pct / 100));
                            setForm({ ...form, vat_amount: amt.toString() });
                          }} 
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-primary)' }}>Tiền thuế VAT ({form.currency || 'VND'})</label>
                        <input 
                          className="form-input" 
                          type="number" 
                          value={form.vat_amount || ''} 
                          onChange={e => setForm({ ...form, vat_amount: e.target.value })} 
                          placeholder="Nhập số tiền thuế..." 
                        />
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Bank Transfer Details Panel */}
                <div style={{ background: 'var(--color-bg)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <CustomCheckbox 
                    checked={form.request_bank_transfer} 
                    onChange={() => setForm({ ...form, request_bank_transfer: !form.request_bank_transfer })} 
                    label="Yêu cầu thanh toán chuyển khoản"
                  />
                  <p style={{ fontSize: '0.65rem', color: 'var(--color-text-muted)', marginLeft: '2rem', marginTop: '-0.5rem' }}>
                    Nhập thông tin số tài khoản và ngân hàng thụ hưởng nếu cần chuyển khoản
                  </p>

                  {form.request_bank_transfer && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }} 
                      animate={{ opacity: 1, height: 'auto' }} 
                      style={{ borderTop: '1px solid var(--color-border-light)', paddingTop: '1rem', display: 'flex', flexDirection: 'column', gap: '12px' }}
                    >
                      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)', gap: '1rem' }}>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Tên ngân hàng *</label>
                          <input 
                            className="form-input" 
                            type="text" 
                            value={form.bank_name || ''} 
                            onChange={e => setForm({ ...form, bank_name: e.target.value })} 
                            placeholder="Ví dụ: MB Bank, VCB..." 
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Số tài khoản (STK) *</label>
                          <input 
                            className="form-input" 
                            type="text" 
                            value={form.bank_account_number || ''} 
                            onChange={e => setForm({ ...form, bank_account_number: e.target.value })} 
                            placeholder="Nhập số tài khoản..." 
                            required
                          />
                        </div>
                        <div className="form-group" style={{ margin: 0 }}>
                          <label className="form-label" style={{ fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--color-text-light)' }}>Chủ tài khoản *</label>
                          <input 
                            className="form-input" 
                            type="text" 
                            value={form.bank_account_name || ''} 
                            onChange={e => setForm({ ...form, bank_account_name: e.target.value.toUpperCase() })} 
                            placeholder="TÊN CHỦ TÀI KHOẢN..." 
                            required
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontWeight: 600 }}>Danh mục chi phí</label>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {CATEGORIES.map(c => {
                      const Icon = c.icon;
                      return (
                        <button key={c.label} type="button" onClick={() => setForm({ ...form, category: c.label })}
                          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 14px', borderRadius: 'var(--radius-full)', border: `2px solid ${form.category === c.label ? c.color : 'var(--color-border)'}`, background: form.category === c.label ? `${c.color}15` : 'transparent', color: form.category === c.label ? c.color : 'var(--color-text-light)', fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.18s' }}>
                          <Icon size={13} /> {c.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ color: 'var(--color-danger)', fontWeight: 700 }}>Người duyệt *</label>
                    <CustomSelect 
                      options={users.map((u: any) => ({ 
                        value: u.id, 
                        label: u.full_name, 
                        avatar: u.avatar_url,
                        sublabel: [u.phone, u.email, u.role].filter(Boolean).join(' - ')
                      }))}
                      value={form.approver_id}
                      onChange={val => {
                        const numVal = Number(val);
                        setForm({ 
                          ...form, 
                          approver_id: numVal,
                          related_user_ids: form.related_user_ids.filter((x: number) => x !== numVal)
                        });
                      }}
                      placeholder="Chọn người duyệt..."
                      searchable
                      showAvatars
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontWeight: 600 }}>Người liên quan</label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      <div style={{ maxHeight: '80px', overflowY: 'auto', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-md)', padding: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                        {form.related_user_ids.length === 0 ? <span style={{fontSize: '0.75rem', color: 'var(--color-text-muted)'}}>Chưa chọn ai</span> : 
                          form.related_user_ids.map((uid: number) => {
                            const u = users.find((x:any) => x.id === uid);
                            return (
                              <span key={uid} style={{ background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 'var(--radius-full)', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '6px', border: '1px solid rgba(163, 20, 34, 0.2)' }}>
                                <Avatar name={u?.full_name} size={16} />
                                {u?.full_name} 
                                <X size={10} style={{cursor:'pointer'}} onClick={() => setForm({...form, related_user_ids: form.related_user_ids.filter((x: number) => x !== uid)})} />
                              </span>
                            );
                          })
                        }
                      </div>
                      <CustomSelect
                        options={users.filter((u:any) => !form.related_user_ids.includes(u.id) && u.id !== form.approver_id).map((u: any) => ({
                          value: String(u.id),
                          label: u.full_name,
                          avatar: u.avatar_url,
                          sublabel: [u.phone, u.email, u.role].filter(Boolean).join(' - ')
                        }))}
                        value=""
                        onChange={(val) => {
                          const numVal = Number(val);
                          if (numVal && !form.related_user_ids.includes(numVal)) {
                            setForm({ ...form, related_user_ids: [...form.related_user_ids, numVal] });
                          }
                        }}
                        placeholder="+ Thêm người liên quan..."
                        showAvatars
                        searchable
                      />
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div className="form-group" style={{ margin: 0 }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Ghi chú chi tiết</label>
                    <textarea 
                      className="form-textarea" 
                      rows={3} 
                      value={form.notes} 
                      onChange={e => setForm({ ...form, notes: e.target.value })} 
                      placeholder="Mô tả thêm nếu cần..." 
                      style={{ minHeight: '90px', resize: 'vertical' }} 
                    />
                  </div>
                  <div className="form-group" style={{ margin: 0, display: 'flex', flexDirection: 'column' }}>
                    <label className="form-label" style={{ fontWeight: 600 }}>Đính kèm hóa đơn / chứng từ</label>
                    <div style={{
                      flex: 1, border: '2px dashed var(--color-border)', borderRadius: '12px',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      padding: '8px', position: 'relative', cursor: 'pointer', background: 'var(--color-bg)',
                      overflow: 'hidden', minHeight: '90px', transition: 'border-color 0.2s'
                    }}
                      onDragOver={e => e.preventDefault()}
                      onClick={() => document.getElementById('expense-image-upload')?.click()}
                    >
                      {uploadingImg ? (
                        <div className="flex flex-col items-center gap-1">
                          <div className="spinner sm"></div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Đang nén & tải lên...</span>
                        </div>
                      ) : form.image_url ? (
                        <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <img 
                            src={form.image_url.startsWith('http') ? form.image_url : `${import.meta.env.VITE_API_URL || '/backend'}${form.image_url}`} 
                            alt="Hóa đơn" 
                            style={{ maxWidth: '100%', maxHeight: '72px', objectFit: 'contain', borderRadius: '6px' }} 
                          />
                          <button 
                            type="button"
                            style={{
                              position: 'absolute', top: -4, right: -4, background: 'rgba(239, 68, 68, 0.9)', 
                              color: 'white', border: 'none', borderRadius: '50%', width: 18, height: 18, 
                              display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setForm({ ...form, image_url: '' });
                            }}
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1 text-center" style={{ padding: '4px' }}>
                          <Upload size={20} className="text-light" />
                          <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Chọn hoặc kéo thả ảnh</span>
                          <span style={{ fontSize: '0.6rem', color: 'var(--color-text-muted)' }}>WEBP, PNG, JPG (tối đa 5MB)</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="expense-image-upload" 
                        accept="image/*" 
                        style={{ display: 'none' }} 
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setUploadingImg(true);
                          try {
                            // 1. Convert & compress to WebP
                            const compressedFile = await compressToWebP(file);
                            // 2. Upload WebP to server
                            const uploadData = new FormData();
                            uploadData.append('file', compressedFile);
                            if (form.image_url) {
                              uploadData.append('previous_url', form.image_url);
                            }
                            const res = await api.post('/upload', uploadData, {
                              headers: { 'Content-Type': 'multipart/form-data' }
                            });
                            if (res.data && res.data.success && res.data.data?.url) {
                              setForm({ ...form, image_url: res.data.data.url });
                              addToast('Tải lên và nén ảnh hóa đơn thành công!', 'success');
                            } else {
                              addToast('Tải ảnh thất bại', 'error');
                            }
                          } catch (err: any) {
                            addToast('Lỗi khi nén & tải ảnh: ' + (err.message || err), 'error');
                          } finally {
                            setUploadingImg(false);
                          }
                        }}
                      />
                    </div>
                  </div>
                </div>

                <div className="form-group" style={{ background: 'var(--color-bg)', padding: '1.25rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border-light)' }}>
                  <label className="form-label" style={{ fontWeight: 600 }}>Áp dụng cho (Chia đều tiền bill)</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                    {form.entities.length === 0 ? <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Chưa áp dụng cho khách hàng nào</span> : 
                      form.entities.map((e: any) => (
                        <span key={e.entity_id} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'var(--color-primary-light)', color: 'var(--color-primary)', padding: '6px 12px', borderRadius: 'var(--radius-lg)', fontSize: '0.8125rem', fontWeight: 600, border: '1px solid rgba(163, 20, 34, 0.2)' }}>
                          <Avatar name={e.name} src={e.avatar_url} size={20} />
                          {e.name || `Khách hàng #${e.entity_id}`}
                          <X size={14} style={{ cursor: 'pointer', marginLeft: 4 }} onClick={() => setForm({ ...form, entities: form.entities.filter((x: any) => x.entity_id !== e.entity_id) })} />
                        </span>
                      ))
                    }
                  </div>
                  <CustomSelect
                    options={contacts.filter(c => !form.entities.find((e: any) => e.entity_id === c.id)).map(c => ({ 
                      value: String(c.id), 
                      label: `${c.last_name || ''} ${c.first_name}`.trim(),
                      avatar: c.avatar_url,
                      sublabel: c.company_name 
                    }))}
                    value=""
                    onChange={(val) => {
                      const found = contacts.find(c => String(c.id) === val);
                      if (found) {
                        setForm({ ...form, entities: [...form.entities, { entity_type: 'contact', entity_id: found.id, name: `${found.last_name || ''} ${found.first_name}`.trim(), avatar_url: found.avatar_url }] });
                      }
                    }}
                    placeholder="+ Thêm khách hàng chia tiền bill..."
                    searchable
                    showAvatars
                  />
                </div>
              </div>

                <div className="modal-footer" style={{ padding: '1.25rem 1.5rem', background: 'var(--color-bg)', borderTop: '1px solid var(--color-border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', flexShrink: 0 }}>
                  <button className="btn secondary" onClick={() => setShowModal(false)} disabled={saving}>Hủy</button>
                  <button className="btn primary" onClick={handleSave} disabled={saving} style={{ minWidth: 140 }}>
                    {saving ? <Loader2 size={16} className="spin" /> : <CheckCircle2 size={16} />}
                    {saving ? 'Đang lưu...' : (editItem ? 'Cập nhật' : 'Gửi phê duyệt')}
                  </button>
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>
    , document.body)}

      {/* Quick View Drawer */}
      {typeof document !== 'undefined' && createPortal(
        <AnimatePresence>
          {viewItem && (
            <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', justifyContent: 'flex-end' }}>
              {/* Backdrop Overlay */}
              <motion.div
                className="drawer-backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setViewItem(null)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  zIndex: 1000005
                }}
              />

              {/* Drawer Sheet Panel */}
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                onClick={e => e.stopPropagation()}
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
                  zIndex: 1000010,
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
                  background: 'var(--color-surface)',
                  flexShrink: 0
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <button
                      onClick={() => setViewItem(null)}
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
                    >
                      <X size={20} />
                    </button>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                      Chi tiết phiếu chi #EXP-{viewItem.id}
                    </h2>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* Pencil Edit Action next to status badge */}
                    {viewItem.status !== 'approved' && (
                      <button 
                        className="btn secondary sm" 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          background: 'var(--color-bg)', 
                          border: '1px solid var(--color-border)', 
                          color: 'var(--color-text-muted)', 
                          borderRadius: '6px', 
                          height: '32px', 
                          width: '32px', 
                          padding: 0,
                          cursor: 'pointer' 
                        }} 
                        title="Chỉnh sửa" 
                        onClick={() => { const item = viewItem; setViewItem(null); openEdit(item); }}
                      >
                        <Pencil size={14} style={{ color: 'var(--color-text-muted)' }} />
                      </button>
                    )}
                    <span className={`badge ${viewItem.status === 'approved' ? (viewItem.is_refunded ? 'info' : 'success') : viewItem.status === 'rejected' ? 'danger' : 'warning'}`} style={{ padding: '6px 12px', fontSize: '0.75rem', borderRadius: '8px', fontWeight: 700 }}>
                      {viewItem.status === 'approved' ? (viewItem.is_refunded ? 'Đã thanh toán' : 'Đã duyệt') : viewItem.status === 'rejected' ? 'Từ chối' : 'Chờ duyệt'}
                    </span>
                  </div>
                </div>

                {/* Two-pane layout body */}
                <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                  
                  {/* Left Pane: Info & Action panel (60%) */}
                  <div style={{
                    flex: 3,
                    overflowY: 'auto',
                    padding: '1.5rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1.5rem',
                    borderRight: '1px solid var(--color-border)',
                    background: 'var(--color-bg-secondary)'
                  }}>
                    
                    {/* Amount Banner Card */}
                    <div style={{ 
                      padding: '1.5rem', 
                      background: 'linear-gradient(135deg, var(--color-primary-light, #fff5f5) 0%, #ffffff 100%)', 
                      borderRadius: '16px', 
                      border: '1px solid rgba(189, 29, 45, 0.12)',
                      boxShadow: '0 4px 15px rgba(189, 29, 45, 0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      flexShrink: 0
                    }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Tổng số tiền chi
                        </span>
                        <h1 style={{ fontSize: '1.75rem', fontWeight: 900, color: 'var(--color-text)', margin: 0 }}>
                          {FMT(viewItem.amount, viewItem.currency)}
                        </h1>
                        <p style={{ fontSize: '0.75rem', fontWeight: 600, fontStyle: 'italic', color: 'var(--color-text-muted)', margin: 0, marginTop: '2px' }}>
                          Bằng chữ: {numberToVietnameseText(Number(viewItem.amount), viewItem.currency)}
                        </p>
                      </div>
                      <div style={{
                        background: 'rgba(189, 29, 45, 0.08)',
                        padding: '12px',
                        borderRadius: '12px',
                        color: 'var(--color-primary)'
                      }}>
                        <Wallet size={24} />
                      </div>
                    </div>

                    {/* Details Info Card */}
                    <div className="card" style={{ 
                      background: 'var(--color-surface)',
                      border: '1px solid var(--color-border-light)',
                      borderRadius: '16px',
                      padding: '1.5rem',
                      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '1rem'
                    }}>
                      <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px' }}>
                        Thông tin chi tiết phiếu chi
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem 1rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Nội dung chi</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>{viewItem.title}</span>
                        </div>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Danh mục chi</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>{viewItem.category}</span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Ngày chi</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            {viewItem.date && !isNaN(Date.parse(viewItem.date)) ? new Date(viewItem.date).toLocaleDateString('vi-VN') : '—'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Ngày tạo phiếu</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)' }}>
                            {viewItem.created_at ? new Date(viewItem.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' }) : '—'}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Người tạo</span>
                          <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Avatar src={viewItem.creator_avatar} name={viewItem.creator_name} size={18} />
                            {viewItem.creator_name}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Người duyệt</span>
                          {viewItem.approver_name ? (
                            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: viewItem.status === 'approved' ? 'var(--color-success)' : 'var(--color-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Avatar src={viewItem.approver_avatar} name={viewItem.approver_name} size={18} />
                              {viewItem.approver_name}
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-text-muted)', fontStyle: 'italic' }}>Chưa phê duyệt</span>
                          )}
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: 'span 2', borderTop: '1px dotted var(--color-border-light)', paddingTop: '10px' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Áp dụng cho đối tượng</span>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '2px' }}>
                            {(viewItem.entities && viewItem.entities.length > 0) ? (
                              viewItem.entities.map((e: any, idx: number) => {
                                const typeText = e.entity_type === 'contact' ? 'KHTN' : (e.entity_type === 'company' ? 'Công ty' : 'Cơ hội');
                                return (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'var(--color-bg)', border: '1px solid var(--color-border-light)', padding: '4px 10px', borderRadius: '8px', fontSize: '0.775rem' }}>
                                    {e.entity_type === 'contact' && (
                                      <Avatar src={e.avatar_url} name={e.name} size={16} />
                                    )}
                                    <span style={{ fontWeight: 600, color: 'var(--color-text)' }}>
                                      {e.name || e.entity_id}
                                    </span>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '0.72rem' }}>
                                      ({typeText}{Number(e.amount) > 0 ? ': ' + FMT(e.amount, viewItem.currency) : ''})
                                    </span>
                                  </div>
                                );
                              })
                            ) : (
                              <span style={{ fontStyle: 'italic', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Không áp dụng</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bank Transfer Info parsed from notes */}
                    {(() => {
                      const bankRegex = /\[Thông tin chuyển khoản\]:\s*([^\-]+)\s*-\s*STK:\s*([^\-]+)\s*-\s*Chủ TK:\s*([^\n]+)/;
                      const match = viewItem.notes?.match(bankRegex);
                      if (match) {
                        const bankName = match[1].trim();
                        const bankNum = match[2].trim();
                        const bankOwner = match[3].trim();
                        return (
                          <div className="card" style={{ 
                            background: 'var(--color-surface)',
                            border: '1px solid rgba(16, 185, 129, 0.15)',
                            borderRadius: '16px',
                            padding: '1.5rem',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1rem'
                          }}>
                            <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-success)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Wallet size={14} style={{ color: 'var(--color-success)' }} /> Thông tin chuyển khoản thụ hưởng
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Ngân hàng</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{bankName}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Số tài khoản (STK)</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)', letterSpacing: '0.5px' }}>{bankNum}</span>
                              </div>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', gridColumn: 'span 2' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>Tên người thụ hưởng</span>
                                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text)' }}>{bankOwner}</span>
                              </div>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Notes / Ghi chú (excluding bank information) */}
                    {(() => {
                      let cleanNotes = viewItem.notes || '';
                      const bankRegex = /\[Thông tin chuyển khoản\]:[^\n]*/;
                      cleanNotes = cleanNotes.replace(bankRegex, '').trim();
                      if (cleanNotes) {
                        return (
                          <div style={{ 
                            padding: '1.25rem', 
                            background: 'rgba(245, 158, 11, 0.05)', 
                            border: '1px solid rgba(245, 158, 11, 0.15)',
                            borderLeft: '4px solid #f59e0b', 
                            borderRadius: '12px', 
                            fontSize: '0.825rem', 
                            color: 'var(--color-warning-dark)',
                            lineHeight: 1.45
                          }}>
                            <span style={{ fontWeight: 800, display: 'block', marginBottom: '4px', fontSize: '0.72rem', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Ghi chú / Thông tin thêm</span>
                            {cleanNotes}
                          </div>
                        );
                      }
                      return null;
                    })()}

                    {/* Attachments Section */}
                    {(viewItem.image_url || viewItem.refund_image_url) && (
                      <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '12px', 
                        background: 'var(--color-surface)', 
                        padding: '1.5rem', 
                        borderRadius: '16px', 
                        border: '1px solid var(--color-border-light)',
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
                      }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid var(--color-border-light)', paddingBottom: '8px', marginBottom: '4px' }}>
                          Tài liệu đính kèm
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: '16px' }}>
                          {viewItem.image_url && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Ảnh hóa đơn đề xuất:</span>
                              <div 
                                onClick={() => window.open(viewItem.image_url.startsWith('http') ? viewItem.image_url : `${import.meta.env.VITE_API_URL || '/backend'}${viewItem.image_url}`, '_blank')}
                                style={{ border: '1px solid var(--color-border-light)', borderRadius: '12px', overflow: 'hidden', height: '140px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.9';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <img 
                                  src={viewItem.image_url.startsWith('http') ? viewItem.image_url : `${import.meta.env.VITE_API_URL || '/backend'}${viewItem.image_url}`} 
                                  alt="Hóa đơn" 
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                />
                              </div>
                            </div>
                          )}

                          {viewItem.refund_image_url && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--color-text-muted)' }}>Ủy nhiệm chi / Chuyển khoản:</span>
                              <div 
                                onClick={() => window.open(viewItem.refund_image_url.startsWith('http') ? viewItem.refund_image_url : `${import.meta.env.VITE_API_URL || '/backend'}${viewItem.refund_image_url}`, '_blank')}
                                style={{ border: '1px solid var(--color-border-light)', borderRadius: '12px', overflow: 'hidden', height: '140px', background: 'var(--color-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s ease', boxShadow: 'var(--shadow-sm)' }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = '0.9';
                                  e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = '1';
                                  e.currentTarget.style.transform = 'translateY(0)';
                                }}
                              >
                                <img 
                                  src={viewItem.refund_image_url.startsWith('http') ? viewItem.refund_image_url : `${import.meta.env.VITE_API_URL || '/backend'}${viewItem.refund_image_url}`} 
                                  alt="UNC" 
                                  style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} 
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Refund confirmation for Accountant/Admin if approved but not yet refunded */}
                    {viewItem.status === 'approved' && !viewItem.is_refunded && (
                      <div style={{ background: 'var(--color-surface)', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--color-border-light)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        <h4 style={{ fontSize: '0.85rem', fontWeight: 800, margin: 0, color: 'var(--color-text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Wallet size={16} className="text-warning" /> Hạch toán thanh toán khoản chi
                        </h4>
                        <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Khoản chi đã được duyệt. Tải lên ảnh UNC hoặc Biên lai thanh toán để hoàn tất hạch toán thực chi.</p>
                        
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
                          <div 
                            onClick={() => document.getElementById('refund-image-upload')?.click()}
                            style={{
                              width: '120px',
                              height: '120px',
                              border: '2px dashed var(--color-border)',
                              borderRadius: '12px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'var(--color-surface)',
                              overflow: 'hidden',
                              position: 'relative',
                              flexShrink: 0
                            }}
                          >
                            {uploadingRefund ? (
                              <Loader2 size={24} className="spin text-primary" />
                            ) : refundImgUrl ? (
                              <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                                <img src={refundImgUrl.startsWith('http') ? refundImgUrl : `${import.meta.env.VITE_API_URL || '/backend'}${refundImgUrl}`} alt="Refund proof" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button 
                                  style={{
                                    position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setRefundImgUrl('');
                                  }}
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            ) : (
                              <div className="flex flex-col items-center gap-1 text-center" style={{ padding: '6px' }}>
                                <Upload size={22} className="text-light" style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }} />
                                <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Tải ảnh UNC</span>
                              </div>
                            )}
                            <input 
                              type="file" 
                              id="refund-image-upload" 
                              accept="image/*" 
                              style={{ display: 'none' }} 
                              onChange={async (e) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                setUploadingRefund(true);
                                try {
                                  const webpBlob = await compressToWebP(file);
                                  const compFile = new File([webpBlob], 'refund_proof.webp', { type: 'image/webp' });
                                  const fd = new FormData();
                                  fd.append('file', compFile);
                                  const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
                                  if (res.data && res.data.data?.url) {
                                    setRefundImgUrl(res.data.data.url);
                                  } else {
                                    addToast('Lỗi tải ảnh', 'error');
                                  }
                                } catch (err: any) {
                                  addToast('Lỗi tải ảnh: ' + err.message, 'error');
                                } finally {
                                  setUploadingRefund(false);
                                }
                              }}
                            />
                          </div>

                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                            <span style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                              {refundImgUrl ? 'Đã nhận ảnh chứng từ thành công.' : 'Vui lòng chọn ảnh chứng từ chuyển khoản để xác thực.'}
                            </span>
                            <button 
                              className="btn success" 
                              disabled={submittingRefund || !refundImgUrl}
                              onClick={async () => {
                                setSubmittingRefund(true);
                                try {
                                  await api.put(`/expenses/${viewItem.id}`, { 
                                    is_refunded: 1, 
                                    refund_image_url: refundImgUrl 
                                  });
                                  addToast('Đã xác nhận thanh toán', 'success');
                                  setViewItem(null);
                                  fetchExpenses();
                                } catch (e: any) {
                                  addToast('Lỗi khi cập nhật thanh toán: ' + (e.response?.data?.message || e.message), 'error');
                                } finally {
                                  setSubmittingRefund(false);
                                }
                              }}
                              style={{ 
                                background: refundImgUrl ? 'var(--color-success)' : 'var(--color-text-muted)', 
                                opacity: refundImgUrl ? 1 : 0.6, 
                                color: 'white', 
                                border: 'none', 
                                height: '36px', 
                                fontWeight: 700, 
                                padding: '0 16px', 
                                borderRadius: '8px', 
                                cursor: refundImgUrl ? 'pointer' : 'not-allowed',
                                width: 'fit-content',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                            >
                              {submittingRefund ? 'Đang cập nhật...' : 'Xác nhận đã thanh toán'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                    {/* Right Pane: Discussion & Activity (40%) */}
                    <div style={{
                      flex: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      overflow: 'hidden',
                      background: 'var(--color-surface)'
                    }}>
                      
                    {/* Tabs */}
                    <div style={{ display: 'flex', borderBottom: '1px solid var(--color-border)', background: 'var(--color-bg-light)', padding: '0 8px', flexShrink: 0 }}>
                      <button
                        onClick={() => setActiveTab('history')}
                        style={{
                          flex: 1,
                          padding: '14px 10px',
                          border: 'none',
                          background: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: activeTab === 'history' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          borderBottom: activeTab === 'history' ? '2px solid var(--color-primary)' : '2px solid transparent',
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
                        onClick={() => setActiveTab('comments')}
                        style={{
                          flex: 1,
                          padding: '14px 10px',
                          border: 'none',
                          background: 'none',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: activeTab === 'comments' ? 'var(--color-primary)' : 'var(--color-text-muted)',
                          borderBottom: activeTab === 'comments' ? '2px solid var(--color-primary)' : '2px solid transparent',
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

                    {/* Tab Content Body */}
                    <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 1.25rem 1.25rem 1.25rem', display: 'flex', flexDirection: 'column' }}>
                      {activeTab === 'comments' ? (
                        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between', gap: '1rem', overflow: 'hidden' }}>
                          {/* Comments List */}
                          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {loadingComments ? (
                              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                                <Loader2 size={20} className="spin text-primary" />
                              </div>
                            ) : (!Array.isArray(comments) || comments.length === 0) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', gap: '8px', textAlign: 'center' }}>
                                <Coffee size={24} style={{ opacity: 0.4 }} />
                                <span style={{ fontSize: '0.8rem' }}>Chưa có bình luận nào cho khoản chi này. Hãy bắt đầu thảo luận!</span>
                              </div>
                            ) : (
                              comments.map((c) => (
                                <div key={c.id} style={{ display: 'flex', gap: '10px', padding: '10px', borderRadius: '8px', background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-light)', position: 'relative' }}>
                                  <Avatar src={c.avatar_url} name={c.user_name} size={32} />
                                  <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>{c.user_name}</span>
                                      <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(c.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                      </span>
                                    </div>
                                    {c.body && /<[a-z][\s\S]*>/i.test(c.body) ? (
                                      <div 
                                        className="rich-comment-content text-left"
                                        dangerouslySetInnerHTML={{ __html: c.body }}
                                        style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: '2px 0 0', lineHeight: '1.4', textAlign: 'left' }}
                                      />
                                    ) : (
                                      <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: 0, lineHeight: 1.4, whiteSpace: 'pre-wrap', textAlign: 'left', wordBreak: 'break-word' }}>{c.body}</p>
                                    )}
                                  </div>
                                  {(['admin', 'superadmin', 'super_admin', 'director'].includes(user?.role as any) || user?.id === c.user_id) && (
                                    <button
                                      onClick={() => handleDeleteComment(c.id)}
                                      style={{ background: 'none', border: 'none', padding: '2px', cursor: 'pointer', color: 'var(--color-text-muted)', position: 'absolute', right: '4px', bottom: '4px' }}
                                      onMouseEnter={(e) => e.currentTarget.style.color = 'var(--color-danger)'}
                                      onMouseLeave={(e) => e.currentTarget.style.color = 'var(--color-text-muted)'}
                                      title="Xóa bình luận"
                                    >
                                      <Trash2 size={12} />
                                    </button>
                                  )}
                                </div>
                              ))
                            )}
                          </div>

                          {/* Comment Input */}
                          <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            gap: '8px', 
                            borderTop: '1px solid var(--color-border-light)', 
                            paddingTop: '12px', 
                            flexShrink: 0 
                          }}>
                            <MentionInput
                              value={commentText}
                              onChange={(e: any) => setCommentText(e.target.value)}
                              placeholder="Nhập nội dung trao đổi... (Gõ @ để nhắc tên đồng nghiệp)"
                              style={{ 
                                width: '100%', 
                                minHeight: '80px', 
                                border: '1px solid var(--color-border)', 
                                borderRadius: '10px', 
                                outline: 'none', 
                                background: 'var(--color-bg)', 
                                color: 'var(--color-text)', 
                                boxSizing: 'border-box'
                              }}
                              disabled={submittingComment}
                            />
                            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                              <button
                                disabled={submittingComment || !commentText || !commentText.replace(/<[^>]*>/g, '').trim()}
                                onClick={handleAddComment}
                                className="btn primary"
                                style={{ 
                                  height: '32px', 
                                  padding: '0 16px', 
                                  fontSize: '0.75rem', 
                                  fontWeight: 700, 
                                  borderRadius: '8px',
                                  cursor: 'pointer', 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  gap: '6px',
                                  background: 'var(--color-primary)',
                                  color: 'white',
                                  border: 'none',
                                  opacity: (commentText && commentText.replace(/<[^>]*>/g, '').trim()) ? 1 : 0.6
                                }}
                              >
                                {submittingComment ? (
                                  <>
                                    <Loader2 size={12} className="spin" /> Đang gửi...
                                  </>
                                ) : (
                                  <>
                                    <Send size={12} /> Gửi
                                  </>
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      ) : (
                          /* History Timeline */
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '16px' }}>
                            <div style={{ position: 'absolute', top: '8px', bottom: '8px', left: '4px', width: '2px', background: 'var(--color-border-light)' }} />
                            
                            {loadingHistory ? (
                              <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                                <Loader2 size={20} className="spin text-primary" />
                              </div>
                            ) : (!Array.isArray(historyLogs) || historyLogs.length === 0) ? (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', gap: '8px', textAlign: 'center' }}>
                                <Clock size={24} style={{ opacity: 0.4 }} />
                                <span style={{ fontSize: '0.8rem' }}>Chưa ghi nhận hoạt động lịch sử nào.</span>
                              </div>
                            ) : (
                              historyLogs.map((log) => {
                                let actionLabel = log.action;
                                let actionColor = 'var(--color-primary)';
                                if (log.action === 'CREATE') {
                                  actionLabel = 'Tạo phiếu chi đề xuất';
                                  actionColor = '#2563eb';
                                } else if (log.action === 'UPDATE') {
                                  actionLabel = 'Cập nhật nội dung chi';
                                  actionColor = '#f59e0b';
                                } else if (log.action === 'APPROVE') {
                                  let statusText = 'phê duyệt';
                                  try {
                                    const parsed = JSON.parse(log.new_data || '{}');
                                    if (parsed.status === 'rejected') {
                                      statusText = 'từ chối';
                                      actionColor = '#ef4444';
                                    } else {
                                      actionColor = '#10b981';
                                    }
                                  } catch (e) {}
                                  actionLabel = `Thay đổi trạng thái: ${statusText}`;
                                } else if (log.action === 'DELETE') {
                                  actionLabel = 'Xóa khoản chi';
                                  actionColor = '#ef4444';
                                } else if (log.action === 'ADD_COMMENT') {
                                  actionLabel = 'Thêm bình luận';
                                  actionColor = '#10b981';
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
                                      <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--color-text)' }}>
                                        {log.user_name || 'Hệ thống'}
                                      </span>
                                      <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                                        {new Date(log.created_at).toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' })}
                                      </span>
                                    </div>
                                    <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', fontWeight: 600 }}>
                                      Hành động: <strong style={{ color: actionColor }}>{actionLabel}</strong>
                                    </span>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      , document.body)}

      {rejectingItem && createPortal(
        <div style={{ position: 'fixed', inset: 0, zIndex: 30000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', padding: '1rem' }} onClick={() => setRejectingItem(null)}>
          <motion.div 
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            style={{ background: 'var(--color-surface)', borderRadius: '16px', padding: '1.5rem', maxWidth: '400px', width: '100%', boxShadow: 'var(--shadow-xl)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.75rem', color: 'var(--color-text)' }}>Từ chối yêu cầu chi phí</h3>
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', marginBottom: '0.75rem' }}>Vui lòng nhập lý do từ chối:</p>
            <textarea
              style={{ width: '100%', height: '80px', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: '8px', fontSize: '0.875rem', outline: 'none', background: 'var(--color-bg)', color: 'var(--color-text)', resize: 'none', marginBottom: '1rem' }}
              placeholder="Nhập lý do từ chối chi phí này..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button 
                className="btn outline sm" 
                onClick={() => {
                  setRejectingItem(null);
                  setRejectReason('');
                }}
                disabled={submittingReject}
              >
                Hủy
              </button>
              <button 
                className="btn danger sm" 
                style={{ background: 'var(--color-danger)', color: 'white', border: 'none', fontWeight: 600 }}
                onClick={async () => {
                  if (!rejectReason.trim()) {
                    addToast('Vui lòng nhập lý do từ chối', 'error');
                    return;
                  }
                  setSubmittingReject(true);
                  try {
                    await api.patch(`/expenses/${rejectingItem.id}`, { status: 'rejected', reject_reason: rejectReason });
                    addToast('Đã từ chối chi phí', 'success');
                    setRejectingItem(null);
                    setRejectReason('');
                    setViewItem(null);
                    fetchExpenses();
                    window.dispatchEvent(new Event('refresh-pending-counts'));
                  } catch (e: any) {
                    addToast('Lỗi khi từ chối chi phí', 'error');
                  } finally {
                    setSubmittingReject(false);
                  }
                }}
                disabled={submittingReject || !rejectReason.trim()}
              >
                {submittingReject ? 'Đang cập nhật...' : 'Từ chối'}
              </button>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </div>
  );
};
