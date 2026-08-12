import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notificationService';
import { NotificationDto } from '../types/notification';

interface CenterNotificationsProps {
  onNotificationsUpdated?: () => void;
  onNavigate?: (tab: string) => void;
  isAdmin?: boolean;
  activeTab?: string;
}

export const CenterNotifications: React.FC<CenterNotificationsProps> = ({
  onNotificationsUpdated,
  onNavigate,
  isAdmin = false,
  activeTab,
}) => {
  const [notifications, setNotifications] = useState<NotificationDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState<NotificationDto | null>(null);

  const fetchCenterNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationService.getNotifications(1, 100);
      const items = res.items || [];
      // Show ALL notifications in bell for all roles (Admin, Student, Tutor)
      setNotifications(items);
    } catch (err) {
      console.error('Failed to fetch center notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Reset selected complaint and re-fetch when switching tabs or when component mounts / activeTab changes to notification center
    if (!activeTab || activeTab === 'center-notifications' || activeTab === 'admin-notifications') {
      setSelectedComplaint(null);
      fetchCenterNotifications();
    }
  }, [isAdmin, activeTab]);

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

  const getNotificationTarget = (n: NotificationDto) => {
    const title = n.title || '';
    if (title.includes('Khiếu nại') || title.includes('khiếu nại')) {
      return { tab: 'bookings', label: 'Quản Lý Lịch Học (/bookings)', path: '/bookings' };
    }
    if (n.type === 'TutorApprovalRequest' || n.type === 'TutorApproved' || n.type === 'TutorRejected') {
      return isAdmin
        ? { tab: 'admin-tutors', label: 'Duyệt Hồ Sơ Gia Sư (/admin-tutors)', path: '/admin-tutors' }
        : { tab: 'home', label: 'Trang Chủ (/home)', path: '/home' };
    }
    if (n.type === 'CreditChanged' || n.relatedEntityType === 'DepositRequest' || title.includes('nạp tiền') || title.includes('tín dụng')) {
      return { tab: 'wallet', label: 'Ví Tín Dụng (/wallet)', path: '/wallet' };
    }
    if (n.type === 'ReviewReceived') {
      return isAdmin
        ? { tab: 'admin-reviews', label: 'Quản Lý Đánh Giá (/admin-reviews)', path: '/admin-reviews' }
        : { tab: 'home', label: 'Trang Chủ & Đánh Giá (/home)', path: '/home' };
    }
    if (n.type.startsWith('Booking') || n.type === 'OverdueClassWarning') {
      return { tab: 'bookings', label: 'Quản Lý Lịch Học (/bookings)', path: '/bookings' };
    }
    return isAdmin
      ? { tab: 'admin-notifications', label: 'Trung Tâm Thông Báo (/admin-notifications)', path: '/admin-notifications' }
      : { tab: 'center-notifications', label: 'Trung Tâm Thông Báo (/center-notifications)', path: '/center-notifications' };
  };

  const handleNotificationClick = (n: NotificationDto) => {
    if (!n.isRead) {
      handleMarkRead(n.id);
    }
    const isComplaint = n.title.includes('Khiếu nại') || n.title.includes('khiếu nại');
    if (isComplaint) {
      setSelectedComplaint(n);
    } else {
      const target = getNotificationTarget(n);
      if (onNavigate) {
        onNavigate(target.tab);
      }
    }
  };

  // IF A COMPLAINT IS SELECTED: Render clean direct Card View (Matching Hình 2, no overlay)
  if (selectedComplaint) {
    return (
      <div
        className="glass-panel"
        style={{
          padding: '28px',
          borderRadius: '16px',
          border: '1px solid rgba(251, 191, 36, 0.4)',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Top Header with Back Button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={() => setSelectedComplaint(null)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#38bdf8',
                borderRadius: '8px',
                padding: '6px 12px',
                cursor: 'pointer',
                fontSize: '13px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              ⬅️ Quay lại danh sách
            </button>
            <span style={{ fontSize: '24px' }}>🚩</span>
            <h3 style={{ margin: 0, color: '#fbbf24', fontSize: '20px', fontWeight: 700 }}>
              Chi Tiết Khiếu Nại Của Học Sinh
            </h3>
          </div>
          <button
            onClick={() => setSelectedComplaint(null)}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '22px',
              cursor: 'pointer',
            }}
            title="Đóng chi tiết khiếu nại"
          >
            ✕
          </button>
        </div>

        {/* Title */}
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Tiêu đề thông báo:</label>
          <div style={{ fontWeight: 600, color: '#fff', fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>🚩</span>
            <span>{selectedComplaint.title}</span>
          </div>
        </div>

        {/* Message details box */}
        <div style={{ marginBottom: '24px', backgroundColor: 'rgba(251, 191, 36, 0.06)', padding: '20px', borderRadius: '12px', border: '1px solid rgba(251, 191, 36, 0.25)' }}>
          <label style={{ fontSize: '13px', color: '#fbbf24', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
            📝 Lý do khiếu nại chi tiết từ học sinh:
          </label>
          <div style={{ color: '#f1f5f9', fontSize: '15px', lineHeight: '1.6', whiteSpace: 'pre-wrap', fontWeight: 500 }}>
            "{selectedComplaint.message}"
          </div>
        </div>

        {/* Timestamp */}
        <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          ⏰ Thời gian gửi khiếu nại: <strong>{formatDate(selectedComplaint.createdAt)}</strong>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <button
            onClick={() => setSelectedComplaint(null)}
            style={{
              padding: '10px 20px',
              backgroundColor: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.12)',
              color: '#cbd5e1',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 600,
            }}
          >
            Đóng
          </button>

          <button
            onClick={() => {
              setSelectedComplaint(null);
              if (onNavigate) onNavigate('bookings');
            }}
            style={{
              padding: '10px 20px',
              backgroundColor: '#a855f7',
              border: 'none',
              color: '#fff',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: 'pointer',
              fontSize: '14px',
              boxShadow: '0 4px 12px rgba(168, 85, 247, 0.3)',
            }}
          >
            🗓️ Chuyển Tới Quản Lý Lịch Học (/bookings)
          </button>
        </div>
      </div>
    );
  }

  // MAIN NOTIFICATION LIST VIEW
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
            📢 {isAdmin ? 'Trung Tâm Thông Báo Hệ Thống & Khiếu Nại' : 'Thông báo từ Trung tâm'}
          </h2>
          <p style={{ color: '#64748b', fontSize: '14px', margin: 0 }}>
            {isAdmin
              ? 'Tất cả thông báo hệ thống, yêu cầu duyệt gia sư, nạp tiền và các khiếu nại nghiêm trọng từ học sinh.'
              : 'Nơi nhận các thông báo, lịch làm việc hoặc cảnh báo chính thức từ quản trị viên.'}
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
            const isDeposit = n.relatedEntityType === 'DepositRequest' || n.title.includes('nạp tiền');
            const isTutorReq = n.type === 'TutorApprovalRequest';

            let icon = '📢';
            let iconColor = '#38bdf8';
            let iconBg = 'rgba(56, 189, 248, 0.1)';
            let borderColor = 'rgba(255,255,255,0.06)';
            let itemBg = 'rgba(15, 23, 42, 0.4)';
            let badgeText = 'THÔNG BÁO';

            if (isComplaint) {
              icon = '🚩';
              iconColor = '#fbbf24';
              iconBg = 'rgba(251, 191, 36, 0.15)';
              borderColor = 'rgba(251, 191, 36, 0.3)';
              itemBg = 'rgba(251, 191, 36, 0.05)';
              badgeText = '🚩 KHIẾU NẠI NGHIÊM TRỌNG';
            } else if (isTutorReq) {
              icon = '📝';
              iconColor = '#fbbf24';
              iconBg = 'rgba(251, 191, 36, 0.15)';
              borderColor = 'rgba(251, 191, 36, 0.3)';
              itemBg = 'rgba(251, 191, 36, 0.04)';
              badgeText = 'YÊU CẦU DUYỆT GIA SƯ';
            } else if (isDeposit) {
              icon = '💳';
              iconColor = '#34d399';
              iconBg = 'rgba(52, 211, 153, 0.15)';
              borderColor = 'rgba(52, 211, 153, 0.2)';
              itemBg = 'rgba(52, 211, 153, 0.04)';
              badgeText = 'NẠP TIỀN / VÍ TÍN DỤNG';
            } else if (isApproved) {
              icon = '✅';
              iconColor = '#10b981';
              iconBg = 'rgba(16, 185, 129, 0.15)';
              borderColor = 'rgba(16, 185, 129, 0.2)';
              itemBg = 'rgba(16, 185, 129, 0.05)';
              badgeText = 'ĐÃ DUYỆT HỒ SƠ';
            } else if (isRejected) {
              icon = '❌';
              iconColor = '#ef4444';
              iconBg = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(239, 68, 68, 0.2)';
              itemBg = 'rgba(239, 68, 68, 0.05)';
              badgeText = 'TỪ CHỐI HỒ SƠ';
            } else if (isWarning) {
              icon = '⚠️';
              iconColor = '#ef4444';
              iconBg = 'rgba(239, 68, 68, 0.15)';
              borderColor = 'rgba(239, 68, 68, 0.2)';
              itemBg = 'rgba(239, 68, 68, 0.05)';
              badgeText = 'CẢNH BÁO';
            }

            const target = getNotificationTarget(n);

            return (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: '18px',
                  borderRadius: '12px',
                  border: borderColor,
                  backgroundColor: itemBg,
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, background-color 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
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
                      backgroundColor: isComplaint || isWarning ? '#ef4444' : '#38bdf8',
                      boxShadow: isComplaint || isWarning
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: iconColor,
                            backgroundColor: iconBg,
                            padding: '2px 8px',
                            borderRadius: '6px',
                            letterSpacing: '0.03em'
                          }}
                        >
                          {badgeText}
                        </span>
                        <h4
                          style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: 600,
                            color: isApproved ? '#34d399' : (isRejected || isWarning || isComplaint) ? '#f87171' : '#fff',
                          }}
                        >
                          {n.title}
                        </h4>
                      </div>
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
                        margin: '6px 0',
                        fontSize: '14px',
                        color: '#cbd5e1',
                        lineHeight: '1.5',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {n.message}
                    </p>

                    {/* Action buttons on card */}
                    <div style={{ display: 'flex', gap: '10px', marginTop: '10px', flexWrap: 'wrap' }}>
                      {isComplaint && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!n.isRead) handleMarkRead(n.id);
                            setSelectedComplaint(n);
                          }}
                          style={{
                            padding: '5px 12px',
                            backgroundColor: 'rgba(251, 191, 36, 0.2)',
                            border: '1px solid rgba(251, 191, 36, 0.4)',
                            color: '#fbbf24',
                            borderRadius: '6px',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          🔍 Xem Chi Tiết Lý Do Khiếu Nại
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (!n.isRead) handleMarkRead(n.id);
                          if (onNavigate) onNavigate(target.tab);
                        }}
                        style={{
                          padding: '5px 12px',
                          backgroundColor: 'rgba(56, 189, 248, 0.15)',
                          border: '1px solid rgba(56, 189, 248, 0.3)',
                          color: '#38bdf8',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        🔗 Chuyển Tới {target.label}
                      </button>
                    </div>
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
