import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationDto } from '../types/notification';

interface CenterNotificationsProps {
  onNotificationsUpdated?: () => void;
}

export const CenterNotifications: React.FC<CenterNotificationsProps> = ({ onNotificationsUpdated }) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCenterNotifications = async () => {
    try {
      setLoading(true);
      // Fetch 100 recent notifications and filter for System and TutorApproval ones
      const res = await notificationService.getNotifications(1, 100);
      const systemNotifications = (res.items || []).filter(
        (n) => n.type === 'System' || n.type === 'TutorApproved' || n.type === 'TutorRejected' || n.type === 'OverdueClassWarning'
      );
      setNotifications(systemNotifications);
    } catch (err) {
      console.error('Failed to fetch center notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCenterNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      if (onNotificationsUpdated) {
        onNotificationsUpdated();
      }
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const handleMarkAllRead = async () => {
    if (notifications.length === 0 || notifications.every((n) => n.isRead)) return;
    try {
      await notificationService.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      if (onNotificationsUpdated) {
        onNotificationsUpdated();
      }
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${d.toLocaleDateString('vi-VN')} ${d.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  return (
    <div
      className="glass-panel"
      style={{
        padding: '28px',
        borderRadius: '16px',
        border: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '24px',
        }}
      >
        <div>
          <h2
            style={{
              fontSize: '22px',
              fontWeight: 700,
              color: '#fff',
              margin: '0 0 6px 0',
            }}
          >
            📢 Thông báo từ Trung tâm
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            Nơi nhận các thông báo, lịch làm việc hoặc cảnh báo chính thức từ quản trị viên.
          </p>
        </div>

        {notifications.some((n) => !n.isRead) && (
          <button
            onClick={handleMarkAllRead}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              backgroundColor: 'rgba(56, 189, 248, 0.1)',
              color: '#38bdf8',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.1)')}
          >
            ✓ Đọc tất cả
          </button>
        )}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
          <div style={{ fontSize: '24px', marginBottom: '8px' }}>⏳</div>
          Đang tải thông báo...
        </div>
      ) : notifications.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 20px',
            color: '#64748b',
            border: '1px dashed rgba(255,255,255,0.06)',
            borderRadius: '12px',
          }}
        >
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔔</div>
          <h4 style={{ color: '#e2e8f0', margin: '0 0 4px 0', fontSize: '16px' }}>Hộp thư trống</h4>
          <p style={{ margin: 0, fontSize: '13px' }}>
            Bạn chưa nhận được thông báo hay cảnh báo nào từ trung tâm.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {notifications.map((n) => {
            const isComplaint = n.title.includes('Khiếu nại') || n.title.includes('khiếu nại');
            const isWarning = n.title.includes('WARNING') || n.title.includes('Cảnh cáo') || n.type === 'OverdueClassWarning';
            const isApproved = n.type === 'TutorApproved';
            const isRejected = n.type === 'TutorRejected';

            let icon = '📢';
            let iconColor = '#38bdf8';
            let iconBg = 'rgba(56, 189, 248, 0.1)';
            let borderColor = 'rgba(255,255,255,0.06)';
            let itemBg = 'rgba(15, 23, 42, 0.4)';

            if (isComplaint) {
              icon = '🚩';
              iconColor = '#fbbf24';
              iconBg = 'rgba(251, 191, 36, 0.15)';
              borderColor = 'rgba(251, 191, 36, 0.3)';
              itemBg = 'rgba(251, 191, 36, 0.05)';
            } else if (isApproved) {
              icon = '✅';
              iconColor = '#10b981';
              iconBg = 'rgba(16, 185, 129, 0.15)';
              borderColor = 'rgba(16, 185, 129, 0.2)';
              itemBg = 'rgba(16, 185, 129, 0.05)';
            } else if (isRejected) {
              icon = '❌';
              iconColor = '#ef4444';
              iconBg = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(239, 68, 68, 0.2)';
              itemBg = 'rgba(239, 68, 68, 0.05)';
            } else if (isWarning) {
              icon = '⚠️';
              iconColor = '#ef4444';
              iconBg = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(239, 68, 68, 0.2)';
              itemBg = 'rgba(239, 68, 68, 0.05)';
            }

            return (
              <div
                key={n.id}
                onClick={() => !n.isRead && handleMarkRead(n.id)}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: borderColor,
                  backgroundColor: itemBg,
                  position: 'relative',
                  cursor: n.isRead ? 'default' : 'pointer',
                  transition: 'transform 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  if (isApproved) e.currentTarget.style.backgroundColor = 'rgba(16, 185, 129, 0.08)';
                  else if (isRejected) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  else if (isWarning) e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.08)';
                  else e.currentTarget.style.backgroundColor = 'rgba(15, 23, 42, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.backgroundColor = itemBg;
                }}
              >
                {/* Dot for unread */}
                {!n.isRead && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '18px',
                      right: '18px',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: isWarning ? '#ef4444' : '#38bdf8',
                      boxShadow: isWarning
                        ? '0 0 10px #ef4444'
                        : '0 0 10px #38bdf8',
                    }}
                  />
                )}

                {/* Content */}
                <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      fontSize: '22px',
                      padding: '8px',
                      borderRadius: '10px',
                      backgroundColor: iconBg,
                      color: iconColor,
                    }}
                  >
                    {icon}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'baseline',
                        flexWrap: 'wrap',
                        gap: '6px',
                        marginBottom: '6px',
                      }}
                    >
                      <h4
                        style={{
                          margin: 0,
                          fontSize: '15px',
                          fontWeight: 600,
                          color: isApproved ? '#34d399' : (isRejected || isWarning) ? '#f87171' : '#fff',
                        }}
                      >
                        {n.title}
                      </h4>
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#64748b',
                        }}
                      >
                        📅 {formatDate(n.createdAt)}
                      </span>
                    </div>

                    <p
                      style={{
                        margin: 0,
                        fontSize: '14px',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {n.message}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
