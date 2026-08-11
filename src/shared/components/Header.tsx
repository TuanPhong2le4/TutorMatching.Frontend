import React from 'react';
import { User } from '../../features/auth/types/auth';

interface HeaderProps {
  user: User | null;
  walletBalance: number | null;
  unreadCount: number;
  activeTabTitle: string;
  onMenuToggle: () => void;
  onOpenWallet: () => void;
  onOpenNotifications: () => void;
  onOpenChangePassword: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  walletBalance,
  unreadCount,
  activeTabTitle,
  onMenuToggle,
  onOpenWallet,
  onOpenNotifications,
  onOpenChangePassword,
  onLogout,
}) => {
  const roleNum = Number(user?.role);
  const getRoleBadge = () => {
    if (roleNum === 0 || user?.role === 'Admin') {
      return { text: 'Quản Trị Viên', bg: 'rgba(239, 68, 68, 0.15)', color: '#f87171', border: 'rgba(239, 68, 68, 0.3)' };
    }
    if (roleNum === 1 || user?.role === 'Tutor') {
      return { text: 'Gia Sư', bg: 'rgba(168, 85, 247, 0.15)', color: '#c084fc', border: 'rgba(168, 85, 247, 0.3)' };
    }
    return { text: 'Học Viên', bg: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: 'rgba(56, 189, 248, 0.3)' };
  };

  const badge = getRoleBadge();

  return (
    <header
      style={{
        height: '72px',
        backgroundColor: '#0c1222',
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
          className="lg:hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#f8fafc',
            cursor: 'pointer',
            padding: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
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

      {/* Right: Actions, Wallet, Notifications, Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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

        {/* Realtime Notification Bell */}
        <button
          onClick={onOpenNotifications}
          style={{
            position: 'relative',
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '10px',
            color: '#f8fafc',
            cursor: 'pointer',
            padding: '8px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
          }}
          title="Thông báo"
        >
          <span style={{ fontSize: '16px' }}>🔔</span>
          {unreadCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: '-4px',
                right: '-4px',
                backgroundColor: '#ef4444',
                color: '#ffffff',
                fontSize: '10px',
                fontWeight: 800,
                borderRadius: '999px',
                padding: '1px 5px',
                minWidth: '16px',
                textAlign: 'center',
                boxShadow: '0 0 8px rgba(239, 68, 68, 0.6)',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Info (Hidden on very small screens) */}
        <div
          className="hidden sm:flex"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '4px 8px',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: 700,
              fontSize: '14px',
              color: '#ffffff',
              boxShadow: '0 2px 8px rgba(99, 102, 241, 0.3)',
            }}
          >
            {user?.fullName?.charAt(0).toUpperCase() || 'U'}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#f8fafc', lineHeight: '1.2' }}>
              {user?.fullName || 'Người Dùng'}
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                color: badge.color,
                display: 'inline-block',
                marginTop: '2px',
              }}
            >
              {badge.text}
            </span>
          </div>
        </div>

        {/* Change Password Button */}
        <button
          onClick={onOpenChangePassword}
          className="hidden md:flex"
          style={{
            background: 'rgba(255, 255, 255, 0.05)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#cbd5e1',
            padding: '8px 12px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 500,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Đổi Mật Khẩu"
        >
          <span>🔑</span>
          <span>Đổi Mật Khẩu</span>
        </button>

        {/* Logout Button */}
        <button
          onClick={onLogout}
          style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            color: '#f87171',
            padding: '8px 14px',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.2s ease',
          }}
          title="Đăng Xuất"
        >
          <span>🚪</span>
          <span className="hidden sm:inline">Đăng Xuất</span>
        </button>
      </div>

      <style>{`
        @media (max-width: 639px) {
          .sm\\:flex {
            display: none !important;
          }
          .sm\\:inline {
            display: none !important;
          }
        }
        @media (max-width: 767px) {
          .md\\:flex {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
};
