import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../features/auth/types/auth';
import { NotificationDropdown, type NotificationDto } from '../../features/notifications';
import type { TabType } from './Sidebar';

interface HeaderProps {
  user: User | null;
  walletBalance: number | null;
  notifications: NotificationDto[];
  unreadCount: number;
  activeTabTitle: string;
  onMenuToggle: () => void;
  onOpenWallet: () => void;
  onRefreshNotifications: () => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onNavigateTab: (tab: TabType) => void;
  onOpenProfileEdit?: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  walletBalance,
  notifications,
  unreadCount,
  activeTabTitle,
  onMenuToggle,
  onOpenWallet,
  onRefreshNotifications,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onNavigateTab,
  onOpenProfileEdit,
  onOpenChangePassword,
  onLogout,
}) => {
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const isTutorRole = Number(user?.role) === 1 || user?.role === 'Tutor';

  // Close User Menu on Click Outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const roleNum = Number(user?.role);
  const getRoleSubtitle = () => {
    if (roleNum === 0 || user?.role === 'Admin') {
      return 'System Administrator';
    }
    if (roleNum === 1 || user?.role === 'Tutor') {
      return 'Gia Sư Chuyên Nghiệp';
    }
    return 'Học Viên Nền Tảng';
  };

  const handleUserProfileClick = () => {
    setIsUserMenuOpen(false);
    if (roleNum === 0 || user?.role === 'Admin') {
      onNavigateTab('admin-users');
    } else if (roleNum === 1 || user?.role === 'Tutor') {
      onNavigateTab('bookings');
    } else {
      onNavigateTab('progress');
    }
  };

  const handleChangePasswordClick = () => {
    setIsUserMenuOpen(false);
    onOpenChangePassword();
  };

  const handleLogoutClick = () => {
    setIsUserMenuOpen(false);
    onLogout();
  };

  return (
    <header
      style={{
        height: '72px',
        boxSizing: 'border-box',
        backgroundColor: 'rgba(12, 18, 34, 0.94)',
        backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        position: 'sticky',
        top: 0,
        zIndex: 30,
      }}
    >
      {/* Left: Mobile Hamburger & Page Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button
          onClick={onMenuToggle}
          title="Bật / Tắt Sidebar"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#38bdf8',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          aria-label="Toggle Navigation Menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>

        <div>
          <h1
            style={{
              fontSize: '18px',
              fontWeight: 700,
              color: '#ffffff',
              margin: 0,
              letterSpacing: '-0.01em',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            {activeTabTitle}
          </h1>
        </div>
      </div>

      {/* Right: Wallet Credit, Notifications & Compact User Profile Dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* Wallet Credit Badge */}
        <div
          onClick={onOpenWallet}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            padding: '6px 14px',
            borderRadius: '20px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}
          title="Bấm để xem chi tiết Ví Tín Dụng"
        >
          <span style={{ fontSize: '15px' }}>💎</span>
          <span style={{ color: '#38bdf8', fontWeight: 700, fontSize: '13px', letterSpacing: '0.02em' }}>
            {walletBalance !== null ? `${walletBalance.toLocaleString('vi-VN')} TC` : '...'}
          </span>
        </div>

        {/* Realtime Notification Bell Dropdown */}
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onRefresh={onRefreshNotifications}
          onMarkRead={onMarkNotificationRead}
          onMarkAllRead={onMarkAllNotificationsRead}
          onNavigate={(tab) => onNavigateTab(tab as TabType)}
        />

        {/* COMPACT USER PROFILE DROPDOWN (Matching Target UI in Hình 2) */}
        <div ref={userMenuRef} style={{ position: 'relative' }}>
          {/* User Trigger Button */}
          <div
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 10px',
              borderRadius: '12px',
              cursor: 'pointer',
              backgroundColor: isUserMenuOpen ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
              transition: 'all 0.2s ease',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => {
              if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.05)';
            }}
            onMouseLeave={(e) => {
              if (!isUserMenuOpen) e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {/* Avatar Circle */}
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '15px',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(59, 130, 246, 0.3)',
                flexShrink: 0,
              }}
            >
              {user?.fullName?.charAt(0).toUpperCase() || 'A'}
            </div>

            {/* Name */}
            <div className="hidden sm:flex" style={{ alignItems: 'center' }}>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap' }}>
                {user?.fullName || 'Người Dùng'}
              </span>
            </div>

            {/* Chevron Arrow Icon */}
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#94a3b8"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{
                transition: 'transform 0.2s ease',
                transform: isUserMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              }}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>

          {/* Floating Dropdown Popup Menu */}
          {isUserMenuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '52px',
                right: 0,
                width: '200px',
                backgroundColor: 'rgba(15, 23, 42, 0.98)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                borderRadius: '16px',
                padding: '8px',
                boxShadow: '0 20px 30px -10px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                zIndex: 999,
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
                animation: 'fadeInMenu 0.15s ease-out',
              }}
            >
              {/* Option for Tutor ONLY: Cập Nhật Hồ Sơ Gia Sư */}
              {isTutorRole && (
                <button
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    onOpenProfileEdit?.();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    width: '100%',
                    padding: '10px 12px',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'transparent',
                    color: '#38bdf8',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background-color 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(56, 189, 248, 0.08)')}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  <span>Update Profile</span>
                </button>
              )}

              {/* Option 1: Change Password */}
              <button
                onClick={handleChangePasswordClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#e2e8f0',
                  fontSize: '13px',
                  fontWeight: 500,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <span>Change Password</span>
              </button>

              {/* Divider */}
              <div style={{ height: '1px', backgroundColor: 'rgba(255, 255, 255, 0.08)', margin: '4px 0' }} />

              {/* Option 3: Đăng xuất */}
              <button
                onClick={handleLogoutClick}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  border: 'none',
                  background: 'transparent',
                  color: '#f87171',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background-color 0.15s',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                <span>Đăng xuất</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fadeInMenu {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (max-width: 639px) {
          .sm\\:flex {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
