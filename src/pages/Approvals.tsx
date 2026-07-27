import React, { useState, useEffect } from 'react';
import { fetchAPI } from '../utils/api';
import api from '../api/axios';
import { 
  FileText, Calendar, CheckCircle2, XCircle, Clock,
  ArrowRight, ShieldCheck, User, Clipboard, DollarSign, Activity, FileSpreadsheet
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { EmptyCard } from '../components/ui/EmptyCard';
import { Avatar } from '../components/ui/Avatar';

interface ApprovalItem {
  id: number;
  type: 'leave' | 'advance' | 'expense' | 'checkin';
  employee_name?: string;
  title: string;
  description: string;
  status?: string;
  created_at: string;
}

export default function Approvals() {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const isAdmin = ['admin', 'superadmin', 'super_admin', 'director', 'assistant', 'manager'].includes(String(user?.role).toLowerCase());
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
      if (activeTab === 'pending' && isAdmin) {
        const res = await fetchAPI('hrm/approvals/pending');
        setPendingList(res?.data || []);
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
      <span style={{ fontSize: '0.725rem', fontWeight: 700, padding: '3px 8px', borderRadius: 10, background: 'rgba(107, 114, 128, 0.1)', color: '#6b7280', textTransform: 'uppercase' }}>
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

  return (
    <div>
      
      {/* Header */}
      <div className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div>
          <h1 className="page-title">{t('Trung tâm Phê duyệt Quy trình (Workflow Hub)')}</h1>
          <p className="page-subtitle">{t('Quản lý tập trung các quy trình đề xuất nghỉ phép, tạm ứng lương, chi phí hành chính và giải trình đi trễ.')}</p>
        </div>
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

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-muted)' }}>
          {t('Đang tải dữ liệu quy trình...')}
        </div>
      ) : activeTab === 'pending' && isAdmin ? (
        /* ADMIN PENDING LIST */
        pendingList.length === 0 ? (
          <EmptyCard
            icon={<ShieldCheck />}
            title={t('Không có yêu cầu phê duyệt')}
            description={t('Không có yêu cầu phê duyệt nào đang chờ xử lý.')}
          />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {pendingList.map(item => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="card hover-lift" 
                onClick={() => setSelectedTimelineItem(item)}
                style={{
                  padding: '1.5rem',
                  borderRadius: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-text-muted)' }}>
                        {item.type === 'leave' ? t('Nghỉ phép') : item.type === 'advance' ? t('Tạm ứng') : item.type === 'expense' ? t('Chi phí') : t('Chấm công')}
                      </span>
                      <ArrowRight size={10} style={{ color: 'var(--color-text-muted)' }} />
                      <strong style={{ fontSize: '0.875rem' }}>{item.employee_name}</strong>
                    </div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 700, margin: '4px 0 2px' }}>{item.title}</h4>
                    <p style={{ fontSize: '0.85rem', color: 'var(--color-text-muted)', margin: 0 }}>{item.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: 8 }}>
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-text-muted)' }}>
                        {t('Yêu cầu gửi ngày')}: {new Date(item.created_at).toLocaleString('vi-VN')}
                      </span>
                      <span style={{ fontSize: '0.725rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}>
                        {t('Xem tiến trình')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }} onClick={e => e.stopPropagation()}>
                  <button onClick={() => openRejectModal(item)} className="btn secondary" style={{ color: '#ef4444', borderColor: '#ef4444', padding: '6px 14px', fontSize: '0.8rem', height: '32px' }}>
                    <XCircle size={14} style={{ marginRight: 4 }} />
                    {t('Từ chối')}
                  </button>
                  <button onClick={() => handleApprove(item)} className="btn primary" style={{ padding: '6px 16px', fontSize: '0.8rem', height: '32px' }}>
                    <CheckCircle2 size={14} style={{ marginRight: 4 }} />
                    {t('Phê duyệt')}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        /* MY REQUESTS LIST */
        myRequestsList.length === 0 ? (
          <EmptyCard
            icon={<Clipboard />}
            title={t('Không tìm thấy yêu cầu')}
            description={t('Bạn chưa gửi yêu cầu quy trình nào.')}
          />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {myRequestsList.map(item => (
              <div 
                key={`${item.type}-${item.id}`} 
                className="card hover-lift" 
                onClick={() => setSelectedTimelineItem(item)}
                style={{
                  padding: '1.25rem',
                  borderRadius: '12px',
                  background: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: 'var(--color-bg-secondary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getTypeIcon(item.type)}
                  </div>
                  <div>
                    <h4 style={{ fontSize: '0.9375rem', fontWeight: 700, margin: 0 }}>{item.title}</h4>
                    <p style={{ fontSize: '0.825rem', color: 'var(--color-text-muted)', margin: '2px 0 0' }}>{item.description}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)' }}>
                        {t('Gửi ngày')}: {new Date(item.created_at).toLocaleDateString('vi-VN')}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--color-primary)', fontWeight: 700, textDecoration: 'underline' }}>
                        {t('Xem tiến trình')}
                      </span>
                    </div>
                  </div>
                </div>
                <div>
                  {formatBadge(item.status || 'pending')}
                </div>
              </div>
            ))}
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
        />
      )}
    </div>
  );
}

// Side-Drawer Component detailing step-by-step progress
function ApprovalDetailDrawer({ item, onClose, users, t, onApprove, onReject, isAdmin }: {
  item: ApprovalItem;
  onClose: () => void;
  users: any[];
  t: any;
  onApprove: (item: ApprovalItem) => Promise<void>;
  onReject: (item: ApprovalItem) => void;
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
