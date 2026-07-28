import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, XCircle, CheckCircle2, Pencil, Wallet, Clock, MessageSquare, Loader2, Coffee, Trash2, Upload } from 'lucide-react';
import api from '../api/axios';
import { Avatar } from './ui/Avatar';
import { useUIStore } from '../store/uiStore';
import { MentionInput } from './ui/MentionInput';
import { compressToWebP } from '../utils/imageCompress';
import { numberToVietnameseText } from '../utils/numberToText';

const FMT = (n: number, currency: string = 'VND') => {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(n);
};

interface ExpenseQuickViewDrawerProps {
  expenseId: number | null;
  onClose: () => void;
  user: any;
  onStatusChange?: () => void;
  onEditClick?: (item: any) => void;
}

export const ExpenseQuickViewDrawer: React.FC<ExpenseQuickViewDrawerProps> = ({
  expenseId,
  onClose,
  user,
  onStatusChange,
  onEditClick
}) => {
  const { addToast } = useUIStore();
  const [viewItem, setViewItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'comments' | 'history'>('comments');
  const [comments, setComments] = useState<any[]>([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [historyLogs, setHistoryLogs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  // Refund states
  const [refundImgUrl, setRefundImgUrl] = useState('');
  const [uploadingRefund, setUploadingRefund] = useState(false);
  const [submittingRefund, setSubmittingRefund] = useState(false);

  const isMobile = window.innerWidth <= 768;

  const fetchExpenseDetails = useCallback(async (id: number) => {
    setLoading(true);
    try {
      const r = await api.get(`/expenses/${id}`);
      if (r.data?.success) {
        setViewItem(r.data.data);
      }
    } catch (e: any) {
      addToast('Không thể tải chi tiết chi phí: ' + e.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [addToast]);

  const fetchComments = useCallback(async (id: number) => {
    setLoadingComments(true);
    try {
      const res = await api.get(`/expenses/${id}/comments`);
      setComments(res.data.data || []);
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoadingComments(false);
    }
  }, []);

  const fetchHistory = useCallback(async (id: number) => {
    setLoadingHistory(true);
    try {
      const res = await api.get(`/expenses/${id}/history`);
      setHistoryLogs(res.data.data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => {
    setRefundImgUrl('');
    setUploadingRefund(false);
    setSubmittingRefund(false);
    if (expenseId) {
      fetchExpenseDetails(expenseId);
      setActiveTab('comments');
      fetchComments(expenseId);
      fetchHistory(expenseId);
    } else {
      setViewItem(null);
    }
  }, [expenseId, fetchExpenseDetails, fetchComments, fetchHistory]);

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

  const handleApprove = async () => {
    if (!viewItem) return;
    try {
      await api.patch(`/expenses/${viewItem.id}`, { status: 'approved' });
      addToast('Đã phê duyệt chi phí', 'success');
      fetchExpenseDetails(viewItem.id);
      if (onStatusChange) onStatusChange();
      window.dispatchEvent(new Event('refresh-pending-counts'));
    } catch (e: any) {
      addToast('Lỗi khi phê duyệt chi phí', 'error');
    }
  };

  const handleReject = async () => {
    if (!viewItem) return;
    try {
      await api.patch(`/expenses/${viewItem.id}`, { status: 'rejected' });
      addToast('Đã từ chối chi phí', 'success');
      fetchExpenseDetails(viewItem.id);
      if (onStatusChange) onStatusChange();
      window.dispatchEvent(new Event('refresh-pending-counts'));
    } catch (e: any) {
      addToast('Lỗi khi từ chối chi phí', 'error');
    }
  };

  if (!expenseId || !viewItem) return null;

  return createPortal(
    <AnimatePresence>
      <div style={{ position: 'fixed', inset: 0, zIndex: 1000000, display: 'flex', justifyContent: 'flex-end' }}>
        {/* Backdrop Overlay */}
        <motion.div
          className="drawer-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 1000005,
            background: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)'
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
                onClick={onClose}
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
              >
                <X size={20} />
              </button>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--color-text)' }}>
                Chi tiết phiếu chi #EXP-{viewItem.id}
              </h2>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              {viewItem.status === 'pending' && (
                ['admin', 'superadmin', 'super_admin', 'director', 'hr', 'accountant'].includes(String(user?.role).toLowerCase()) || 
                (viewItem.approver_id && Number(viewItem.approver_id) === Number(user?.id))
              ) && (
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button 
                    className="btn danger sm" 
                    style={{ background: 'var(--color-danger)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, height: '32px', fontSize: '0.8rem', padding: '0 12px', borderRadius: '6px', cursor: 'pointer' }} 
                    onClick={handleReject}
                  >
                    <XCircle size={14} /> Từ chối
                  </button>
                  <button 
                    className="btn success sm" 
                    style={{ background: 'var(--color-success)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 700, height: '32px', fontSize: '0.8rem', padding: '0 12px', borderRadius: '6px', cursor: 'pointer' }} 
                    onClick={handleApprove}
                  >
                    <CheckCircle2 size={14} /> Phê duyệt
                  </button>
                </div>
              )}
              {viewItem.status !== 'approved' && onEditClick && (
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
                  onClick={() => onEditClick(viewItem)}
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
          <div style={{ display: 'flex', flex: 1, overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
            
            {/* Left Pane: Info & Action panel */}
            <div style={{
              flex: 3,
              overflowY: 'auto',
              padding: '1.5rem 2rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.5rem',
              borderRight: isMobile ? 'none' : '1px solid var(--color-border)',
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

              {/* Notes / Ghi chú */}
              {(() => {
                let cleanNotes = viewItem.notes || '';
                const bankRegex = /\[Thông tin chuyển khoản\]:[^\n]*/;
                const installmentRegex = /\[Thanh toán theo đợt\]:[^\n]*/;
                const recurringRegex = /\[Lặp lại định kỳ\]:[^\n]*/;
                cleanNotes = cleanNotes.replace(bankRegex, '').replace(installmentRegex, '').replace(recurringRegex, '').trim();
                if (cleanNotes) {
                  return (
                    <div style={{ 
                      padding: '1.25rem', 
                      background: 'rgba(245, 158, 11, 0.05)', 
                      border: '1px solid rgba(245, 158, 11, 0.15)',
                      borderLeft: '4px solid #f59e0b', 
                      borderRadius: '0px', 
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

              {/* Advanced Configuration (Installments & Recurring) */}
              {(() => {
                const rawNotes = viewItem.notes || '';
                const hasInstallments = rawNotes.includes('[Thanh toán theo đợt]');
                const hasRecurring = rawNotes.includes('[Lặp lại định kỳ]');
                
                let installmentText = '';
                if (hasInstallments) {
                  const match = rawNotes.match(/\[Thanh toán theo đợt\]:\s*(.*)/);
                  if (match) installmentText = match[1];
                }

                let recurringText = '';
                if (hasRecurring) {
                  const match = rawNotes.match(/\[Lặp lại định kỳ\]:\s*(.*)/);
                  if (match) recurringText = match[1];
                }

                if (!hasInstallments && !hasRecurring) return null;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', background: 'var(--color-surface)', border: '1px solid var(--color-border-light)', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)' }}>
                    <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cấu hình nâng cao
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {hasInstallments && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>Thanh toán chia nhiều đợt (Installment/Phased Payment)</span>
                          </div>
                          {installmentText && (
                            <div style={{ marginTop: '4px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-bg-secondary)', fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                              {installmentText}
                            </div>
                          )}
                        </div>
                      )}

                      {hasRecurring && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }}></div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text)' }}>Thiết lập lặp lại tự động (Recurring Proposal)</span>
                          </div>
                          {recurringText && (
                            <div style={{ marginTop: '4px', padding: '1rem', border: '1px solid var(--color-border-light)', borderRadius: '12px', background: 'var(--color-bg-secondary)', fontSize: '0.8rem', color: 'var(--color-text-light)', lineHeight: 1.4 }}>
                              {recurringText}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
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
                    <Wallet size={16} style={{ color: 'var(--color-warning)' }} /> Hạch toán thanh toán khoản chi
                  </h4>
                  <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', margin: 0 }}>Khoản chi đã được duyệt. Tải lên ảnh UNC hoặc Biên lai thanh toán để hoàn tất hạch toán thực chi.</p>
                  
                  <div style={{ display: 'flex', gap: '16px', alignItems: 'center', background: 'var(--color-bg-secondary)', padding: '12px', borderRadius: '10px', border: '1px solid var(--color-border-light)' }}>
                    <div 
                      onClick={() => document.getElementById('refund-image-upload-drawer')?.click()}
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
                          <Upload size={22} style={{ color: 'var(--color-text-muted)', marginBottom: '4px' }} />
                          <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)', fontWeight: 700 }}>Tải ảnh UNC</span>
                        </div>
                      )}
                      <input 
                        type="file" 
                        id="refund-image-upload-drawer" 
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
                            fetchExpenseDetails(viewItem.id);
                            if (onStatusChange) onStatusChange();
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

            {/* Right Pane: Discussion & Activity */}
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
                            background: 'var(--color-primary)',
                            color: 'white',
                            border: 'none',
                            borderRadius: '8px',
                            padding: '6px 16px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: 700
                          }}
                        >
                          Gửi
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* History logs */
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    {loadingHistory ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem 0' }}>
                        <Loader2 size={20} className="spin text-primary" />
                      </div>
                    ) : historyLogs.length === 0 ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem', color: 'var(--color-text-muted)', gap: '8px', textAlign: 'center' }}>
                        <Clock size={24} style={{ opacity: 0.4 }} />
                        <span style={{ fontSize: '0.8rem' }}>Chưa có hoạt động nào được ghi nhận cho khoản chi này.</span>
                      </div>
                    ) : (
                      historyLogs.map((log) => (
                        <div key={log.id} style={{ display: 'flex', gap: '10px', padding: '8px 10px', borderLeft: '2px solid var(--color-primary-light)', background: 'var(--color-bg-secondary)', borderRadius: '0 8px 8px 0' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', flex: 1 }}>
                            <p style={{ fontSize: '0.8rem', color: 'var(--color-text)', margin: 0, textAlign: 'left' }}>
                              <strong style={{ color: 'var(--color-text-light)' }}>{log.operator_name}</strong> {log.action_text}
                            </p>
                            <span style={{ fontSize: '0.675rem', color: 'var(--color-text-muted)' }}>
                              {new Date(log.created_at).toLocaleString('vi-VN')}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
