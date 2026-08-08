import React, { useState, useEffect, useRef } from 'react';
import api from '../api/axios';
import { Play, Pause, RotateCcw, Flame, Coffee, Award, Shield, Eye, EyeOff } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

interface PomodoroTrackerProps {
  taskId: number;
}

export const PomodoroTracker: React.FC<PomodoroTrackerProps> = ({ taskId }) => {
  const { t } = useLanguage();
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocusMode, setIsFocusMode] = useState(false);
  
  // Stats state
  const [totalSessions, setTotalSessions] = useState(0);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [loadingStats, setLoadingStats] = useState(false);

  const timerRef = useRef<any>(null);

  // Load thống kê tập trung từ API
  const loadFocusStats = async () => {
    if (!taskId) return;
    setLoadingStats(true);
    try {
      const res = await api.get(`/activities/${taskId}/focus-summary`);
      if (res.data) {
        setTotalSessions(res.data.total_sessions || 0);
        setTotalMinutes(res.data.total_minutes || 0);
        setRecentLogs(res.data.recent_logs || []);
      }
    } catch (e) {}
    finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadFocusStats();
    // Reset timer when taskId changes
    setIsRunning(false);
    setMode('work');
    setTimeLeft(25 * 60);
    if (timerRef.current) clearInterval(timerRef.current);
  }, [taskId]);

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
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRunning, mode]);

  // Web Audio API Beep Sound Generator
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

  // Hoàn thành phiên Pomodoro
  const handleTimerComplete = async () => {
    setIsRunning(false);
    playAlertSound();

    if (mode === 'work') {
      try {
        await api.post(`/activities/${taskId}/focus-log`, { duration_minutes: 25 });
        await loadFocusStats();
        alert(t('🎉 Tuyệt vời! Bạn đã hoàn thành 25 phút tập trung cao độ. Hãy nghỉ ngơi 5 phút nhé!'));
        setMode('break');
        setTimeLeft(5 * 60);
      } catch (e) {}
    } else {
      alert(t('☕ Thời gian giải lao đã hết. Bắt đầu phiên làm việc mới nào!'));
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => setIsRunning(!isRunning);

  const resetTimer = () => {
    setIsRunning(false);
    if (mode === 'work') {
      setTimeLeft(25 * 60);
    } else {
      setTimeLeft(5 * 60);
    }
  };

  const switchMode = (newMode: 'work' | 'break') => {
    setIsRunning(false);
    setMode(newMode);
    setTimeLeft(newMode === 'work' ? 25 * 60 : 5 * 60);
  };

  // Format mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalDuration = mode === 'work' ? 25 * 60 : 5 * 60;
  const progressPercent = ((totalDuration - timeLeft) / totalDuration) * 100;

  return (
    <div style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border-light)',
      borderRadius: '12px',
      padding: '1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      boxShadow: 'var(--shadow-sm)',
      position: 'relative'
    }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Flame size={15} style={{ color: mode === 'work' ? '#f97316' : '#10b981' }} />
          <span style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--color-text)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {t('Pomodoro Focus')}
          </span>
        </div>

        {/* Nút bật tắt chế độ tập trung cao độ */}
        <button
          onClick={() => setIsFocusMode(!isFocusMode)}
          style={{
            border: 'none',
            background: 'transparent',
            color: isFocusMode ? 'var(--color-primary)' : 'var(--color-text-muted)',
            cursor: 'pointer',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '0.7rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontWeight: 700
          }}
          title={t('Bật chế độ tập trung cao độ toàn màn hình')}
        >
          {isFocusMode ? <EyeOff size={13} /> : <Eye size={13} />}
          {isFocusMode ? t('Thoát') : t('Tập trung')}
        </button>
      </div>

      {/* Mode Selector */}
      <div style={{ display: 'flex', gap: '4px', background: 'var(--color-background-base)', padding: '2px', borderRadius: '8px' }}>
        <button
          onClick={() => switchMode('work')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'work' ? 'var(--color-surface)' : 'transparent',
            color: mode === 'work' ? '#f97316' : 'var(--color-text-muted)',
            boxShadow: mode === 'work' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {t('Tập trung (25m)')}
        </button>
        <button
          onClick={() => switchMode('break')}
          style={{
            flex: 1,
            padding: '4px',
            fontSize: '0.7rem',
            fontWeight: 700,
            borderRadius: '6px',
            border: 'none',
            cursor: 'pointer',
            background: mode === 'break' ? 'var(--color-surface)' : 'transparent',
            color: mode === 'break' ? '#10b981' : 'var(--color-text-muted)',
            boxShadow: mode === 'break' ? '0 1px 3px rgba(0,0,0,0.05)' : 'none',
            transition: 'all 0.2s ease'
          }}
        >
          {t('Nghỉ ngơi (5m)')}
        </button>
      </div>

      {/* Timer Display */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0.5rem 0', position: 'relative' }}>
        {/* SVG Progress Circle */}
        <svg width="120" height="120" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke="var(--color-border-light)"
            strokeWidth="6"
            fill="transparent"
          />
          <circle
            cx="60"
            cy="60"
            r="50"
            stroke={mode === 'work' ? '#f97316' : '#10b981'}
            strokeWidth="6"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 50}
            strokeDashoffset={2 * Math.PI * 50 * (1 - progressPercent / 100)}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>

        {/* Text inside circle */}
        <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: '1.5rem', fontWeight: 800, fontFamily: 'monospace', color: 'var(--color-text)', letterSpacing: '-0.5px' }}>
            {formatTime(timeLeft)}
          </span>
          <span style={{ fontSize: '0.6rem', fontWeight: 700, color: 'var(--color-text-muted)', textTransform: 'uppercase', marginTop: '2px' }}>
            {mode === 'work' ? t('TẬP TRUNG') : t('GIẢI LAO')}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', alignItems: 'center' }}>
        <button
          onClick={resetTimer}
          style={{
            padding: '6px 12px',
            borderRadius: '8px',
            border: '1px solid var(--color-border-light)',
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
            boxShadow: '0 4px 10px rgba(0,0,0,0.15)',
            transition: 'transform 0.2s',
            transform: isRunning ? 'scale(0.95)' : 'scale(1)'
          }}
        >
          {isRunning ? <Pause size={18} fill="white" /> : <Play size={18} fill="white" style={{ marginLeft: '2px' }} />}
        </button>
      </div>

      {/* Stats Summary */}
      <div style={{ 
        borderTop: '1px solid var(--color-border-light)', 
        paddingTop: '0.5rem', 
        display: 'flex', 
        justifyContent: 'space-around', 
        fontSize: '0.68rem',
        color: 'var(--color-text-muted)'
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '0.78rem' }}>{totalSessions}</span>
          <span>{t('Phiên đã làm')}</span>
        </div>
        <div style={{ borderLeft: '1px solid var(--color-border-light)' }} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontWeight: 800, color: 'var(--color-text)', fontSize: '0.78rem' }}>{totalMinutes}m</span>
          <span>{t('Tổng số phút')}</span>
        </div>
      </div>

      {/* FULL SCREEN FOCUS MODE OVERLAY */}
      {isFocusMode && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(20px)',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          animation: 'fadeIn 0.3s ease'
        }}>
          {/* Header of Focus Mode */}
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

          {/* Center focus area */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem', maxWidth: '500px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.15em' }}>
              {t('ĐANG TẬP TRUNG LÀM VIỆC')}
            </span>

            {/* Circular Timer in Fullscreen */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="240" height="240" viewBox="0 0 120 120" style={{ transform: 'rotate(-90deg)' }}>
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="4"
                  fill="transparent"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="50"
                  stroke={mode === 'work' ? '#f97316' : '#10b981'}
                  strokeWidth="4"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 50}
                  strokeDashoffset={2 * Math.PI * 50 * (1 - progressPercent / 100)}
                  strokeLinecap="round"
                  style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                />
              </svg>

              <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: '3rem', fontWeight: 800, fontFamily: 'monospace', color: 'white', letterSpacing: '-1px' }}>
                  {formatTime(timeLeft)}
                </span>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', marginTop: '6px' }}>
                  {mode === 'work' ? t('PHIÊN LÀM VIỆC') : t('GIẢI LAO')}
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
                  boxShadow: '0 8px 24px rgba(249, 115, 22, 0.3)'
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
