import React, { useState, useRef, useEffect } from 'react';
import { NotificationDropdown, type NotificationDto } from '../../features/notifications';
import type { User } from '../../features/auth/types/auth';

interface HeaderProps {
  user: User | null;
  walletBalance: number | null;
  isTutorRole: boolean;
  isAdmin: boolean;
  onOpenProfileEdit: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  onTabChange: (tab: any, subTab?: any) => void;
  onToggleSidebar: () => void;
  notifications: NotificationDto[];
  unreadCount: number;
  onRefreshNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  walletBalance,
  isTutorRole,
  isAdmin,
  onOpenProfileEdit,
  onChangePassword,
  onLogout,
  onTabChange,
  onToggleSidebar,
  notifications,
  unreadCount,
  onRefreshNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState<boolean>(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Close user dropdown menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format today's date in Vietnamese format
  const today = new Date();
  const daysOfWeek = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
  const formattedToday = `${daysOfWeek[today.getDay()]}, ${today.getDate()}/${today.getMonth() + 1}/${today.getFullYear()}`;

  const roleText = isAdmin
    ? 'Admin'
    : isTutorRole
    ? 'Gia Sư'
    : 'Học Viên';

  const roleColor = isAdmin ? '#fbbf24' : isTutorRole ? '#c084fc' : '#38bdf8';

  const userInitial = user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U';

  return (
    <header
      style={{
        height: '70px',
        backgroundColor: 'rgba(12, 19, 34, 0.9)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxSizing: 'border-box',
        width: '100%',
      }}
    >
      {/* Left section: Hamburger menu toggle + Date badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onToggleSidebar}
          title="Mở / Thu gọn menu"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            fontSize: '18px',
            transition: 'all 0.2s',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.15)';
            e.currentTarget.style.color = '#38bdf8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            e.currentTarget.style.color = '#cbd5e1';
          }}
        >
          ☰
        </button>

        {/* Date badge (Hidden on mobile via .header-date-badge) */}
        <div
          className="header-date-badge"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            backgroundColor: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '20px',
            fontSize: '13px',
            color: '#94a3b8',
            whiteSpace: 'nowrap',
          }}
        >
          <span>📅</span>
          <span>Hôm nay: {formattedToday}</span>
        </div>
      </div>

      {/* Right section: Tutor Profile update button, Wallet, Notifications, User Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {/* Tutor: Profile Edit Button kept outside on top header */}
        {isTutorRole && (
          <button
            onClick={onOpenProfileEdit}
            style={{
              background: 'rgba(56, 189, 248, 0.12)',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              color: '#38bdf8',
              padding: '7px 12px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.2)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>⚙️</span>
            <span className="tutor-header-btn-text">Cập Nhật Hồ Sơ</span>
          </button>
        )}

        {/* Wallet Balance Pill (for Student & Tutor) */}
        {!isAdmin && (
          <div
            onClick={() => onTabChange('wallet')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: 'rgba(168, 85, 247, 0.12)',
              border: '1px solid rgba(168, 85, 247, 0.3)',
              color: '#c084fc',
              padding: '6px 12px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 700,
              transition: 'all 0.2s',
              whiteSpace: 'nowrap',
            }}
            title="Nhấp để xem ví tín dụng"
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.22)';
              e.currentTarget.style.transform = 'translateY(-1px)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(168, 85, 247, 0.12)';
              e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            <span>💎</span>
            <span>{walletBalance !== null ? walletBalance.toFixed(1) : '...'} tc</span>
          </div>
        )}

        {/* Notification Bell Dropdown */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onRefresh={onRefreshNotifications}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onNavigate={(tab) => onTabChange(tab as any)}
        />

        {/* User Profile Area + Floating Dropdown Menu */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid',
              borderColor: isUserMenuOpen ? 'rgba(56, 189, 248, 0.4)' : 'rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '5px 10px 5px 6px',
              cursor: 'pointer',
              transition: 'all 0.2s',
              textAlign: 'left',
            }}
          >
            {/* User Avatar Circle */}
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '9px',
                background: isAdmin
                  ? 'linear-gradient(135deg, #f59e0b, #ef4444)'
                  : isTutorRole
                  ? 'linear-gradient(135deg, #8b5cf6, #ec4899)'
                  : 'linear-gradient(135deg, #0ea5e9, #6366f1)',
                color: '#fff',
                display: 'grid',
                placeItems: 'center',
                fontWeight: 700,
                fontSize: '14px',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.3)',
                flexShrink: 0,
              }}
            >
              {userInitial}
            </div>

            {/* Name & Role Text (Hidden on mobile via .user-profile-text) */}
            <div className="user-profile-text" style={{ display: 'flex', flexDirection: 'column' }}>
              <span
                style={{
                  fontWeight: 600,
                  fontSize: '13px',
                  color: '#f8fafc',
                  maxWidth: '120px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {user?.fullName || 'Người dùng'}
              </span>
              <span style={{ fontSize: '11px', color: roleColor, fontWeight: 600 }}>
                {roleText}
              </span>
            </div>

            {/* Dropdown Chevron indicator */}
            <span
              style={{
                fontSize: '10px',
                color: '#94a3b8',
                transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease',
                marginLeft: '2px',
              }}
            >
              ▼
            </span>
          </button>

          {/* Floating Dropdown Menu (Contains Change Password and Logout) */}
          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: 'calc(100% + 10px)',
                right: 0,
                width: '230px',
                backgroundColor: '#131b2e',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '14px',
                padding: '8px',
                boxShadow: '0 20px 40px -8px rgba(0, 0, 0, 0.6), 0 0 1px 1px rgba(255, 255, 255, 0.05)',
                zIndex: 500,
                animation: 'fadeIn 0.15s ease-out',
              }}
            >
              {/* Profile summary in dropdown header */}
              <div
                style={{
                  padding: '10px 12px',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
                  marginBottom: '6px',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#f8fafc' }}>
                  {user?.fullName}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', wordBreak: 'break-all' }}>
                  {user?.email || 'Tài khoản hoạt động'}
                </div>
              </div>

              {/* Change Password Menu Item (Only for Student & Tutor, NOT Admin) */}
              {!isAdmin && (
                <>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onChangePassword();
                    }}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      padding: '10px 12px',
                      borderRadius: '8px',
                      border: 'none',
                      backgroundColor: 'transparent',
                      color: '#cbd5e1',
                      fontSize: '13.5px',
                      fontWeight: 500,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.12)';
                      e.currentTarget.style.color = '#38bdf8';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = 'transparent';
                      e.currentTarget.style.color = '#cbd5e1';
                    }}
                  >
                    <span style={{ fontSize: '16px' }}>🔑</span>
                    <span>Đổi Mật Khẩu</span>
                  </button>

                  {/* Divider */}
                  <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.06)', margin: '6px 0' }} />
                </>
              )}

              {/* Logout Menu Item */}
              <button
                onClick={() => {
                  setIsUserMenuOpen(false);
                  onLogout();
                }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: '#f87171',
                  fontSize: '13.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.15)';
                  e.currentTarget.style.color = '#ef4444';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                  e.currentTarget.style.color = '#f87171';
                }}
              >
                <span style={{ fontSize: '16px' }}>🚪</span>
                <span>Đăng Xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
