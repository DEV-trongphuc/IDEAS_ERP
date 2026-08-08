import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Flame, Play, Pause, RotateCcw, Coffee, Eye, EyeOff, ClipboardList, CheckCircle, Clock } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';

export const WorkspaceStickyPomodoro: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  
  // Timer States
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Tasks List States
  const [myTasks, setMyTasks] = useState<any[]>([]);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [loadingTasks, setLoadingTasks] = useState(false);

  // Stats state
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);

  const timerRef = useRef<any>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Load danh sách tasks được giao cho user hiện tại để gán khi tập trung
  const loadMyTasksAndStats = async () => {
    if (!user?.id) return;
    setLoadingTasks(true);
    try {
      const res = await api.get(`/activities?type=task&status=planned&user_id=${user.id}`);
      const list = Array.isArray(res.data) ? res.data : (res.data?.items || []);
      setMyTasks(list);
      if (list.length > 0 && !selectedTaskId) {
        setSelectedTaskId(list[0].id);
      }

      // Load luôn stats tích lũy
      if (selectedTaskId) {
        const statsRes = await api.get(`/activities/${selectedTaskId}/focus-summary`);
        if (statsRes.data) {
          setTotalSessions(statsRes.data.total_sessions || 0);
          setTotalMinutes(statsRes.data.total_minutes || 0);
        }
      }
    } catch (e) {}
    finally {
      setLoadingTasks(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadMyTasksAndStats();
    }
  }, [isOpen, user?.id, selectedTaskId]);

  // Bộ đếm thời gian
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            handleTimerComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning, mode]);

  // Click outside to close popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (widgetRef.current && !widgetRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Audio API Beep alert
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);

      oscillator.start();
      setTimeout(() => {
        oscillator.stop();
        audioCtx.close();
      }, 800);
    } catch (e) {}
  };

  // Hoàn thành đếm ngược Pomodoro
  const handleTimerComplete = async () => {
    setIsRunning(false);
    playAlertSound();

    if (mode === 'work') {
      if (selectedTaskId) {
        try {
          await api.post(`/activities/${selectedTaskId}/focus-log`, { duration_minutes: 25 });
          const taskName = myTasks.find(t => t.id === selectedTaskId)?.subject || '';
          alert(`${t('🎉 Tuyệt vời! Bạn đã hoàn thành 25 phút tập trung cho công việc')}: "${taskName}". ${t('Hãy nghỉ ngơi 5 phút nhé!')}`);
          loadMyTasksAndStats();
        } catch (e) {}
      } else {
        alert(t('🎉 Tuyệt vời! Bạn đã hoàn thành 25 phút tập trung tự do. Hãy nghỉ ngơi 5 phút nhé!'));
      }
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      alert(t('☕ Thời gian giải lao đã hết. Bắt đầu phiên làm việc mới nào!'));
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = mode === 'work' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div ref={widgetRef} style={{ position: 'fixed', bottom: '80px', right: '24px', zIndex: 9999 }}>
      {/* Popover Control Menu (Mở lên phía trên nút tròn) */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: '72px',
          right: 0,
          width: '280px',
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border-light)',
          borderRadius: '16px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          animation: 'slideUpFade 0.2s ease-out'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={12} />
              {mode === 'work' ? t('Phiên tập trung') : t('Thời gian giải lao')}
            </span>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsFocusMode(true);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: 'var(--color-primary)',
                cursor: 'pointer',
                fontSize: '0.7rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '3px'
              }}
            >
              <Eye size={12} />
              {t('Toàn màn hình')}
            </button>
          </div>

          {/* Mode Switcher */}
          <div style={{ display: 'flex', gap: '4px', background: 'var(--color-background-base)', padding: '2px', borderRadius: '8px' }}>
            <button
              onClick={() => switchMode('work')}
              style={{
                flex: 1,
                padding: '5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'work' ? 'var(--color-surface)' : 'transparent',
                color: mode === 'work' ? '#f97316' : 'var(--color-text-muted)',
                boxShadow: mode === 'work' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {t('Làm việc')}
            </button>
            <button
              onClick={() => switchMode('break')}
              style={{
                flex: 1,
                padding: '5px',
                fontSize: '0.68rem',
                fontWeight: 700,
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: mode === 'break' ? 'var(--color-surface)' : 'transparent',
                color: mode === 'break' ? '#10b981' : 'var(--color-text-muted)',
                boxShadow: mode === 'break' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none'
              }}
            >
              {t('Giải lao')}
            </button>
          </div>

          {/* Task Picker */}
          {mode === 'work' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--color-text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <ClipboardList size={11} />
                {t('Tập trung cho công việc:')}
              </label>
              <select
                value={selectedTaskId || ''}
                onChange={(e) => setSelectedTaskId(e.target.value ? Number(e.target.value) : null)}
                style={{
                  padding: '8px',
                  fontSize: '0.72rem',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-surface)',
                  color: 'var(--color-text)',
                  maxWidth: '100%',
                  outline: 'none'
                }}
                disabled={loadingTasks}
              >
                <option value="">{t('-- Tập trung tự do --')}</option>
                {myTasks.map(task => (
                  <option key={task.id} value={task.id}>
                    {task.subject.length > 30 ? task.subject.substring(0, 30) + '...' : task.subject}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controls */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center', margin: '4px 0' }}>
            <button
              onClick={resetTimer}
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                border: '1px solid var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.2s'
              }}
              title={t('Đặt lại')}
            >
              <RotateCcw size={14} />
            </button>

            <button
              onClick={toggleTimer}
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                border: 'none',
                background: mode === 'work' ? 'linear-gradient(135deg, #f97316, #ea580c)' : 'linear-gradient(135deg, #10b981, #059669)',
                color: 'white',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
              }}
            >
              {isRunning ? <Pause size={16} fill="white" /> : <Play size={16} fill="white" style={{ marginLeft: '2px' }} />}
            </button>
          </div>

          {/* Stats Summary */}
          {selectedTaskId && (
            <div style={{
              borderTop: '1px solid var(--color-border-light)',
              paddingTop: '8px',
              display: 'flex',
              justifyContent: 'space-around',
              fontSize: '0.65rem',
              color: 'var(--color-text-muted)'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 850, color: 'var(--color-text)', fontSize: '0.75rem' }}>{totalSessions}</span>
                <span>{t('Phiên')}</span>
              </div>
              <div style={{ borderLeft: '1px solid var(--color-border-light)' }} />
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontWeight: 850, color: 'var(--color-text)', fontSize: '0.75rem' }}>{totalMinutes}m</span>
                <span>{t('Tập trung')}</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating Sticky Circular Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: 'var(--color-surface)',
          border: 'none',
          boxShadow: '0 8px 30px rgba(0,0,0,0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
          backdropFilter: 'blur(8px)',
          borderWidth: '1px',
          borderStyle: 'solid',
          borderColor: isRunning ? (mode === 'work' ? '#f97316' : '#10b981') : 'var(--color-border-light)'
        }}
        className="hover-lift"
        title={t('Pomodoro Focus')}
      >
        {/* SVG Progress Ring */}
        <svg width="64" height="64" viewBox="0 0 64 64" style={{ position: 'absolute', transform: 'rotate(-90deg)', top: 0, left: 0 }}>
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke="transparent"
            strokeWidth="3.5"
            fill="transparent"
          />
          <circle
            cx="32"
            cy="32"
            r="28"
            stroke={mode === 'work' ? '#f97316' : '#10b981'}
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 28}
            strokeDashoffset={2 * Math.PI * 28 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Center Display */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 10 }}>
          <Flame
            size={18}
            style={{
              color: mode === 'work' ? '#f97316' : '#10b981',
              animation: isRunning ? 'pulse 1.5s infinite' : 'none',
              marginBottom: '2px'
            }}
          />
          <span style={{ fontSize: '0.72rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-text)' }}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </button>

      {/* FULL SCREEN FOCUS MODE OVERLAY */}
      {isFocusMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(20px)',
          zIndex: 99999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Header */}
          <div style={{ position: 'absolute', top: '2rem', display: 'flex', justifyContent: 'space-between', width: '80%', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={20} style={{ color: '#f97316' }} />
              <span style={{ fontSize: '0.9rem', fontWeight: 800, letterSpacing: '0.1em' }}>IDEAS FOCUS ENGINE</span>
            </div>
            <button
              onClick={() => setIsFocusMode(false)}
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.15)',
                color: 'white',
                padding: '6px 16px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '0.8rem',
                fontWeight: 700
              }}
            >
              {t('Thoát Focus Mode')}
            </button>
          </div>

          {/* Center Timer */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', maxWidth: '500px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {mode === 'work' ? t('ĐANG TẬP TRUNG LÀM VIỆC') : t('ĐANG GIẢI LAO')}
            </span>

            {selectedTaskId && mode === 'work' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '20px', fontSize: '0.85rem', color: '#f97316', fontWeight: 700 }}>
                <CheckCircle size={14} />
                {myTasks.find(t => t.id === selectedTaskId)?.subject}
              </div>
            )}

            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="240" height="240" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={mode === 'work' ? '#f97316' : '#10b981'}
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '3.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'white', letterSpacing: '-1px' }}>
                  {formatTime(timeLeft)}
                </span>
              </div>
            </div>

            {/* Fullscreen Controls */}
            <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
              <button
                onClick={resetTimer}
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <RotateCcw size={16} />
              </button>

              <button
                onClick={toggleTimer}
                style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  border: 'none',
                  background: mode === 'work' ? '#f97316' : '#10b981',
                  color: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: mode === 'work' ? '0 8px 24px rgba(249, 115, 22, 0.3)' : '0 8px 24px rgba(16, 185, 129, 0.3)'
                }}
              >
                {isRunning ? <Pause size={24} fill="white" /> : <Play size={24} fill="white" style={{ marginLeft: '3px' }} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
