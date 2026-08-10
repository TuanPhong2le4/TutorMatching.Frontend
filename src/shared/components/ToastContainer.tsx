import React, { useEffect } from 'react';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: string; // 'BookingCreated' | 'BookingCancelled' | 'ReviewReceived' | 'CreditChanged' | etc.
}

interface ToastContainerProps {
  toasts: ToastItem[];
  onRemove: (id: string) => void;
}

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onRemove }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        maxWidth: '380px',
        width: '100%',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => onRemove(toast.id)} />
      ))}
    </div>
  );
};

interface ToastCardProps {
  toast: ToastItem;
  onDismiss: () => void;
}

const ToastCard: React.FC<ToastCardProps> = ({ toast, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  // Determine styles and icon based on notification type
  let icon = '🔔';
  let accentColor = '#38bdf8'; // Default blue
  let glowColor = 'rgba(56, 189, 248, 0.2)';

  switch (toast.type) {
    case 'BookingCreated':
      icon = '📅';
      accentColor = '#38bdf8'; // Sky blue
      glowColor = 'rgba(56, 189, 248, 0.25)';
      break;
    case 'BookingConfirmed':
      icon = '✅';
      accentColor = '#10b981'; // Green
      glowColor = 'rgba(16, 185, 129, 0.25)';
      break;
    case 'BookingCancelled':
      icon = '❌';
      accentColor = '#f87171'; // Red
      glowColor = 'rgba(248, 113, 113, 0.25)';
      break;
    case 'ReviewReceived':
      icon = '⭐';
      accentColor = '#fbbf24'; // Gold
      glowColor = 'rgba(251, 191, 36, 0.25)';
      break;
    case 'CreditChanged':
      icon = '💰';
      accentColor = '#34d399'; // Emerald green
      glowColor = 'rgba(52, 211, 153, 0.25)';
      break;
  }

  return (
    <div
      style={{
        pointerEvents: 'auto',
        background: 'rgba(15, 23, 42, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderLeft: `4px solid ${accentColor}`,
        borderTop: '1px solid rgba(255, 255, 255, 0.08)',
        borderRight: '1px solid rgba(255, 255, 255, 0.08)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '12px',
        padding: '16px',
        boxShadow: `0 10px 25px -5px rgba(0, 0, 0, 0.5), 0 0 15px ${glowColor}`,
        display: 'flex',
        alignItems: 'flex-start',
        gap: '12px',
        animation: 'slideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Accent Glow Background */}
      <div
        style={{
          position: 'absolute',
          top: '-20px',
          left: '-20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: accentColor,
          filter: 'blur(30px)',
          opacity: 0.15,
          pointerEvents: 'none',
        }}
      />

      {/* Icon Wrapper */}
      <div
        style={{
          fontSize: '20px',
          backgroundColor: `${accentColor}15`,
          color: accentColor,
          padding: '8px',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div style={{ flex: 1, paddingRight: '16px' }}>
        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#fff', marginBottom: '4px', margin: 0 }}>
          {toast.title}
        </h4>
        <p style={{ fontSize: '13px', color: '#cbd5e1', lineHeight: '1.4', margin: 0, marginTop: '2px' }}>
          {toast.message}
        </p>
      </div>

      {/* Close Button */}
      <button
        onClick={onDismiss}
        style={{
          background: 'none',
          border: 'none',
          color: '#94a3b8',
          cursor: 'pointer',
          fontSize: '16px',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '6px',
          transition: 'color 0.2s, background-color 0.2s',
          alignSelf: 'flex-start',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#fff';
          e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#94a3b8';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        ✕
      </button>

      {/* CSS Animation injection */}
      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%) scale(0.9);
            opacity: 0;
          }
          to {
            transform: translateX(0) scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};
