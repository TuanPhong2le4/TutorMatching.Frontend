import React, { useState, useEffect, useRef } from 'react';
import { NotificationDto } from '../types/notification';
import { notificationService } from '../services/notificationService';

interface NotificationDropdownProps {
  notifications: NotificationDto[];
  unreadCount: number;
  onRefresh: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate?: (tab: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  notifications,
  unreadCount,
  onRefresh,
  onMarkRead,
  onMarkAllRead,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Toggle dropdown visibility
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      onRefresh(); // Refresh list when opening
    }
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format date to elapsed time in Vietnamese
  const getElapsedTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Vừa xong';
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    return `${diffDays} ngày trước`;
  };

  // Get icons and colors based on notification type
  const getTypeDetails = (type: string, title?: string, relatedEntityType?: string | null) => {
    switch (type) {
      case 'BookingCreated':
        return { icon: '📅', color: '#38bdf8', tab: 'bookings' };
      case 'BookingConfirmed':
        return { icon: '✅', color: '#10b981', tab: 'bookings' };
      case 'BookingCancelled':
        return { icon: '❌', color: '#f87171', tab: 'bookings' };
      case 'ReviewReceived':
        return { icon: '⭐', color: '#fbbf24', tab: 'bookings' };
      case 'CreditChanged':
        return { icon: '💰', color: '#34d399', tab: 'wallet' };
      case 'System':
        // Deposit request notifications for admin
        if (relatedEntityType === 'DepositRequest' || (title && title.includes('nạp tiền'))) {
          return { icon: '💳', color: '#fbbf24', tab: 'wallet' };
        }
        if (title && (title.includes('WARNING') || title.includes('Cảnh cáo'))) {
          return { icon: '⚠️', color: '#ef4444', tab: 'center-notifications' };
        }
        return { icon: '🔔', color: '#a78bfa', tab: 'center-notifications' };
      default:
        return { icon: '🔔', color: '#a78bfa', tab: null as string | null };
    }
  };

  // Handle notification click: mark as read then navigate
  const handleNotificationClick = (n: NotificationDto, tab: string | null) => {
    if (!n.isRead) {
      onMarkRead(n.id);
    }
    setIsOpen(false);
    if (tab && onNavigate) {
      onNavigate(tab);
    }
  };

  return (
    <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      {/* Bell Icon Trigger */}
      <button
        onClick={toggleDropdown}
        style={{
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: '8px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          transition: 'background-color 0.2s',
          backgroundColor: isOpen ? 'rgba(255,255,255,0.08)' : 'transparent',
        }}
        onMouseEnter={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.05)';
        }}
        onMouseLeave={(e) => {
          if (!isOpen) e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <span style={{ fontSize: '20px', display: 'block' }}>🔔</span>

        {unreadCount > 0 && (
          <span
            className="pulse-badge"
            style={{
              position: 'absolute',
              top: '4px',
              right: '4px',
              backgroundColor: '#ef4444',
              color: '#fff',
              borderRadius: '50%',
              padding: '2px 6px',
              fontSize: '10px',
              fontWeight: '700',
              lineHeight: 1,
              minWidth: '18px',
              textAlign: 'center',
              boxShadow: '0 0 10px rgba(239, 68, 68, 0.6)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: '48px',
            right: 0,
            width: '360px',
            borderRadius: '16px',
            border: '1px solid rgba(255, 255, 255, 0.12)',
            background: 'rgba(15, 23, 42, 0.95)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 10px 10px -5px rgba(0, 0, 0, 0.4)',
            zIndex: 9999,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: '#fff' }}>
              Thông Báo Real-time
            </h4>
            {unreadCount > 0 && (
              <button
                onClick={() => {
                  onMarkAllRead();
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: '4px 8px',
                  borderRadius: '6px',
                  transition: 'background-color 0.2s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                Đánh dấu đã đọc tất cả
              </button>
            )}
          </div>

          {/* Notifications Scrollable List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '6px 0' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
                📭 Không có thông báo nào.
              </div>
            ) : (
              notifications.map((n) => {
                const { icon, color, tab } = getTypeDetails(n.type, n.title, n.relatedEntityType);
                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n, tab)}
                    style={{
                      padding: '12px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '12px',
                      cursor: tab ? 'pointer' : 'default',
                      transition: 'background-color 0.2s',
                      backgroundColor: n.isRead ? 'transparent' : 'rgba(56, 189, 248, 0.04)',
                      borderBottom: '1px solid rgba(255,255,255,0.03)',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.03)')}
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.backgroundColor = n.isRead
                        ? 'transparent'
                        : 'rgba(56, 189, 248, 0.04)')
                    }
                    title={tab ? `Nhấn để xem ${tab === 'bookings' ? 'Lịch Học' : 'Ví Tín Dụng'}` : ''}
                  >
                    {/* Icon */}
                    <div
                      style={{
                        fontSize: '18px',
                        backgroundColor: `${color}15`,
                        color: color,
                        width: '32px',
                        height: '32px',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {icon}
                    </div>

                    {/* Content text */}
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          color: '#fff',
                          fontWeight: n.isRead ? 500 : 700,
                          lineHeight: '1.4',
                        }}
                      >
                        {n.title}
                      </div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px', lineHeight: '1.4' }}>
                        {n.message}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>
                        {getElapsedTime(n.createdAt)}
                      </div>
                    </div>

                    {/* Unread indicator dot */}
                    {!n.isRead && (
                      <div
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#38bdf8',
                          boxShadow: '0 0 6px #38bdf8',
                          flexShrink: 0,
                          alignSelf: 'center',
                        }}
                      />
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Pulse badge styling */}
      <style>{`
        @keyframes pulseGlow {
          0% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(239, 68, 68, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
          }
        }
        .pulse-badge {
          animation: pulseGlow 1.5s infinite;
        }
      `}</style>
    </div>
  );
};
